// Review proposed friendly vocabulary through the real public raster renderer.
process.env.HZ_APP_URL ||= 'http://127.0.0.1:8896/Horizons/App/';
process.env.HZ_JOBS_GRAPHIC_PROOF ||= 'C:/Users/David/Documents/Codex/2026-11-04/horizons-jobs-friendly';
process.env.HZ_JOBS_REPORT ||= 'reports/jobs-friendly-browser-proof.json';
process.env.HZ_JOBS_VOCAB_FRAGMENT ||= 'reports/jobs-friendly-vocabulary-fragment.json';
process.env.HZ_JOBS_FRAMES ||= 'assets/art/jobs-friendly-v1.frames.json';
await import('./jobs-graphic-proof.mjs');
