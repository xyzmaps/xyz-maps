# Bun Test Setup

## Quick Start

```bash
# Run all new tests (unit + integration)
bun run test

# Run only unit tests
bun run test:unit

# Run only integration tests
bun run test:integration

# Watch mode
bun run test:watch

# With coverage
bun run test:coverage
```

## Test Structure

```
packages/tests/
├── unit/                    # ✓ Fast unit tests (Bun test only)
│   └── common/
│       └── taskmanager.test.ts
├── integration/             # ✓ Browser tests (Bun test + Playwright)
│   ├── setup.ts            # Playwright configuration
│   └── core/
│       └── tile-loading.test.ts
├── test-utils/              # Shared utilities
│   ├── setup.ts
│   ├── utils.ts
│   ├── coreUtils.ts
│   └── ...
├── specs/                   # ⚠️ Legacy Mocha tests (not migrated yet)
└── MIGRATION.md            # Full migration guide
```

## Current Status

✅ **Working:**
- Bun test framework set up
- Unit test structure created
- Integration test structure with Playwright setup
- Example tests migrated and passing
- Test utilities copied over
- Package scripts updated

📝 **To Do:**
- Migrate remaining tests from `specs/` to `unit/` or `integration/`
- Set up full Playwright browser environment for WebGL tests
- Create test data fixtures
- Add more comprehensive test coverage

## Writing Tests

### Unit Test Example

```typescript
// unit/common/example.test.ts
import { describe, it, expect } from 'bun:test';

describe('MyFunction', () => {
  it('should work', () => {
    expect(2 + 2).toBe(4);
  });
});
```

### Integration Test Example

```typescript
// integration/display/example.test.ts
import { describe, it, expect } from 'bun:test';
import { page } from '../setup';

describe('Map Rendering', () => {
  it('should render', async () => {
    const result = await page.evaluate(() => {
      // Browser code here
      return true;
    });
    expect(result).toBe(true);
  });
});
```

## Key Differences from Mocha

- `before()` → `beforeAll()`
- `after()` → `afterAll()`
- `chai.expect()` → `expect()` (built-in)
- Use `async/await` instead of `done` callbacks

See [MIGRATION.md](./MIGRATION.md) for complete guide.

## Performance

- **Unit tests:** ~82ms (3 tests)
- **Integration tests:** ~50ms (2 tests)
- **Total:** Much faster than Karma/Mocha ⚡

## Next Steps

1. Review [MIGRATION.md](./MIGRATION.md) for migration patterns
2. Start migrating tests from `specs/` to `unit/` or `integration/`
3. For browser tests requiring WebGL/Canvas, use `integration/` with Playwright
4. For pure logic tests, use `unit/`
