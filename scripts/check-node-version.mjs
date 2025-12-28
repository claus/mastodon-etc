import fs from 'fs';
import path from 'path';
import url from 'url';

import chalk from 'chalk';
import semver from 'semver';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const fileName = path.resolve(__dirname, '../package.json');
const pkg = loadPackageJson(fileName);
const requiredNodeVersion = pkg?.engines?.node;

if (!pkg) {
    console.warn(chalk.yellow.bold(`\nUnable to load package.json at ${fileName}\n`));
} else if (!requiredNodeVersion) {
    console.warn(
        chalk.yellow.bold(
            'No Node version specified in package.json. For more info, please visit https://docs.npmjs.com/cli/v8/configuring-npm/package-json#engines'
        )
    );
} else if (!semver.satisfies(process.version, requiredNodeVersion)) {
    console.error(
        chalk.red.bold(
            `Required Node version is ${requiredNodeVersion}, but you are using version ${process.version}.\nPlease use Node Version Manager (nvm) to switch to a compatible version.`
        )
    );
    // Exit the process with a non-zero code to indicate failure
    process.exit(1);
} else {
    console.log(chalk.green.bold(`Node version ${process.version} is compatible 👍`));
}

function loadPackageJson(fileName) {
    try {
        const stat = fs.statSync(fileName, { throwIfNoEntry: false });
        if (stat) {
            return JSON.parse(fs.readFileSync(fileName, 'utf8'));
        }
    } catch (e) {
        console.log(e);
    }
    return null;
}
