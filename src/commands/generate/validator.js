import fs from 'fs-extra';
import path from 'path';

const getErrorResult = errors => ({
    isValid: false,
    errors,
});

const getValidResult = () => ({
    isValid: true,
    errors: [],
});

function checkMinParams(parameters) {
    return (parameters.length > 2)
        ? ['Maximum 2 parameters expected']
        : [];
}

function checkMaxParams(parameters) {
    return (parameters.length < 1)
        ? ['Maximum 2 parameters expected']
        : [];
}

function checkTemplatesExistency(parameters, options, conf) {
    const bundle = conf.bundles[parameters[0]];

    return Object.keys(bundle)
        .filter(set => set.templateType === 'file'
            && (!fs.pathExistsSync(path.join(conf.templates, set.template))
            || !fs.pathExistsSync(path.join(conf.defaultTemplates, set.template))))
        .map(set => `Invalid filepath found in configuration: ${set.sourceFileName}`);
}

export default function (parameters, options, conf) {
    const errors = [
        checkMinParams.bind(null, parameters),
        checkMaxParams.bind(null, parameters),
        checkTemplatesExistency.bind(null, parameters, options, conf),
    ].reduce((result, current) => result.concat(current()), []);

    if (errors.length > 0) {
        return getErrorResult(errors);
    }

    return getValidResult();
}
