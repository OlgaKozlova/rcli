#!/usr/bin/env node

import { getParsedCommandLine } from '../src/commandLineParser.js';
import commands from '../src/commands';
import bundles from '../src/bundles';

const args = process.argv;
const commandLine = args.slice(2);

const commandLineOptions = getParsedCommandLine(commandLine);
const { command, parameters, options } = commandLineOptions;

const conf = {
    bundles,
};

const currentCommand = commands[command];

const validationResult = currentCommand.validator(parameters, options, conf);
if (!validationResult.isValid) {
    console.log(validationResult.error);
    process.exit(1);
}

commands[command].executor(parameters, options, conf);
