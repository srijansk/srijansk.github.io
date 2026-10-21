/**
 * The two sides of an interface for AI. Every card and page kicker uses the
 * same words; `people` is AI-human, `agents` is AI-native (the agent is the user).
 */
export const SURFACES = [
  { key: 'people', label: 'AI-human interface' },
  { key: 'agents', label: 'AI-native interface' },
] as const;

export type Surface = (typeof SURFACES)[number]['key'];

export function surfaceLabel(key: Surface): string {
  return SURFACES.find((s) => s.key === key)?.label ?? '';
}
