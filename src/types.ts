export const MODEL = 'minimax/minimax-m2.5:free';

export const AGENT_ROLES = {
  ANALYST: "analyst",
  FIXER: "fixer",
  CRITIQUE: "critique",
} as const;

export type AgentRole = typeof AGENT_ROLES[keyof typeof AGENT_ROLES];

export const CRITIQUE_DECISIONS = {
  END: "END",
  RETRY: "RETRY",
} as const;

export type CritiqueDecision = typeof CRITIQUE_DECISIONS[keyof typeof CRITIQUE_DECISIONS];
