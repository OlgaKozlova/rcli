import path from 'path';
import fs from 'fs-extra';
import ejs from 'ejs';
import * as t from '../../transformers.js';

const getTemplate = (templateType, template, templatePath, defaultTemplatePath) => {
    if (templateType === 'file') {
        if (fs.pathExistsSync(path.join(templatePath, template))) {
            return fs.readFileSync(path.join(templatePath, template), 'utf8');
        }
        return fs.readFileSync(path.join(defaultTemplatePath, template), 'utf8');
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
    const settings = {
        ...options,
        featureName: setName,
        root: `${configuration.root}/`,
        t,
    };

    console.log(configuration);

    Object.keys(bundleConfiguration).forEach((key) => {
        const config = bundleConfiguration[key];
        const sourceTemplate = getTemplate(
            config.templateType,
            config.template,
            configuration.templates, // TODO rename to templatePath
            configuration.defaultTemplates,
        );
        const compiledSourceTemplate = getCompiledTemplate(sourceTemplate, settings);
        const destinationTemplate = getTemplate('string', config.destination);
        const compiledDestinationTemplate = getCompiledTemplate(destinationTemplate, settings);

        console.log(`${key} is generating...`);

        performAction(config.action, compiledSourceTemplate, compiledDestinationTemplate);
    });

    console.log('-------');
    console.log('success');
}
