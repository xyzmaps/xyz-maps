import type {BunPlugin} from 'bun';
import {readFileSync} from 'fs';

export const glslPlugin: BunPlugin = {
    name: 'glsl',
    setup(build) {
        build.onLoad({filter: /\.glsl$/}, async (args) => {
            let source = readFileSync(args.path, 'utf8');

            // Minify for production
            if (process.env.BUILD === 'production') {
                source = source
                    .replace(/\/\/.*$/gm, '') // Remove comments
                    .replace(/\s+/g, ' ') // Collapse whitespace
                    .trim();
            }

            return {
                contents: `export default ${JSON.stringify(source)}`,
                loader: 'ts'
            };
        });
    }
};
