import { errors } from './errorMessages.js';

export const validators = {
    generate: (parameters, configuration) => {
        const paramsConfiguration = configuration.commands.generate.configuration.parameters;
        const minParamsCount = paramsConfiguration.filter(item => item.isRequired).length;
        const maxParamsCount = paramsConfiguration.length;

        if (parameters.length > maxParamsCount) {
            return {
                isValid: false,
                errors: [errors.EXTRA_PARAMS()],
            };
        }

        if (parameters.length < minParamsCount) {
            return {
                isValid: false,
                errors: [errors.MISSING_REQUIRED_PARAMS()],
            };
        }

        if (!configuration.commands.generate.data[parameters[0]]) {
            return {
                isValid: false,
                errors: [errors.INVALID_PARAMETER_CONFIGURATION()],
            };
        }

        return {
            isValid: true,
            errors: [],
        };
    },
    help: () => {},
};
