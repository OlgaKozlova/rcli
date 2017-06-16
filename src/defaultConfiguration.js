import * as transformers from './transformers.js';

export const defaultConfiguration = {
    commands: {
        generate1: () => 'rrc generate bundle defaultSet SomeService -f field1 field2 field3',
    },
    bundles: {
        defaultSet: {
            c: {
                templateFilePath: '/templates/constants.ejs',
                destinationPath: '/constants/${feature}Constants.js',
                shouldGenerateFolder: false,
                indexFilePath: './index.js',
                indexTemplate: '',
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
    transformers,
};

console.log(defaultConfiguration);
