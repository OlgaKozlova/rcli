import * as transformers from './transformers.js';
import { getParsedCommandLine } from './commandLineParser.js';

export const defaultConfiguration = {
    optionMarker: {
        type: 'postfix',
        value: ':',
    },
    commandLineParser: getParsedCommandLine,
    transformers,
    commands: {
        generate: {
            configuration: {
                parameters: [
                    {
                        name: 'bundleName',
                        isRequired: true,
                    },
                    {
                        name: 'featureName',
                        isRequired: true,
                    },
                ],
            },
            executor: () => {},
            data: {
                defaultSet: {
                    c: {
                        templateFilePath: '/templates/constants.ejs',
                        // eslint-disable-next-line no-template-curly-in-string
                        destinationPath: '/constants/${feature}Constants.js',
                        shouldGenerateFolder: false,
                        indexFilePath: './index.js',
                        indexTemplate: '',
                        indexAction: 'appendBottom',
                    },
                    a: {

                    },
                    i: {

                    },
                    r: {

                    },
                    s: {

                    },
                },
            },
        },
        help: {
            configuration: {
                parameters: [
                    {
                        name: 'commands',
                        isRequired: false,
                    },
                ],
            },
            executor: () => {},
        },
    },
};
