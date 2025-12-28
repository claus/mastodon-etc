import inquirer from 'inquirer';
import sh from 'shelljs';
import path from 'path';

const run = async () => {
    const distPath = path.resolve(process.cwd(), 'dist');
    const hasDist = sh.test('-d', distPath);

    const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
    const hasNodeModules = sh.test('-d', nodeModulesPath);

    const packageLockPath = path.resolve(process.cwd(), 'package-lock.json');
    const hasPackageLock = sh.test('-f', packageLockPath);

    const yarnLockPath = path.resolve(process.cwd(), 'yarn.lock');
    const hasYarnLock = sh.test('-f', yarnLockPath);

    const { removeDist, removeNodeModules, removePackageLock, removeYarnLock } =
        await inquirer.prompt([
            {
                type: 'confirm',
                name: 'removeDist',
                message: `Remove dist folder?`,
                when: hasDist,
                default: true,
            },
            {
                type: 'confirm',
                name: 'removeNodeModules',
                message: `Remove node_modules folder?`,
                when: hasNodeModules,
                default: true,
            },
            {
                type: 'confirm',
                name: 'removePackageLock',
                message: `Remove package-lock.json file?`,
                when: hasPackageLock,
                default: true,
            },
            {
                type: 'confirm',
                name: 'removeYarnLock',
                message: `Remove yarn.lock file?`,
                when: hasYarnLock,
                default: true,
            },
        ]);

    if (
        (!hasDist || !removeDist) &&
        (!hasNodeModules || !removeNodeModules) &&
        (!hasPackageLock || !removePackageLock) &&
        (!hasYarnLock || !removeYarnLock)
    ) {
        console.log('\nNothing to clean up.');
        return;
    }

    if (hasDist && removeDist) {
        sh.rm('-rf', distPath);
    }
    if (hasNodeModules && removeNodeModules) {
        sh.rm('-rf', nodeModulesPath);
    }
    if (hasPackageLock && removePackageLock) {
        sh.rm(packageLockPath);
    }
    if (hasYarnLock && removeYarnLock) {
        sh.rm(yarnLockPath);
    }
};

run();
