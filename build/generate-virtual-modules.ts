import {writeFileSync, readFileSync, mkdirSync} from 'fs';
import {dirname} from 'path';

export function generateVirtualModules(options: {
  logoSrc: string;
  cOwner: string;
  tacUrl: string;
  outDir: string;
}) {
    // Ensure output directory exists
    mkdirSync(options.outDir, {recursive: true});

    // Read logo and convert to base64
    const logo = readFileSync(options.logoSrc, 'base64');

    // Generate ui-logo-src module
    writeFileSync(
        `${options.outDir}/ui-logo-src.ts`,
        `export default "data:image/svg+xml;base64,${logo}";\n`
    );

    // Generate ui-default-cOwner module
    writeFileSync(
        `${options.outDir}/ui-default-cOwner.ts`,
        `export default "${options.cOwner}";\n`
    );

    // Generate ui-tac-url module
    writeFileSync(
        `${options.outDir}/ui-tac-url.ts`,
        `export default "${options.tacUrl}";\n`
    );

    console.log(`✓ Generated virtual modules in ${options.outDir}`);
}
