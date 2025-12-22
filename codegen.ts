import type { CodegenConfig } from '@graphql-codegen/cli';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const CONTENTFUL_ENV = process.env.CONTENTFUL_ENV;
const CONTENTFUL_TOKEN = process.env.CONTENTFUL_TOKEN;

const CONTENTFUL_URL = `https://graphql.contentful.com/content/v1/spaces/${CONTENTFUL_SPACE_ID}/environments/${CONTENTFUL_ENV}`;
const CONTENTFUL_AUTH = `Bearer ${CONTENTFUL_TOKEN}`;

const config: CodegenConfig = {
    schema: [
        {
            [CONTENTFUL_URL]: {
                headers: {
                    Authorization: CONTENTFUL_AUTH,
                },
            },
        },
    ],
    overwrite: true,
    documents: 'src/**/*.{graphql,gql}',
    generates: {
        'src/services/graphql/types.ts': {
            config: {
                maybeValue: 'T',
                avoidOptionals: true,
                useTypeImports: true,
                inlineFragmentTypes: 'combine',
                printFieldsOnNewLines: true,
                documentMode: 'string',
            },
            plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
        },
    },
};

export default config;
