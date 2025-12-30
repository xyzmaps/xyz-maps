# Test Migration Guide: Mocha/Karma → Bun Test + Playwright

## Overview

The test suite has been migrated from Karma/Mocha to **Bun Test** (for unit tests) and **Bun Test + Playwright** (for integration tests).

## New Test Structure

```
packages/tests/
├── unit/                    # Fast unit tests (no browser needed)
│   └── common/
│       └── taskmanager.test.ts
├── integration/             # Browser-based tests with Playwright
│   ├── setup.ts            # Playwright browser setup
│   └── core/
│       └── tile-loading.test.ts
├── test-utils/              # Shared test utilities
│   ├── setup.ts
│   ├── utils.ts
│   ├── coreUtils.ts
│   ├── displayUtils.ts
│   ├── editorUtils.ts
│   └── prepareData.ts
└── specs/                   # Legacy Mocha tests (to be migrated)
```

## Syntax Migration

### Mocha → Bun Test Mapping

| Mocha | Bun Test | Notes |
|-------|----------|-------|
| `describe()` | `describe()` | Same |
| `it()` | `it()` or `test()` | Same |
| `before()` | `beforeAll()` | Different name |
| `after()` | `afterAll()` | Different name |
| `beforeEach()` | `beforeEach()` | Same |
| `afterEach()` | `afterEach()` | Same |
| `chai.expect()` | `expect()` | Bun built-in |
| `done` callback | `async/await` | Use Promises |

### Example: Before (Mocha/Chai)

```typescript
import {prepare} from 'utils';

describe('basic get and cancel tiles', function() {
    const expect = chai.expect;
    let placeProvider;

    before(async function() {
        let preparedData = await prepare(dataset);
        placeProvider = preparedData.getLayers('placeLayer').getProvider();
    });

    it('get one tile and dont cancel', function(done) {
        getTileOnProvider({
            provider: placeProvider,
            quadkeys: [qk1],
            onFinish: function(requests, results) {
                expect(requests.length).to.equal(1);
                expect(results.length).to.equal(1);
                done();
            }
        });
    });
});
```

### Example: After (Bun Test)

```typescript
import { describe, it, expect, beforeAll } from 'bun:test';
import { prepare } from '../test-utils/prepareData';

describe('basic get and cancel tiles', () => {
    let placeProvider;

    beforeAll(async () => {
        const preparedData = await prepare(dataset);
        placeProvider = preparedData.getLayers('placeLayer').getProvider();
    });

    it('get one tile and dont cancel', async () => {
        const { requests, results } = await new Promise((resolve) => {
            getTileOnProvider({
                provider: placeProvider,
                quadkeys: [qk1],
                onFinish: (requests, results) => resolve({ requests, results })
            });
        });

        expect(requests.length).toBe(1);
        expect(results.length).toBe(1);
    });
});
```

## Writing Unit Tests

Unit tests run in Bun's JavaScript runtime (no browser needed).

```typescript
// packages/tests/unit/common/example.test.ts
import { describe, it, expect } from 'bun:test';

describe('MyFunction', () => {
    it('should do something', () => {
        expect(2 + 2).toBe(4);
    });

    it('supports async tests', async () => {
        const result = await Promise.resolve('done');
        expect(result).toBe('done');
    });
});
```

## Writing Integration Tests (Browser)

Integration tests use Playwright for real browser testing (WebGL, Canvas, DOM).

```typescript
// packages/tests/integration/display/example.test.ts
import { describe, it, expect } from 'bun:test';
import { page } from '../setup';

describe('Map Rendering', () => {
    it('should render on canvas', async () => {
        const canvasExists = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            return canvas !== null;
        });

        expect(canvasExists).toBe(true);
    });

    it('should test WebGL context', async () => {
        const hasWebGL = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            const gl = canvas?.getContext('webgl2');
            return gl !== null;
        });

        expect(hasWebGL).toBe(true);
    });
});
```

## Running Tests

```bash
# Run all tests
bun test

# Run only unit tests
bun test unit/

# Run only integration tests
bun test integration/

# Watch mode
bun test --watch

# With coverage
bun test --coverage

# Run specific test file
bun test unit/common/taskmanager.test.ts
```

## Migration Checklist

For each test file in `specs/`:

1. **Determine test type:**
   - Uses browser APIs (Canvas, WebGL, DOM)? → `integration/`
   - Pure logic/data processing? → `unit/`

2. **Update imports:**
   - Replace `chai.expect` with `expect` from `bun:test`
   - Update test utility imports to use `test-utils/`

3. **Update test hooks:**
   - `before()` → `beforeAll()`
   - `after()` → `afterAll()`

4. **Convert callbacks to async/await:**
   - Remove `done` callback parameter
   - Return Promises or use `async/await`

5. **Update assertions:**
   - `expect(x).to.equal(y)` → `expect(x).toBe(y)`
   - `expect(x).to.be.null` → `expect(x).toBeNull()`
   - `expect(x).to.be.true` → `expect(x).toBe(true)`

6. **For integration tests:**
   - Import `page` from `../setup`
   - Wrap browser code in `page.evaluate()`

## Expect Matchers (Bun Test)

Bun's `expect` is Jest-compatible:

```typescript
// Equality
expect(value).toBe(expected)
expect(value).toEqual(expected)
expect(value).not.toBe(unexpected)

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()

// Numbers
expect(value).toBeGreaterThan(number)
expect(value).toBeGreaterThanOrEqual(number)
expect(value).toBeLessThan(number)
expect(value).toBeLessThanOrEqual(number)
expect(value).toBeCloseTo(number, precision)

// Strings
expect(string).toMatch(/regex/)
expect(string).toContain(substring)

// Arrays/Objects
expect(array).toContain(item)
expect(array).toHaveLength(number)
expect(object).toHaveProperty('key', value)
expect(array).toEqual(expect.arrayContaining([items]))

// Functions
expect(fn).toThrow()
expect(fn).toThrow('error message')
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith(arg1, arg2)

// Promises
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow()
```

## Benefits of New Setup

### Unit Tests (Bun Test)
- ⚡ **10-100x faster** than Karma/Mocha
- 🎯 **Built-in TypeScript** support
- 🔍 **Better error messages**
- 📦 **No extra dependencies** needed

### Integration Tests (Playwright)
- 🌐 **Real browser testing** (Chrome, Firefox, Safari)
- 🎭 **Modern browser automation**
- 📸 **Screenshots and videos** for debugging
- 🔄 **Parallel test execution**
- 🐛 **Better debugging tools**

## Legacy Tests

The old Karma/Mocha tests in `specs/` directory will remain until fully migrated. They can be run with the old build system if needed, but new tests should use the Bun Test structure.
