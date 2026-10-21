/**
 * The two sides of an interface for AI. The Design index groups by these,
 * and every card and page kicker uses the same words.
 */
export const SURFACES = [
  {
    key: 'people',
    label: 'AI-human interface',
    title: 'AI-human interfaces',
    note: 'Where a person directs an agent, checks what it produced and corrects it.',
  },
  {
    key: 'agents',
    label: 'AI-native interface',
    title: 'AI-native interfaces',
    note: 'What an agent is given, when it reaches the agent, and what the agent writes into.',
  },
] as const;

export type Surface = (typeof SURFACES)[number]['key'];

export function surfaceLabel(key: Surface): string {
  return SURFACES.find((s) => s.key === key)?.label ?? '';
}
