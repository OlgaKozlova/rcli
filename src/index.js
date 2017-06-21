const commandLineParser = require('./commandLineParser.js');
const commands = require('./commands');
const bundles = require('./bundles');
const customConfiguraton = require('./../.rcli.config.js');

const args = process.argv;
const commandLine = args.slice(2);

const commandLineOptions = commandLineParser.getParsedCommandLine(commandLine);
const { command, parameters, options } = commandLineOptions;

const conf = {
    root: customConfiguraton.root || './defaultRoot',
    templates: customConfiguraton.templates,
    defaultTemplates: './dist/templates/',
    bundles: Object.assign({}, bundles, customConfiguraton.bundles),
};

const currentCommand = commands[command];

const validationResult = currentCommand.validator(parameters, options, conf);
if (!validationResult.isValid) {
    console.log(validationResult.error);
    process.exit(1);
}

commands[command].executor(parameters, options, conf);
