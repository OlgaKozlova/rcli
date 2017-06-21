const commandLineParser = require('./commandLineParser.js');
const commands = require('./commands');
const bundles = require('./bundles');

module.exports = function index() {
    // eslint-disable-next-line import/no-unresolved, global-require
    const customConfiguraton = require('./../../../.rcli.config.js');

    const args = process.argv;
    const commandLine = args.slice(2);
    const commandLineOptions = commandLineParser.getParsedCommandLine(commandLine);
    const { command, parameters, options } = commandLineOptions;

    if (!command) {
        console.log('No command provided. Please check your command line arguments');
        process.exit(1);
    }

    const conf = {
        root: customConfiguraton.root || './src',
        templates: customConfiguraton.templates,
        defaultTemplates: './src/templates/',
        bundles: Object.assign({}, bundles, customConfiguraton.bundles),
    };

    const currentCommand = commands[command];
    if (!currentCommand) {
        console.log('Invalid command. Please, use "help to see all supported commands"');
        process.exit(1);
    }

    const validationResult = currentCommand.validator(parameters, options, conf);
    if (!validationResult.isValid) {
        console.log(validationResult.error);
        process.exit(1);
    }

    commands[command].executor(parameters, options, conf);
};
