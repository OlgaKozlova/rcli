#!/usr/bin/env node

import { getParsedCommandLine } from '../src/commandLineParser.js';
import Executor from '../src/commands/generate/executor.js';

import stateFulView from '../bundles/stateFulView.json';
import stateFulViewInFolder from '../bundles/stateFulViewInFolder.json';
import stateLessView from '../bundles/stateLessView.json';
import stateLessViewInFolder from '../bundles/stateLessViewInFolder.json';

const args = process.argv;
const commandLine = args.slice(2);

const commandLineOptions = getParsedCommandLine(commandLine);
const { parameters, options } = commandLineOptions;

const conf = {
    bundles: {
        stateFulView,
        stateFulViewInFolder,
        stateLessView,
        stateLessViewInFolder,
        dumbComponentSet: {

        },
        smartComponentSet: {

        },
        reactFormSet: {

        },
    },
};

Executor(parameters, options, conf);
