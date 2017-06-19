import { errors } from './errorMessages.js';

export const checkCommand = (command, configuration) => {
    if (!command) {
        return {
            isValid: false,
            errors: [errors.NO_COMMAND()],
        };
    }

    if (!configuration.commands[command]) {
        return {
            isValid: false,
            errors: [errors.UNSUPPORTED_COMMAND(command)],
        };
    }

    return {
        isValid: true,
        errors: [],
    };
};
