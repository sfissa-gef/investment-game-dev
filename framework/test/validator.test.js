import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateText, validateFile } from '../schema/validator.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ZM_UG  = path.join(here, '..', 'examples', 'zm-ug-investment', 'game-spec.yml');
const SIMPLE = path.join(here, '..', 'examples', 'simple-fertilizer', 'game-spec.yml');

// ─────────────────────────────────────────────────────────────────────
// Happy path — both example specs validate
// ─────────────────────────────────────────────────────────────────────

test('zm-ug-investment example validates', () => {
  const result = validateFile(ZM_UG);
  assert.equal(result.ok, true, JSON.stringify(result.errors || [], null, 2));
  assert.equal(result.spec.metadata.studyId, 'zm-ug-investment');
  assert.equal(result.spec.rounds.length, 3);
  assert.ok(result.spec.rounds[2].versions);
  assert.equal(result.spec.rounds[2].versions.length, 2);
});

test('simple-fertilizer example validates', () => {
  const result = validateFile(SIMPLE);
  assert.equal(result.ok, true, JSON.stringify(result.errors || [], null, 2));
  assert.equal(result.spec.rounds.length, 1);
});

// ─────────────────────────────────────────────────────────────────────
// Structural failures — Zod layer
// ─────────────────────────────────────────────────────────────────────

test('rejects unknown apiVersion', () => {
  const bad = fs.readFileSync(SIMPLE, 'utf8').replace('game-spec/v1', 'game-spec/v99');
  const result = validateText(bad);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'structural');
});

test('rejects round with both decisions and versions', () => {
  const bad = `
apiVersion: game-spec/v1
metadata: { studyId: bad, name: bad, countries: [XX], languages: [en] }
constants: { budgetPerRound: 25 }
resources: { fertilizer: { kind: stepper, min: 0, max: 10, pricePerUnit: 1 } }
weather: { outcomes: [good, bad], probabilities: { good: 0.8, bad: 0.2 }, seedPerRound: true }
payoutFormulas: {}
rounds:
  - id: r1
    countsTowardPayment: true
    decisions: [fertilizer]
    versions:
      - id: A
        assignmentHash: { op: '<', threshold: 0.5 }
        decisions: [fertilizer]
        payouts: { totalTokens: "0" }
    payouts: { totalTokens: "0" }
instructions: { sequence: [] }
survey: { questions: [] }
branding: { primaryColor: "#000" }
narrationDir: "./n"
i18nDir: "./i"
`;
  const result = validateText(bad);
  assert.equal(result.ok, false);
});

// ─────────────────────────────────────────────────────────────────────
// Semantic failures — own layer
// ─────────────────────────────────────────────────────────────────────

test('flags weather probabilities that do not sum to 1', () => {
  const bad = fs.readFileSync(SIMPLE, 'utf8')
    .replace('good: 0.70, bad: 0.30', 'good: 0.60, bad: 0.30');
  const result = validateText(bad);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'semantic');
  assert.ok(result.errors.some((e) => e.path.includes('weather.probabilities')));
});

test('flags resource.requires pointing at unknown resource', () => {
  const bad = fs.readFileSync(ZM_UG, 'utf8').replace('requires: [seeds]', 'requires: [rocket_fuel]');
  const result = validateText(bad);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'semantic');
  assert.ok(result.errors.some((e) => e.msg.includes("'rocket_fuel'")));
});

test('flags round.decisions pointing at unknown resource', () => {
  const bad = fs.readFileSync(SIMPLE, 'utf8').replace('decisions: [fertilizer]', 'decisions: [ghost]');
  const result = validateText(bad);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'semantic');
  assert.ok(result.errors.some((e) => e.msg.includes("'ghost'")));
});

test('flags formula referencing undefined identifier', () => {
  const bad = fs.readFileSync(SIMPLE, 'utf8').replace('savings + fertilizerHarvest', 'savings + mystery');
  const result = validateText(bad);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'semantic');
  assert.ok(result.errors.some((e) => e.msg.includes("'mystery'")));
});

test('accepts formula cross-referencing another formula in same block', () => {
  // totalTokens references savings + fertilizerHarvest, both defined alongside it
  const result = validateFile(SIMPLE);
  assert.equal(result.ok, true);
});

test('flags assignment arms that do not partition [0,1]', () => {
  const bad = fs.readFileSync(ZM_UG, 'utf8').replace(
    'op: ">=", threshold: 0.5',
    'op: ">=", threshold: 0.7',
  );
  const result = validateText(bad);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'semantic');
  assert.ok(result.errors.some((e) => e.msg.includes('assignment')));
});
