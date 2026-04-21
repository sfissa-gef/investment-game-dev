#!/usr/bin/env node
// Investment-Game framework — spec validator.
//
// Structural validation via Zod + YAML parsing. Also runs lightweight semantic
// checks:
//   - every resource referenced in round.decisions exists
//   - every formula identifier references a known field
//   - resource.requires references other known resources
//   - weather probabilities sum to 1
//
// CLI:
//   node schema/validator.mjs <path-to-game-spec.yml>
//   → exit 0 and "✓ valid" on success
//   → exit 1 and structured errors on failure
//   → exit 2 on usage error

import { z } from 'zod';
import yaml from 'yaml';
import fs from 'node:fs';
import path from 'node:path';

// ─────────────────────────────────────────────────────────────────────
// Structural schema (Zod)
// ─────────────────────────────────────────────────────────────────────

const ResourceStepper = z.object({
  kind: z.literal('stepper'),
  min: z.number().int(),
  max: z.number().int(),
  pricePerUnit: z.number().nonnegative(),
  requires: z.array(z.string()).default([]),
});
const ResourceToggle = z.object({
  kind: z.literal('toggle'),
  price: z.number().nonnegative(),
  requires: z.array(z.string()).default([]),
});
const Resource = z.discriminatedUnion('kind', [ResourceStepper, ResourceToggle]);

const PayoutMap = z.record(z.string(), z.string());

const VersionArm = z.object({
  id: z.string().min(1),
  assignmentHash: z.object({
    op: z.enum(['<', '>=']),
    threshold: z.number().min(0).max(1),
  }),
  decisions: z.array(z.string()).min(1),
  payouts: PayoutMap,
});

const Round = z.object({
  id: z.string().min(1),
  countsTowardPayment: z.boolean(),
  decisions: z.array(z.string()).optional(),
  payouts: PayoutMap.optional(),
  versions: z.array(VersionArm).optional(),
}).refine(
  (r) => (r.versions && r.versions.length > 0) !== (r.decisions && r.decisions.length > 0),
  { message: 'A round must have either `decisions` (single-arm) or `versions` (treatment arms), not both and not neither.' }
).refine(
  (r) => r.versions || r.payouts,
  { message: 'A single-arm round must specify `payouts`.' }
);

