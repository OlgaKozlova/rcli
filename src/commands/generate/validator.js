import fs from 'fs-extra';

const getErrorResult = error => ({
    isValid: false,
    error,
});

const getValidResult = () => ({
    isValid: true,
    error: null,
});

export default function (parameters, options, conf) {
    if (parameters.length > 2) {
        return getErrorResult('Maximum 2 parameters expected');
    }

    if (parameters.length < 1) {
        return getErrorResult('Mininum 1 parameter expected');
    }

    const bundle = conf.bundles[parameters[0]];
    if (!bundle) {
        return getErrorResult(`Bundle ${parameters[0]} is not defined in configuration`);
    }

    const nonExistingFiles = Object.keys(bundle)
        .filter(set => set.templateType === 'file' && !fs.pathExistsSync(set.template))
        .map(set => set.sourceFileName);

    if (nonExistingFiles.length > 0) {
        return getErrorResult(`Invalid filepaths found in configuration: ${nonExistingFiles.join(', ')}`);
    }

    return getValidResult();
}
