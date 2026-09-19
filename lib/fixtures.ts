import type { Fixture } from './types';

const REGISTRY: Record<string, () => Promise<Fixture>> = {
  mini: () => import('../fixtures/mini.json').then((m) => m.default as unknown as Fixture),
};

export function listFixtures(): string[] {
  return Object.keys(REGISTRY);
}

export async function loadFixture(name: string): Promise<Fixture | null> {
  const load = REGISTRY[name];
  return load ? load() : null;
}
