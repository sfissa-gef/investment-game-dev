import { useEffect, useState } from 'react';
import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { assignVersion } from '../lib/randomize.js';
import { db, getConfig, setConfig } from '../lib/db.js';
import { t } from '../i18n/index.js';

const DEFAULT_RATES = { UG: 100, ZM: 5 };
const TREATMENT_GROUPS = ['Control', 'B1', 'B2', 'B3'];

export default function EnumeratorSetup() {
  const newSession = useGameStore((s) => s.newSession);
  const transition = useGameStore((s) => s.transition);

  const [form, setForm] = useState({
    participantId: '',
    enumeratorId: '',
    country: 'UG',
    partner: 'OAF',
    treatmentGroup: '',
    currencyRate: DEFAULT_RATES.UG,
    audioRecordingEnabled: false,
  });
  const [lookup, setLookup] = useState(null); // { found: bool, source: 'csv' | null }

  useEffect(() => {
    (async () => {
      const lastEnumeratorId = await getConfig('last_enumerator_id', '');
      if (lastEnumeratorId) setForm((f) => ({ ...f, enumeratorId: lastEnumeratorId }));
    })();
  }, []);

  const update = (k, v) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'country') next.currencyRate = DEFAULT_RATES[v] ?? f.currencyRate;
      return next;
    });
  };

  const lookupParticipant = async () => {
    const id = form.participantId.trim();
    if (!id) { setLookup(null); return; }
    const row = await db.participants.get(id);
    if (!row) { setLookup({ found: false }); return; }
    setLookup({ found: true });
    setForm((f) => ({
      ...f,
      treatmentGroup: row.treatmentGroup || f.treatmentGroup,
      country: row.country || f.country,
      partner: row.partner || f.partner,
      currencyRate: row.country && DEFAULT_RATES[row.country] ? DEFAULT_RATES[row.country] : f.currencyRate,
    }));
  };

  const start = async () => {
    if (!form.participantId || !form.enumeratorId || !form.treatmentGroup) return;
    await setConfig('last_enumerator_id', form.enumeratorId);
    const round2Version = assignVersion(form.participantId);
    await newSession({ ...form, round2Version });
    transition(SCREENS.LANGUAGE_SELECT);
  };

  const Field = ({ label, children }) => (
    <label className="flex flex-col gap-1 text-body">
      <span className="text-badge uppercase tracking-wide text-ink/60">{label}</span>
      {children}
    </label>
  );

  const inputClass = 'min-h-touch rounded-lg border border-ink/15 bg-white px-4 py-3 text-body focus:border-action-green focus:outline-none';
  const Toggle = ({ options, value, onChange }) => (
    <div className="inline-flex rounded-lg bg-ink/5 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`min-h-touch rounded-md px-5 py-2 text-body transition ${
            value === o.value ? 'bg-white shadow-soft font-semibold' : 'text-ink/70'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex h-full w-full items-center justify-center bg-canvas px-10">
      <div className="card w-[760px] p-10 animate-fade-up">
        <p className="text-badge uppercase tracking-[0.2em] text-ink/50">Enumerator only</p>
        <h1 className="mt-1 text-heading tracking-tight">{t('enumerator.title')}</h1>

        <div className="mt-8 grid grid-cols-2 gap-5">
          <Field label={t('enumerator.participantId')}>
            <input
              className={inputClass}
              value={form.participantId}
              onChange={(e) => { update('participantId', e.target.value.trim()); setLookup(null); }}
              onBlur={lookupParticipant}
            />
            {lookup?.found && <span className="chip chip-ok mt-1 w-fit">Auto-filled from participant list</span>}
            {lookup && !lookup.found && form.participantId && (
              <span className="chip chip-warn mt-1 w-fit">Not in imported list — fill manually</span>
            )}
          </Field>
          <Field label={t('enumerator.enumeratorId')}>
            <input className={inputClass} value={form.enumeratorId}
              onChange={(e) => update('enumeratorId', e.target.value.trim())} />
          </Field>

          <Field label={t('enumerator.country')}>
            <Toggle value={form.country} onChange={(v) => update('country', v)}
              options={[{ value: 'UG', label: 'Uganda' }, { value: 'ZM', label: 'Zambia' }]} />
          </Field>
          <Field label={t('enumerator.partner')}>
            <Toggle value={form.partner} onChange={(v) => update('partner', v)}
              options={[{ value: 'OAF', label: 'One Acre Fund' }, { value: 'Solidaridad', label: 'Solidaridad' }]} />
          </Field>

          <Field label="Treatment group (main study)">
            <div className="inline-flex rounded-lg bg-ink/5 p-1">
              {TREATMENT_GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => update('treatmentGroup', g)}
                  className={`min-h-touch rounded-md px-4 py-2 text-body transition ${
                    form.treatmentGroup === g ? 'bg-white shadow-soft font-semibold' : 'text-ink/70'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t('enumerator.currencyRate')}>
            <input type="number" min={0} className={inputClass}
              value={form.currencyRate}
              onChange={(e) => update('currencyRate', Number(e.target.value))} />
          </Field>

          <div className="col-span-2">
            <label className="flex items-center gap-3 rounded-lg bg-ink/5 px-4 py-3 text-body">
              <input type="checkbox" className="h-5 w-5" checked={form.audioRecordingEnabled}
                onChange={(e) => update('audioRecordingEnabled', e.target.checked)} />
              {t('enumerator.recording')}
            </label>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <span className="text-badge text-ink/50">Version A/B assignment is automatic from Participant ID.</span>
          <button
            className="btn-primary"
            disabled={!form.participantId || !form.enumeratorId || !form.treatmentGroup}
            onClick={start}
          >
            {t('enumerator.start')}
          </button>
        </div>
      </div>
    </div>
  );
}
