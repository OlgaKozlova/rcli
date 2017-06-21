const path = require('path');
const fs = require('fs-extra');
const ejs = require('ejs');
const t = require('../../transformers.js');

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

module.exports = function execute(parameters, options, configuration) {
    const bundleName = parameters[0];
    const setName = parameters[1];

    const bundleConfiguration = configuration.bundles[bundleName];
    const settings = Object.assign(
        {},
        options,
        {
            featureName: setName,
            root: `${configuration.root}`,
            t,
        },
    );

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

        console.log(`${key} is generating on ${compiledDestinationTemplate} path`);

        performAction(config.action, compiledSourceTemplate, compiledDestinationTemplate);
    });

    console.log('-------');
    console.log('success');
};
