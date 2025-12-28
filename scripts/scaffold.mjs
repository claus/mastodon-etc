import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import sh from 'shelljs';
import path from 'path';
import fs from 'fs';

import {
    uiComponentAstro,
    uiComponentAstroExternalTS,
    uiComponentTS,
    uiComponentCSS,
} from './templates/ui-component.mjs';

import {
    pageComponentRoute,
    pageComponentAstro,
    pageComponentCSS,
} from './templates/page-component.mjs';

sh.config.silent = true;

const uiComponentScaffold = async () => {
    const { name } = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'UI Component Name:',
            validate: name => !!name.match(/^[A-Z][A-Za-z0-9]*$/) || 'Name must be in CamelCase',
        },
    ]);
    const { customElementName } = await inquirer.prompt([
        {
            type: 'input',
            name: 'customElementName',
            message: 'Custom Element Name:',
            validate: name =>
                !!name.match(/^[a-z][a-z0-9._]*-[a-z0-9._]*[a-z0-9]$/) ||
                'Name must be in kebab-case',
        },
    ]);
    const { seperateTS } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'seperateTS',
            message: `Separate TypeScript file?`,
            default: true,
        },
    ]);
    const dir = path.resolve(process.cwd(), 'src', 'components', 'ui', name);
    if (sh.ls(dir).find(file => file === `${name}.astro`)) {
        const { overwrite } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'overwrite',
                message: `src/components/ui/${name} exists. Overwrite?`,
                default: false,
            },
        ]);
        if (!overwrite) {
            return;
        }
    }

    sh.mkdir('-p', dir);

    const astro = new sh.ShellString(uiComponentAstro(name, customElementName));
    const astroExtTS = new sh.ShellString(uiComponentAstroExternalTS(name, customElementName));
    const ts = new sh.ShellString(uiComponentTS(name));
    const css = new sh.ShellString(uiComponentCSS());

    if (seperateTS) {
        astroExtTS.to(path.resolve(dir, `${name}.astro`));
        css.to(path.resolve(dir, `${name}.module.css`));
        ts.to(path.resolve(dir, `${name}.ts`));
    } else {
        astro.to(path.resolve(dir, `${name}.astro`));
        css.to(path.resolve(dir, `${name}.module.css`));
    }

    const check = chalk.green.bold('✓');
    console.log('\nFiles written:');
    console.log(`- src/components/ui/${name}/${name}.astro ${check}`);
    console.log(`- src/components/ui/${name}/${name}.module.css ${check}`);
    console.log(seperateTS ? `- src/components/ui/${name}/${name}.ts ${check}\n` : '');
};

const pageComponentScaffold = async () => {
    const routeExamples = ['index', 'about', 'books/[id]', 'blog/[...rest]'];
    const routeExamplesText = routeExamples.map(r => chalk.green(r)).join(', ');
    const { route, name } = await inquirer.prompt([
        {
            type: 'input',
            name: 'route',
            message: 'Route:',
            validate: route =>
                !!route.match(/^[a-z0-9\-\/\[\]\.]+$/) ||
                `Examples of routes: ${routeExamplesText}`,
        },
        {
            type: 'input',
            name: 'name',
            message: 'Page Component Name:',
            validate: name =>
                !!name.match(/^[A-Z][A-Za-z0-9]*$/) || 'Component name must be CamelCased',
        },
    ]);
    const routeFile = route.match(/\.astro$/) ? route : `${route}.astro`;
    const routePath = path.resolve(process.cwd(), 'src', 'pages', routeFile);
    if (sh.test('-f', routePath)) {
        const { overwrite } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'overwrite',
                message: `src/pages/${routeFile} exists. Overwrite?`,
                default: false,
            },
        ]);
        if (!overwrite) {
            return;
        }
    }
    const compDir = path.resolve(process.cwd(), 'src', 'components', 'pages', name);
    if (sh.ls(compDir).find(file => file === `${name}.astro`)) {
        const { overwrite } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'overwrite',
                message: `src/components/pages/${name} exists. Overwrite?`,
                default: false,
            },
        ]);
        if (!overwrite) {
            return;
        }
    } else {
        sh.mkdir('-p', compDir);
    }

    const routeFileParts = routeFile.split('/');
    routeFileParts.pop();
    if (routeFileParts.length) {
        const routeFileDir = routeFileParts.join('/');
        sh.mkdir('-p', path.resolve(process.cwd(), 'src', 'pages', routeFileDir));
    }
    fs.writeFileSync(routePath, pageComponentRoute(name));

    const astro = new sh.ShellString(pageComponentAstro(name));
    const css = new sh.ShellString(pageComponentCSS());

    astro.to(path.resolve(compDir, `${name}.astro`));
    css.to(path.resolve(compDir, `${name}.module.css`));

    const check = chalk.green.bold('✓');
    console.log('\nFiles written:');
    console.log(`- src/pages/${routeFile} ${check}`);
    console.log(`- src/components/pages/${name}/${name}.astro ${check}`);
    console.log(`- src/components/pages/${name}/${name}.module.css ${check}\n`);
};

const run = async () => {
    console.log(
        chalk.yellow(
            figlet.textSync('HAUS', {
                font: 'Elite',
                horizontalLayout: 'default',
                verticalLayout: 'default',
            })
        )
    );
    console.log(chalk.yellow.bold('  Component Scaffolder\n'));

    const { type } = await inquirer.prompt([
        {
            type: 'list',
            name: 'type',
            message: 'Type:',
            choices: ['ui', 'page'],
            default: 'ui',
        },
    ]);

    switch (type) {
        case 'ui':
            await uiComponentScaffold();
            break;
        case 'page':
            await pageComponentScaffold();
            break;
    }
};

run();
