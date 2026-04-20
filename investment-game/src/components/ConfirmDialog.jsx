import { t } from '../i18n/index.js';

export default function ConfirmDialog({ open, onCancel, onConfirm, title, body }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="w-[640px] rounded-2xl bg-white p-8 text-center shadow-2xl">
        <h2 className="text-heading">{title || t('decision.confirm.title')}</h2>
        <p className="mt-3 text-body">{body || t('decision.confirm.body')}</p>
        <div className="mt-8 flex items-center justify-between gap-6">
          <button
            onClick={onCancel}
            className="min-h-touch flex-1 rounded-xl bg-earth-brown px-6 py-4 text-body text-white"
          >
            {t('decision.confirm.goBack')}
          </button>
          <button
            onClick={onConfirm}
            className="min-h-touch flex-1 rounded-xl bg-action-green px-6 py-4 text-body text-white"
          >
            {t('decision.confirm.plant')}
          </button>
        </div>
      </div>
    </div>
  );
}
