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

import {chromium, type Browser, type Page} from 'playwright';
import {beforeAll, afterAll} from 'bun:test';
import {join} from 'path';

export let browser: Browser;
export let page: Page;

/**
 * Setup Playwright browser for integration tests
 * This runs once before all integration tests
 */
beforeAll(async () => {
    browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security' // Allow CORS for local testing
        ]
    });

    page = await browser.newPage({
        viewport: {width: 1280, height: 720}
    });

    // Load the test page
    const testPagePath = join(__dirname, '../statics/index.html');
    await page.goto(`file://${testPagePath}`);

    console.log('✓ Playwright browser initialized');
});

/**
 * Cleanup after all tests
 */
afterAll(async () => {
    if (page) {
        await page.close();
    }
    if (browser) {
        await browser.close();
    }
    console.log('✓ Playwright browser closed');
});

/**
 * Helper to evaluate code in the browser context
 */
export async function evaluateInBrowser<T>(fn: () => T | Promise<T>): Promise<T> {
    return page.evaluate(fn);
}

/**
 * Helper to wait for a condition in the browser
 */
export async function waitForCondition(
    fn: () => boolean | Promise<boolean>,
    timeout = 5000
): Promise<void> {
    await page.waitForFunction(fn, {timeout});
}
