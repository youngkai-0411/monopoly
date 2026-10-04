// UI-only smoke of the built bundle; no state injection.
process.env.MONOPOLY_ARTIFACT_PREFIX='task2';
await import('./production-smoke.mjs');
