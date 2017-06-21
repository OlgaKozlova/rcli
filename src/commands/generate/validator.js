const fs = require('fs-extra');
const path = require('path');

const getErrorResult = errors => ({
    isValid: false,
    errors,
});

const getValidResult = () => ({
    isValid: true,
    errors: [],
});

function checkParamsCount(parameters) {
    return (parameters.length !== 2)
        ? ['This command expected 2 parameters. Check you command line']
        : [];
}

function checkBundle(parameters, conf) {
    return conf.bundles[parameters[0]]
        ? []
        : [`Failed to find ${parameters[0]} bundle in configuration`];
}

function checkTemplatesExistency(parameters, options, conf) {
    const bundle = conf.bundles[parameters[0]];

    return bundle
        ? Object.keys(bundle)
            .filter(key => bundle[key].templateType === 'file'
                 && (!fs.pathExistsSync(path.join(conf.templates, bundle[key].template))
                 && !fs.pathExistsSync(path.join(conf.defaultTemplates, bundle[key].template))))
            .map(key => `Non-existing template found in configuration: ${bundle[key].template}.
            Check "${key}" configuration for "${parameters[0]}" bundle.`)
        : [];
}

module.exports = function validate(parameters, options, conf) {
    const errors = [
        checkParamsCount.bind(null, parameters),
        checkBundle.bind(null, parameters, conf),
        checkTemplatesExistency.bind(null, parameters, options, conf),
    ].reduce((result, current) => result.concat(current()), []);

    if (errors.length > 0) {
        return getErrorResult(errors);
    }

    return getValidResult();
};
