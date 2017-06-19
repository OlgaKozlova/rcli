#!/usr/bin/env node

import { defaultConfiguration } from '../src/defaultConfiguration.js';
import { getParsedCommandLine } from '../src/commandLineParser.js';
import { validators } from '../src/parametersValidators.js';
import { checkCommand } from '../src/commandChecker.js';

const args = process.argv;
const commandLine = args.slice(2);

const executor = {};

const commandLineOptions = getParsedCommandLine(commandLine, defaultConfiguration);
const { command, parameters, options } = commandLineOptions;
const commandValidationResults = checkCommand(command, defaultConfiguration);

if (!commandValidationResults.isValid) {
    console.log(commandValidationResults.errors);
    process.exit(1);
}

const validationResluts = validators[command](parameters, defaultConfiguration);
console.log(validationResluts);
if (!validationResluts.isValid) {
    console.log(validationResluts.errors);
    process.exit(1);
}

const executionResults = executor[command](parameters, options, defaultConfiguration);
if (!executionResults.isValid) {
    console.log(executionResults.errors);
    process.exit(1);
}

console.log('success');
