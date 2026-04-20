import { useEffect, useRef, useState } from 'react';
import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';

const QUESTIONS = [
  { id: 'gender', label: 'Gender', type: 'choice', options: ['Woman', 'Man', 'Other', 'Prefer not to say'] },
  { id: 'ageRange', label: 'Age range', type: 'choice', options: ['18–24', '25–34', '35–44', '45–54', '55+'] },
  { id: 'educationLevel', label: 'Highest education', type: 'choice', options: ['None', 'Primary', 'Secondary', 'Tertiary'] },
  { id: 'householdSize', label: 'People in household', type: 'number' },
  { id: 'mainCrop', label: 'Main crop', type: 'choice', options: ['Maize', 'Beans', 'Cassava', 'Groundnut', 'Other'] },
  { id: 'hasPurchasedInsurance', label: 'Have you ever purchased crop insurance?', type: 'choice', options: ['Yes', 'No', 'Don\'t know'] },
  { id: 'comprehension1', label: 'If you plant seeds and the rain is good, how many tokens do you earn?', type: 'choice', options: ['0', '10', '30', '45'], correct: '30' },
  { id: 'comprehension2', label: 'If you buy insurance and the rain is bad, how many tokens do you receive?', type: 'choice', options: ['0', '10', '20', '30'], correct: '10' },
  { id: 'comprehension3', label: 'What is your budget each round?', type: 'choice', options: ['10', '15', '25', '50'], correct: '25' },
];

export default function Survey() {
  const transition = useGameStore((s) => s.transition);
  const updateSession = useGameStore((s) => s.updateSession);
  const [answers, setAnswers] = useState({});
  const startRef = useRef(new Date().toISOString());
  const qStartRef = useRef({});

  useEffect(() => {
    logEvent(SCREENS.SURVEY, 'screen_enter', {});
  }, []);

  const set = (id, v) => {
    const prev = answers[id] ?? null;
    const time = qStartRef.current[id] ? performance.now() - qStartRef.current[id] : null;
    logEvent(SCREENS.SURVEY, prev == null ? 'survey_answer' : 'survey_answer_change', {
      question_id: id, old_answer: prev, new_answer: v, answer: v, time_ms: time,
    });
    setAnswers((a) => ({ ...a, [id]: v }));
  };

  const markStart = (id) => {
    if (!qStartRef.current[id]) qStartRef.current[id] = performance.now();
  };

  const submit = async () => {
    const survey = {
      ...answers,
      comprehension1Correct: answers.comprehension1 === '30',
      comprehension2Correct: answers.comprehension2 === '10',
      comprehension3Correct: answers.comprehension3 === '25',
      surveyStartTime: startRef.current,
      surveyEndTime: new Date().toISOString(),
    };
    await updateSession({ survey });
    transition(SCREENS.COMPLETION);
  };

  const allAnswered = QUESTIONS.every((q) => answers[q.id] != null && answers[q.id] !== '');

  return (
    <div className="flex h-full w-full flex-col bg-canvas px-10 py-6">
      <h1 className="text-heading">A few questions</h1>
      <div className="mt-4 flex-1 overflow-y-auto pr-2">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="mb-4 rounded-xl bg-white p-4 shadow-sm" onFocus={() => markStart(q.id)}>
            <p className="text-body font-semibold">{q.label}</p>
            {q.type === 'choice' ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    className={`min-h-touch rounded-lg px-4 py-2 text-body ${
                      answers[q.id] === opt ? 'bg-action-green text-white' : 'bg-ink/10 text-ink'
                    }`}
                    onClick={() => { markStart(q.id); set(q.id, opt); }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="number"
                className="mt-2 w-40 rounded border p-2 text-body"
                value={answers[q.id] ?? ''}
                onFocus={() => markStart(q.id)}
                onChange={(e) => set(q.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <button
        className="self-end rounded-xl bg-action-green px-10 py-4 text-body text-white disabled:opacity-40"
        disabled={!allAnswered}
        onClick={submit}
      >
        Submit
      </button>
    </div>
  );
}
