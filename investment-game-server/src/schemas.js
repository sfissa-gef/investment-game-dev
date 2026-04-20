import { z } from 'zod';

const StepperEntry = z.object({
  input: z.string(),
  action: z.string(),
  value: z.number().optional(),
  timestamp: z.string().optional(),
  lockbox: z.number().optional(),
}).passthrough();

const RoundData = z.object({
  fertilizerPurchased: z.number().int().min(0).max(10).nullable().optional(),
  seedsPurchased: z.boolean().nullable().optional(),
  insurancePurchased: z.boolean().nullable().optional(),
  bundlePurchased: z.boolean().nullable().optional(),
  tokensSaved: z.number().nullable().optional(),
  weatherOutcome: z.enum(['good', 'bad']).nullable().optional(),
  weatherSeed: z.string().nullable().optional(),
  weatherRawDraw: z.number().nullable().optional(),
  fertilizerHarvest: z.number().nullable().optional(),
  seedHarvest: z.number().nullable().optional(),
  insurancePayout: z.number().nullable().optional(),
  bundleHarvest: z.number().nullable().optional(),
  totalTokens: z.number().nullable().optional(),
  effectiveBudget: z.number().nullable().optional(),
  decisionStartTime: z.string().nullable().optional(),
  decisionEndTime: z.string().nullable().optional(),
  stepperTrajectory: z.array(StepperEntry).optional(),
  version: z.enum(['A', 'B']).nullable().optional(),
  videoChosen: z.boolean().nullable().optional(),
}).passthrough();

export const SessionSchema = z.object({
  sessionId: z.string().min(6),
  appVersion: z.string().optional(),
  participantId: z.string().min(1),
  enumeratorId: z.string().min(1),
  country: z.enum(['UG', 'ZM']),
  partner: z.string().optional(),
  treatmentGroup: z.enum(['Control', 'B1', 'B2', 'B3']).optional(),
  round2Version: z.enum(['A', 'B']),
  language: z.string(),
  currencyRate: z.number(),
  audioRecordingEnabled: z.boolean().optional(),
  sessionStartTime: z.string(),
  sessionEndTime: z.string().nullable().optional(),
  practiceRound: RoundData.optional(),
  round1: RoundData.optional(),
  round2: RoundData.optional(),
  totalIncentivizedTokens: z.number().nullable().optional(),
  totalPayoutCurrency: z.number().nullable().optional(),
  survey: z.record(z.any()).optional(),
}).passthrough();

export const AudioChunkSchema = z.object({
  sessionId: z.string().min(6),
  chunkIndex: z.number().int().min(0),
  timestamp: z.string(),
  durationMs: z.number().optional(),
  encrypted: z.boolean().optional(),
});
