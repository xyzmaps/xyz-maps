#!/usr/bin/env bun
import pkg from './package.json';
import {generateVirtualModules} from '../../build/generate-virtual-modules';
import {glslPlugin} from '../../build/bun-glsl-plugin';

const production = process.env.BUILD === 'production';
const module = pkg.name.split('-').pop()!;
const file = production ? `xyz-maps-${module}.min.js` : `xyz-maps-${module}.js`;

const banner = `/*
 * ${pkg.name}
 * (c) 2019-2025 HERE
 */
`;

const logoSrc = process.env.logo || './assets/xyz.svg';
const cOwner = process.env.cOwner || 'XYZ';
const tacUrl = process.env.tacUrl || '';

if (production) {
    console.info(`Use logo: ${logoSrc} cOwner: ${cOwner}`);
}

// Generate virtual modules first
await generateVirtualModules({
    logoSrc,
    cOwner,
    tacUrl,
    outDir: './src/generated'
});

// Build ESM (modern browsers and bundlers)
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
    external: ['@xyzmaps/xyz-maps-core', '@xyzmaps/xyz-maps-common'],
    plugins: [glslPlugin],
    banner
});

if (!result.success) {
    console.error('Build failed for @xyzmaps/xyz-maps-display:');
    for (const message of result.logs) {
        console.error(message);
    }
    process.exit(1);
}

console.log(`✓ Built ${pkg.name} → dist/${file}`);
