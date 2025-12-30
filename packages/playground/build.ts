#!/usr/bin/env bun
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname, basename, resolve } from 'path';
import * as sass from 'sass';

const production = process.env.BUILD === 'production';
const cwd = process.cwd();

// Clean dist directory
try {
  rmSync('./dist', { recursive: true, force: true });
} catch (e) {
  // Ignore if doesn't exist
}

mkdirSync('./dist', { recursive: true });
mkdirSync('./.build-cache', { recursive: true });

// Compile all SCSS files to CSS first
console.log('Compiling SCSS files...');
const scssFiles: Map<string, string> = new Map();

// Inline the logo as data URL
const logoSvg = readFileSync('./assets/icon/logo.svg', 'utf-8');
const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;

function compileSCSS(filePath: string): string {
  try {
    const result = sass.compile(filePath, {
      style: production ? 'compressed' : 'expanded',
      loadPaths: ['./src', './src/components'],
    });
    // Replace the logo URL with data URL
    let css = result.css.replace(/url\(["']?assets\/icon\/logo\.svg["']?\)/g, `url("${logoDataUrl}")`);
    return css;
  } catch (e) {
    console.error(`Error compiling ${filePath}:`, e);
    throw e;
  }
}

function findSCSSFiles(dir: string) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findSCSSFiles(fullPath);
    } else if (file.endsWith('.scss')) {
      const css = compileSCSS(fullPath);
      const absolutePath = resolve(fullPath);
      scssFiles.set(absolutePath, css);
    }
  }
}

findSCSSFiles('./src');
console.log(`✓ Compiled ${scssFiles.size} SCSS files`);

// Load examples list and settings for virtual modules
const examplesJson = readFileSync('./examples/examples.json', 'utf-8');
const settingsJson = readFileSync('./settings.json', 'utf-8');
const buildTimestamp = Date.now();

// Create SCSS plugin
const scssPlugin = {
  name: 'scss',
  setup(build: any) {
    build.onLoad({ filter: /\.scss$/ }, (args: any) => {
      const css = scssFiles.get(args.path);
      if (!css) {
        throw new Error(`SCSS file not found: ${args.path}`);
      }
      return {
        contents: css,
        loader: 'css',
      };
    });
  },
};

// Create virtual modules plugin
const virtualModulesPlugin = {
  name: 'virtual-modules',
  setup(build: any) {
    // Examples list virtual module
    build.onResolve({ filter: /^exampleslist$/ }, (args: any) => ({
      path: args.path,
      namespace: 'virtual-examples',
    }));

    build.onLoad({ filter: /.*/, namespace: 'virtual-examples' }, () => ({
      contents: `export default ${examplesJson};`,
      loader: 'js',
    }));

    // Settings virtual module
    build.onResolve({ filter: /^settings$/ }, (args: any) => ({
      path: args.path,
      namespace: 'virtual-settings',
    }));

    build.onLoad({ filter: /.*/, namespace: 'virtual-settings' }, () => ({
      contents: `export default ${settingsJson};`,
      loader: 'js',
    }));

    // Timestamp virtual module (for cache-busting)
    build.onResolve({ filter: /^ts$/ }, (args: any) => ({
      path: args.path,
      namespace: 'virtual-timestamp',
    }));

    build.onLoad({ filter: /.*/, namespace: 'virtual-timestamp' }, () => ({
      contents: `export default ${buildTimestamp};`,
      loader: 'js',
    }));
  },
};

console.log('Building XYZ Maps Playground...');

// Build the application
const result = await Bun.build({
  entrypoints: ['./src/index.tsx'],
  outdir: './dist',
  target: 'browser',
  format: 'esm',
  naming: production ? '[dir]/[name].[hash].[ext]' : '[dir]/[name].[ext]',
  minify: production ? {
    whitespace: true,
    identifiers: true,
    syntax: true,
  } : false,
  sourcemap: production ? 'none' : 'inline',
  splitting: true,
  plugins: [scssPlugin, virtualModulesPlugin],
  external: [],
});

if (!result.success) {
  console.error('Build failed:');
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

// Copy assets
console.log('Copying assets...');
try {
  cpSync('./assets', './dist/assets', { recursive: true });
} catch (e) {
  console.warn('No assets to copy');
}

// Copy examples
console.log('Copying examples...');
cpSync('./examples', './dist/examples', { recursive: true });

// Copy settings and credentials if they exist
try {
  cpSync('./settings.json', './dist/settings.json');
} catch (e) {
  // Ignore if doesn't exist
}

try {
  cpSync('./credentials.json', './dist/credentials.json');
} catch (e) {
  // Ignore if doesn't exist
}

// Generate HTML file
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XYZ Maps Playground</title>
    <link rel="stylesheet" href="./index.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="./index.js"></script>
</body>
</html>
`;

writeFileSync('./dist/index.html', html);

console.log('✓ Built XYZ Maps Playground → dist/');
console.log(`  Mode: ${production ? 'production' : 'development'}`);
console.log(`  Output: ${result.outputs.length} file(s)`);
