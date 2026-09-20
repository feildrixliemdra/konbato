import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ENGINES } from '../lib/engines';

/**
 * Guards the claims the performance section makes on the marketing page.
 *
 * That section publishes, per engine, which lane it runs on. Nothing in the
 * type system stops a tool from swapping its worker, or an engine from being
 * pulled into a worker it does not belong in, and a table that quietly lies to
 * visitors is worse than no table. These assertions read the real source.
 *
 * No browser is needed; the tests only inspect files.
 */

const ROOT = path.join(__dirname, '..');

/**
 * Repo-relative paths, always with forward slashes.
 *
 * They are compared against the string literals in `lib/engines.ts`, so they
 * must not pick up the platform separator the way `path.join` would.
 */
function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

/** The worker modules a tool page dispatches to, matched by file name. */
function workerModulesOf(slug: string): string[] {
  const source = read(`app/tools/${slug}/page.tsx`);
  const matches = source.matchAll(/new Worker\(\s*new URL\(\s*'([^']+)'/g);
  return [...matches].map((match) => path.basename(match[1]));
}

const WORKER_FILES = fs
  .readdirSync(path.join(ROOT, 'app', 'workers'))
  .filter((file) => file.endsWith('.ts'))
  .map((file) => `app/workers/${file}`);

test.describe('engine map matches the code', () => {
  test('every declared worker module exists', () => {
    for (const engine of ENGINES) {
      for (const worker of engine.workers ?? []) {
        expect(fs.existsSync(path.join(ROOT, worker)), `${engine.name}: ${worker}`).toBe(true);
      }
    }
  });

  test('worker-lane engines are dispatched to by every tool listed against them', () => {
    for (const engine of ENGINES) {
      if (engine.lane !== 'Worker') continue;
      expect(engine.workers, `${engine.name} runs in a worker, so it needs one`).not.toBeNull();

      for (const slug of engine.tools) {
        const dispatched = workerModulesOf(slug);
        const expected = (engine.workers ?? []).map((worker) => path.basename(worker));
        expect(
          dispatched.some((module) => expected.includes(module)),
          `${slug} is listed as Worker for ${engine.name} but dispatches to ` +
            `[${dispatched.join(', ') || 'no worker'}]`
        ).toBe(true);
      }
    }
  });

  test('a Worker engine appears inside its worker, a main-thread engine in none', () => {
    const workerSources = WORKER_FILES.map((file) => ({ file, source: read(file) }));

    for (const engine of ENGINES) {
      const carriers = workerSources.filter(({ source }) => source.includes(engine.source));

      if (engine.lane === 'Worker') {
        const expected = engine.workers ?? [];
        expect(
          carriers.some(({ file }) => expected.includes(file)),
          `${engine.name} is published as running in a worker, but no declared worker ` +
            `module references "${engine.source}"`
        ).toBe(true);
      } else {
        expect(
          carriers.map(({ file }) => file),
          `${engine.name} is published as running on the main thread, but a worker ` +
            `references "${engine.source}"`
        ).toEqual([]);
      }
    }
  });

  test('every tool page is accounted for, and every listed slug exists', () => {
    const mapped = new Set(ENGINES.flatMap((engine) => engine.tools));
    const pages = fs
      .readdirSync(path.join(ROOT, 'app', 'tools'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    // A new tool must declare the engine it runs on rather than slip past.
    expect(pages.filter((slug) => !mapped.has(slug))).toEqual([]);
    // And a renamed or deleted tool must not linger in the map.
    expect([...mapped].filter((slug) => !pages.includes(slug))).toEqual([]);
  });
});
