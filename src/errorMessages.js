export const errors = {
    NO_COMMAND: () => 'No command passed!',
    UNSUPPORTED_COMMAND: command => `Unsupported command ${command}`,
    EXTRA_PARAMS: (actual, expected) => `This command supports maximum ${expected} parameters, you passed ${actual}`,
    MISSING_REQUIRED_PARAMS: (actual, expected) =>
        `This command requires minimus ${expected} parameters, you passed ${actual}`,
    INVALID_PARAMETER_CONFIGURATION: () => 'Configuration for the command is incorrect',
};
