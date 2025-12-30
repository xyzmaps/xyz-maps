# XYZ Maps

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![npm version](https://img.shields.io/npm/v/@xyzmaps/xyz-maps-editor.svg)

**XYZ Maps** is an experimental and work-in-progress open-source map editor written in TypeScript. Built for modern web development with Bun, it provides a highly customizable vector map display optimized for map editing, large raw datasets, and frequently changing data.

[![XYZ Maps Editor](packages/display/assets/xyz-maps.png)](https://heremaps.github.io/xyz-maps/playground/#Display-Pitch_and_Rotate_Map)

## Features

- **High-Performance Vector Rendering** - WebGL-based rendering engine with GLSL shader pipeline
- **Interactive Map Editing** - Full-featured API for creating, modifying, and deleting map features
- **Flexible Styling** - JSON-based style definitions with expression support
- **Provider Architecture** - Pluggable data providers for various backend services
- **Modern ESM Modules** - Tree-shakeable ES modules for optimal bundle sizes
- **TypeScript First** - Written in TypeScript with full type definitions

## Packages

XYZ Maps is organized as a monorepo containing the following packages:

| Package | Description | Version |
|---------|-------------|---------|
| [@xyzmaps/xyz-maps-common](packages/common) | Common utilities and shared functionality | 0.1.0 |
| [@xyzmaps/xyz-maps-core](packages/core) | Core data providers, layers, and geometries | 0.1.0 |
| [@xyzmaps/xyz-maps-display](packages/display) | WebGL-based vector map display | 0.1.0 |
| [@xyzmaps/xyz-maps-editor](packages/editor) | Interactive map editing API | 0.1.0 |

## Prerequisites

- **[Bun](https://bun.sh)** >= 1.0.0
- **[Node.js](https://nodejs.org)** >= 20.0.0 (optional, for compatibility)

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/xyzmaps/xyz-maps.git
cd xyz-maps

# Install dependencies
bun install
```

### Development

```bash
# Watch mode - rebuilds on file changes
bun run watch-dev

# Build development version (with sourcemaps)
bun run build-dev

# Build production version (minified)
bun run build-release

# Run tests
bun test

# Run unit tests only
bun run test:unit

# Run integration tests (requires Playwright)
bun run test:integration
```

All build outputs are located in `packages/*/dist/`.

### Setup XYZ Token (Optional)

An XYZ token is only required if you're using the XYZ Hub endpoint at `xyz.api.here.com`. You can obtain a token by following the instructions in the [XYZ Hub guide](https://www.here.xyz/api/getting-token/).

For local development or custom backends, you can set an empty token:

```bash
bun run set-access-token YOUR_ACCESS_TOKEN
```

### Running the Playground

```bash
# Build and serve the interactive playground
bun run playground
```

This will start a local server and open http://localhost:8081/packages/playground/dist in your browser.

### Debug Server

```bash
# Start the debug server
bun run server
```

Browser will open http://localhost:8080/debug automatically.

## Usage Example

```typescript
import { Map } from '@xyzmaps/xyz-maps-display';
import { TileLayer } from '@xyzmaps/xyz-maps-core';
import { Editor } from '@xyzmaps/xyz-maps-editor';

// Create a map display
const display = new Map(document.getElementById('map'), {
  zoomLevel: 14,
  center: { longitude: -122.4194, latitude: 37.7749 },
  layers: [
    new TileLayer({
      min: 2,
      max: 20,
      provider: myDataProvider
    })
  ]
});

// Add editing capabilities
const editor = new Editor(display, {
  layers: [myEditableLayer]
});
```

## Project Structure

```
xyz-maps/
├── packages/
│   ├── common/          # Common utilities and shared code
│   ├── core/            # Core data layer and providers
│   ├── display/         # WebGL rendering engine
│   ├── editor/          # Map editing functionality
│   ├── playground/      # Interactive API playground
│   ├── tests/           # Test suite (Bun test + Playwright)
│   └── utils/           # Build utilities
├── build/               # Build plugins and utilities
│   ├── bun-glsl-plugin.ts        # GLSL shader loader
│   └── generate-virtual-modules.ts  # Virtual module generator
├── scripts/             # Utility scripts
└── debug/               # Debug and development pages
```

## Development Workflow

### Building Packages

Each package has its own `build.ts` script that uses Bun's native bundler:

```bash
# Build specific package
cd packages/core
bun run build-dev

# Build all packages in parallel
bun run build-dev  # from root
```

### Code Quality

```bash
# Run ESLint
bun run eslint:fix

# Build TypeScript declarations
bun run build-declarations

# Build documentation
bun run build-doc
```

### Testing

The project uses **Bun test** for unit tests and **Playwright** for browser-based integration tests:

```bash
# Run all tests
bun test

# Run with coverage
bun run test:coverage

# Watch mode
bun run test:watch
```

Test files are organized as:
- `packages/tests/unit/` - Fast unit tests (no browser required)
- `packages/tests/integration/` - Browser-based integration tests

## Available Commands

### Root Commands

| Command | Description |
|---------|-------------|
| `bun test` | Run all tests (unit + integration) |
| `bun run test:unit` | Run unit tests only |
| `bun run test:integration` | Run integration tests with Playwright |
| `bun run build-dev` | Build development version of all packages |
| `bun run build-release` | Build production version (minified) |
| `bun run watch-dev` | Watch mode - rebuild on changes |
| `bun run build-declarations` | Generate TypeScript .d.ts files |
| `bun run build-doc` | Build TypeDoc documentation |
| `bun run build-playground` | Build the interactive playground |
| `bun run playground` | Build and serve the playground |
| `bun run server` | Start debug server |
| `bun run bundle-release` | Create full release bundle |
| `bun run set-access-token` | Configure XYZ access token |

### Package Commands

Each package supports:

| Command | Description |
|---------|-------------|
| `bun run build` | Standard build |
| `bun run build-dev` | Development build (with sourcemaps) |
| `bun run build-release` | Production build (minified) |
| `bun run watch-dev` | Watch mode |
| `bun run build-dts` | Generate type declarations |

## Architecture

### Build System

XYZ Maps uses **Bun's native bundler** for fast, efficient builds:

- **GLSL Shaders**: Custom plugin compiles 27 shader files for WebGL rendering
- **Virtual Modules**: Generated TypeScript files for branding and configuration
- **ESM-Only**: Modern ES module output for optimal tree-shaking
- **Build Speed**: 5-10x faster than previous Rollup setup

### Rendering Pipeline

The display package uses a **WebGL-based rendering engine**:

1. **Tile Loading**: Efficient spatial indexing and tile management
2. **Feature Processing**: Geometric operations and style evaluation
3. **Shader Compilation**: GLSL shaders for high-performance rendering
4. **Layer Composition**: Multi-layer rendering with z-ordering

### Data Providers

Pluggable provider architecture supports:

- **Remote providers**: Fetch data from HTTP endpoints
- **Local providers**: In-memory data storage
- **Custom providers**: Implement the provider interface for custom backends

## Contributing

Contributions are welcome! This is a fork of the original HERE XYZ Maps project, maintained by the community.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Run tests: `bun test`
5. Build: `bun run build-dev`
6. Commit: `git commit -am 'Add my feature'`
7. Push: `git push origin feature/my-feature`
8. Create a Pull Request

### Code Style

- Follow the existing TypeScript style
- Run `bun run eslint:fix` before committing
- Add tests for new features
- Update documentation as needed

## Publishing

See [PUBLISHING.md](PUBLISHING.md) for detailed instructions on publishing packages to npm.

## Migration Guide

This project has been modernized from Yarn/Rollup/Karma to Bun. See [MIGRATION-STATUS.md](MIGRATION-STATUS.md) for details on:

- Build system changes (Rollup → Bun)
- Test framework migration (Karma/Mocha → Bun test)
- Package manager switch (Yarn → Bun)
- Module format changes (UMD + ESM → ESM-only)

## Resources

- **Documentation**: TypeDoc-generated API documentation (run `bun run build-doc`)
- **Playground**: Interactive API examples (`bun run playground`)
- **Migration Guide**: [MIGRATION-STATUS.md](MIGRATION-STATUS.md)
- **Publishing Guide**: [PUBLISHING.md](PUBLISHING.md)

## Performance

- **Build Time**: ~1-2s for full rebuild (5-10x faster than Rollup)
- **Test Speed**: 43 unit tests in ~60ms
- **Bundle Size**: ESM-only builds are smaller and tree-shakeable
- **Dependencies**: ~27% fewer dependencies vs. legacy setup

## Roadmap

- [ ] Enhanced Playwright test coverage
- [ ] Hot module reload for playground
- [ ] Additional data provider implementations
- [ ] Performance optimizations for large datasets
- [ ] 3D terrain rendering improvements

## License

Copyright (C) 2019-2025 XYZmaps contributors

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

This is a community-maintained fork of the original [HERE XYZ Maps](https://github.com/heremaps/xyz-maps) project. Thanks to HERE Europe B.V. and all original contributors for their foundational work.

---

**Built with [Bun](https://bun.sh)** - The fast all-in-one JavaScript runtime
