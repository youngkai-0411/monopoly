// Reuse the gameplay regression suite; keep Task #2 evidence separate.
process.env.MONOPOLY_ARTIFACT_PREFIX='task2';
await import('./v2-browser-check.mjs');
