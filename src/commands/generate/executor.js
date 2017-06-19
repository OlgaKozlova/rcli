import fs from 'fs-extra';
import ejs from 'ejs';
import * as t from '../../transformers.js';

const getTemplate = (templateType, template) => {
    if (templateType === 'file') {
        return fs.readFileSync(template, 'utf8');
    }
    return template;
};

const getCompiledTemplate = (string, settings) => ejs.render(string, settings);

const performAction = (action, template, destinationPath) => {
    switch (action) {
    case 'create': {
        fs.outputFileSync(destinationPath, template);
        break;
    }
    case 'appendBottom': {
        if (!fs.pathExistsSync(destinationPath)) {
            fs.outputFileSync(destinationPath, template);
        } else if (!fs.readFileSync(destinationPath, 'utf8').includes(template)) {
            fs.appendFileSync(destinationPath, template);
        }
        break;
    }
    default: {
        console.log('invalid action');
        break;
    }
    }
};

export default function (parameters, options, configuration) {
    const bundleName = parameters[0];
    const setName = parameters[1];

    const bundleConfiguration = configuration.bundles[bundleName];

    Object.keys(bundleConfiguration).forEach((key) => {
        const config = bundleConfiguration[key];
        const settings = {
            ...options,
            featureName: setName,
            t,
        };

        const sourceTemplate = getTemplate(config.templateType, config.template);
        const compiledSourceTemplate = getCompiledTemplate(sourceTemplate, settings);
        const destinationTemplate = getTemplate('string', config.destination);
        const compiledDestinationTemplate = getCompiledTemplate(destinationTemplate, settings);

        performAction(config.action, compiledSourceTemplate, compiledDestinationTemplate);
    });
}
