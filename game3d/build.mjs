import { build } from 'esbuild';
const out = process.argv[2] || 'dist/majeed3d.js';
await build({ entryPoints: ['src/entry.js'], bundle: true, minify: process.argv.includes('--min'), format: 'iife', globalName: 'MJTeaGame', target: 'es2019', outfile: out, legalComments: 'none', logLevel: 'info' });
