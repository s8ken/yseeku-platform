export type PlannedAction = { type: string; target: string; reason?: string };

export function planActions(analysis: { status: string; observations: string[] }): PlannedAction[] {
  const actions: PlannedAction[] = [];
  if (analysis.observations.includes('emergence_detected')) {
    actions.push({ type: 'alert', target: 'system', reason: 'emergence_detected' });
  }
  if (analysis.observations.includes('low_trust')) {
    actions.push({ type: 'adjust_threshold', target: 'trust', reason: 'low_trust' });
  }
  return actions;
}