const SurveyQuestion = z.object({
  id: z.string().min(1),
  type: z.enum(['numeric', 'single-choice', 'multi-choice', 'text', 'likert']),
  prompt: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

const Spec = z.object({
  apiVersion: z.literal('game-spec/v1'),
  metadata: z.object({
    studyId: z.string().min(1),
    name: z.string().min(1),
    countries: z.array(z.string()).min(1),
    languages: z.array(z.string()).min(1),
    defaultLanguage: z.string().optional(),
  }),
  constants: z.record(z.string(), z.number()),
  resources: z.record(z.string(), Resource),
  weather: z.object({
    outcomes: z.array(z.string()).min(1),
    probabilities: z.record(z.string(), z.number()),
    seedPerRound: z.boolean().default(true),
  }),
  payoutFormulas: PayoutMap.default({}),
  rounds: z.array(Round).min(1),
  instructions: z.object({
    sequence: z.array(z.string()).default([]),
    perRound: z.record(z.string(), z.record(z.string(), z.array(z.string()))).optional(),
  }),
  videoOffer: z.object({
    enabled: z.boolean(),
    cost: z.number().optional(),
    narrationByVersion: z.record(z.string(), z.string()).optional(),
  }).optional(),
  survey: z.object({
    questions: z.array(SurveyQuestion).default([]),
  }),
  branding: z.object({
    primaryColor: z.string(),
    logo: z.string().optional(),
  }),
  narrationDir: z.string(),
  i18nDir: z.string(),
  // Informational only — lists what a spec can NOT change. Validators enforce
  // nothing from this block; the runtime does.
  locked: z.record(z.string(), z.string()).optional(),
});

// ─────────────────────────────────────────────────────────────────────
// Semantic checks
// ─────────────────────────────────────────────────────────────────────

// Pull identifiers out of a formula string. Approximate: anything matching
// [A-Za-z_][A-Za-z0-9_]* that isn't a literal keyword.
const KEYWORDS = new Set([
  'true', 'false', 'null',
  'good', 'bad',  // weather literals
]);
function identifiersIn(formula) {
  const found = new Set();
  const re = /[A-Za-z_][A-Za-z0-9_]*/g;
  let m;
  while ((m = re.exec(formula))) {
    if (!KEYWORDS.has(m[0])) found.add(m[0]);
  }
  return found;
}

function semanticCheck(spec) {
  const issues = [];

  // Weather probabilities must sum to 1.0 and cover all outcomes.
  const probSum = Object.values(spec.weather.probabilities).reduce((s, p) => s + p, 0);
  if (Math.abs(probSum - 1) > 1e-9) {
    issues.push({ path: 'weather.probabilities', msg: `probabilities sum to ${probSum}, expected 1.0` });
  }
  for (const outcome of spec.weather.outcomes) {
    if (!(outcome in spec.weather.probabilities)) {
      issues.push({ path: `weather.probabilities.${outcome}`, msg: `missing probability for outcome '${outcome}'` });
    }
  }

  // Resource.requires must reference other defined resources.
  for (const [resName, res] of Object.entries(spec.resources)) {
    for (const req of res.requires || []) {
      if (!spec.resources[req]) {
        issues.push({ path: `resources.${resName}.requires`, msg: `'${req}' is not a defined resource` });
      }
    }
  }

  // All round.decisions / version.decisions must reference defined resources.
  for (const [i, r] of spec.rounds.entries()) {
    const checkDecisions = (ds, where) => {
      for (const d of ds) {
        if (!spec.resources[d]) {
          issues.push({ path: `rounds[${i}].${where}`, msg: `'${d}' is not a defined resource` });
        }
      }
    };
    if (r.decisions) checkDecisions(r.decisions, 'decisions');
    if (r.versions) {
      for (const v of r.versions) checkDecisions(v.decisions, `versions.${v.id}.decisions`);
    }
  }

  // Version assignmentHash thresholds for a single round must partition [0,1].
  for (const [i, r] of spec.rounds.entries()) {
    if (!r.versions) continue;
    const thresholds = r.versions
      .map((v) => ({ id: v.id, op: v.assignmentHash.op, threshold: v.assignmentHash.threshold }))
      .sort((a, b) => a.threshold - b.threshold);
    // Simple two-arm case: {<, threshold} and {>=, threshold} must match.
    if (thresholds.length === 2) {
      const [a, b] = thresholds;
      if (!(a.op === '<' && b.op === '>=' && a.threshold === b.threshold)) {
        issues.push({
          path: `rounds[${i}].versions`,
          msg: 'two-arm assignment must be { op: "<", threshold: t } and { op: ">=", threshold: t } with the same t',
        });
      }
    } else if (thresholds.length !== 1) {
      issues.push({
        path: `rounds[${i}].versions`,
        msg: 'only 1- and 2-arm rounds are supported in v1 (got ' + thresholds.length + ')',
      });
    }
  }

  // Formula identifiers must resolve to known names.
  const scope = new Set([
    // Constants
    ...Object.keys(spec.constants),
    // Resources
    ...Object.keys(spec.resources),
    // Derived payout aliases
    ...Object.keys(spec.payoutFormulas || {}),
    // Runtime-provided context
    'weather', 'videoChosen',
  ]);
  const checkFormulas = (formulas, where) => {
    for (const [name, formula] of Object.entries(formulas || {})) {
      for (const id of identifiersIn(formula)) {
        if (scope.has(id)) continue;
        // Allow references to other formulas in the same block (e.g. "savings + fertilizerHarvest")
        if (Object.prototype.hasOwnProperty.call(formulas, id)) continue;
        issues.push({ path: `${where}.${name}`, msg: `unknown identifier '${id}' in formula '${formula}'` });
      }
    }
  };
  checkFormulas(spec.payoutFormulas, 'payoutFormulas');
  for (const [i, r] of spec.rounds.entries()) {
    if (r.payouts) {
      // Merge the round's local payout names into scope for self-references
      const localScope = new Set([...scope, ...Object.keys(r.payouts)]);
      for (const [name, formula] of Object.entries(r.payouts)) {
        for (const id of identifiersIn(formula)) {
          if (localScope.has(id)) continue;
          issues.push({ path: `rounds[${i}].payouts.${name}`, msg: `unknown identifier '${id}' in '${formula}'` });
        }
      }
    }
    if (r.versions) {
      for (const v of r.versions) {
        const localScope = new Set([...scope, ...Object.keys(v.payouts)]);
        for (const [name, formula] of Object.entries(v.payouts)) {
          for (const id of identifiersIn(formula)) {
            if (localScope.has(id)) continue;
            issues.push({ path: `rounds[${i}].versions.${v.id}.payouts.${name}`, msg: `unknown identifier '${id}' in '${formula}'` });
          }
        }
      }
    }
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────

export function validateText(yamlText) {
  let parsed;
  try {
    parsed = yaml.parse(yamlText);
  } catch (err) {
    return { ok: false, stage: 'yaml', errors: [{ path: '(root)', msg: String(err.message || err) }] };
  }
  const structural = Spec.safeParse(parsed);
  if (!structural.success) {
    return {
      ok: false,
      stage: 'structural',
      errors: structural.error.issues.map((i) => ({ path: i.path.join('.') || '(root)', msg: i.message })),
    };
  }
  const semIssues = semanticCheck(structural.data);
  if (semIssues.length > 0) {
    return { ok: false, stage: 'semantic', errors: semIssues, spec: structural.data };
  }
  return { ok: true, spec: structural.data };
}

export function validateFile(filepath) {
  const text = fs.readFileSync(filepath, 'utf8');
  return validateText(text);
}

// ─────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node schema/validator.mjs <path-to-game-spec.yml>');
    process.exit(2);
  }
  if (!fs.existsSync(file)) {
    console.error(`✗ file not found: ${file}`);
    process.exit(2);
  }
  const result = validateFile(file);
  const rel = path.relative(process.cwd(), path.resolve(file));
  if (result.ok) {
    console.log(`✓ valid   ${rel}`);
    console.log(`   ${result.spec.metadata.studyId}: ${result.spec.metadata.name}`);
    console.log(`   ${result.spec.rounds.length} round(s), ${Object.keys(result.spec.resources).length} resource(s), ${result.spec.metadata.languages.length} language(s)`);
    process.exit(0);
  } else {
    console.error(`✗ ${result.stage} error(s) in ${rel}:`);
    for (const e of result.errors) console.error(`   [${e.path}] ${e.msg}`);
    process.exit(1);
  }
}
