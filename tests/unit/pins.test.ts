import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';

describe('dependency pins', () => {
  it('pins every dependency to an exact version', () => {
    const all: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(all).length).toBeGreaterThan(0);
    for (const [name, version] of Object.entries(all)) {
      expect(version, name).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});
