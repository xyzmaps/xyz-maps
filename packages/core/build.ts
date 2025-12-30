#!/usr/bin/env bun
import pkg from './package.json';
import {writeFileSync, mkdirSync} from 'fs';
import {execSync} from 'child_process';

const production = process.env.BUILD === 'production';
const module = pkg.name.split('-').pop()!;
const file = production ? `xyz-maps-${module}.min.js` : `xyz-maps-${module}.js`;

const banner = `/*
 * ${pkg.name}
 * (c) 2019-2025 HERE
 */
`;

// Get git revision
let gitRevision = '';
try {
    gitRevision = execSync('git rev-parse --short HEAD', {encoding: 'utf8'}).trim();
} catch (e) {
    // Git not available
}

// Create buildInfo virtual module
mkdirSync('./src/generated', {recursive: true});
const buildInfo = {
    version: pkg.version + (production ? '' : '+DEV'),
    revision: gitRevision,
    date: Date.now()
};

writeFileSync(
    './src/generated/buildInfo.ts',
    `export default ${JSON.stringify(buildInfo, null, 2)};\n`
);

// Build main package
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
    external: ['@here/xyz-maps-common'],
    banner
});

if (!result.success) {
    console.error('Build failed for @here/xyz-maps-core:');
    for (const message of result.logs) {
        console.error(message);
    }
    process.exit(1);
}

console.log(`✓ Built ${pkg.name} → dist/${file}`);
console.log(`  Build info: v${buildInfo.version} (${buildInfo.revision})`);
