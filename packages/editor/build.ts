#!/usr/bin/env bun
import pkg from './package.json';

const production = process.env.BUILD === 'production';
const module = pkg.name.split('-').pop()!;
const file = production ? `xyz-maps-${module}.min.js` : `xyz-maps-${module}.js`;

const banner = `/*
 * ${pkg.name}
 * (c) 2019-2025 HERE
 */
`;

const result = await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    target: 'browser',
    format: 'esm',
    naming: file,
    minify: production ? {
        whitespace: true,
        identifiers: true,
        syntax: true
    } : false,
    sourcemap: production ? 'none' : 'inline',
    external: ['@xyzmaps/xyz-maps-core', '@xyzmaps/xyz-maps-common', '@xyzmaps/xyz-maps-display'],
    banner
});

if (!result.success) {
    console.error('Build failed for @xyzmaps/xyz-maps-editor:');
    for (const message of result.logs) {
        console.error(message);
    }
    process.exit(1);
}

console.log(`✓ Built ${pkg.name} → dist/${file}`);
