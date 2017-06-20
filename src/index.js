import { getParsedCommandLine } from './commandLineParser.js';
import commands from './commands/index';
import bundles from './bundles/index';
// TODO: dynamic loading
import customConfiguraton from '../.rcli.config.js';

const args = process.argv;
const commandLine = args.slice(2);

const commandLineOptions = getParsedCommandLine(commandLine);
const { command, parameters, options } = commandLineOptions;

const conf = {
    root: customConfiguraton.root || './defaultRoot',
    templates: customConfiguraton.templates,
    defaultTemplates: './dist/templates/',
    bundles: {
        ...bundles,
        ...customConfiguraton.bundles,
    },
};

const currentCommand = commands[command];

const validationResult = currentCommand.validator(parameters, options, conf);
if (!validationResult.isValid) {
    console.log(validationResult.error);
    process.exit(1);
}

commands[command].executor(parameters, options, conf);
