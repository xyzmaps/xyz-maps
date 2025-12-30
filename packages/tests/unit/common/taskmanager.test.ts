/*
 * Copyright (C) 2019-2025 HERE Europe B.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 * License-Filename: LICENSE
 */

import {describe, it, expect, beforeAll} from 'bun:test';

/**
 * Example unit test migrated from Mocha to Bun test
 * This demonstrates the migration pattern:
 *
 * Mocha -> Bun test mapping:
 * - describe() -> describe() (same)
 * - it() -> it() or test() (same)
 * - before() -> beforeAll()
 * - after() -> afterAll()
 * - beforeEach() -> beforeEach() (same)
 * - afterEach() -> afterEach() (same)
 * - chai.expect() -> expect() (Bun built-in)
 * - done callback -> async/await or return Promise
 */

describe('TaskManager', () => {
    let taskManager;

    beforeAll(async () => {
    // Setup code that runs once before all tests in this suite
    // Note: Use async/await instead of callbacks
    });

    it('should execute a single task', async () => {
    // Example test using Bun's built-in expect
        const result = await new Promise((resolve) => {
            setTimeout(() => resolve('done'), 10);
        });

        expect(result).toBe('done');
    });

    it('should handle multiple tasks in sequence', async () => {
        const results: string[] = [];

        await new Promise((resolve) => {
            setTimeout(() => {
                results.push('task1');
                setTimeout(() => {
                    results.push('task2');
                    resolve(undefined);
                }, 10);
            }, 10);
        });

        expect(results).toEqual(['task1', 'task2']);
    });

    it('should support async/await pattern', async () => {
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        await delay(10);

        // Bun's expect has Jest-compatible matchers
        expect(true).toBeTruthy();
    });
});
