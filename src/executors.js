/* const getParametersWithValues = (command, parameters, configuration) => {
    const configParams = configuration.commands[command].configuration.parameters;

    return configParams.map((parameter, index) => ({
        ...parameter,
        value: parameters[index] || null,
    })).reduce((result, current) => result[current.name] = current.value, {});
}

export const executors = {
    generate: (parameters, options, confuguration) => {
        const paramsWithValues = getParametersWithValues('generate', parameters, confuguration);

        const
    },
    help:() => {},
};*/
