# rcli

Scaffolding library for redux and react-redux projects.

## Overview

rcli will help you with routine work while creating
* new dumb component
* new smart component
* new react form
* new constants-action-reducer-selector bundle for new view or feature

## Install

Local installation:
```
$ npm install rcli --save-dev
```
Global installation
```
$ npm install rcli -g
```

## Usage

After local installation binary file "rcli" is available in ./node_modules/.bin directory. You can use it directly via command line:
```
$ ./node_modules/.bin/rcli <command> <parameters> <options>
```
or create script in package.json:
```js
"scripts": {
    "rcli": "./node_modules/.bin/rcli"
}
```
and use it via command line in following way:
```
$ npm run rcli <command> <parameters> <options>
```

After global installation global variable rcli is available via command line:
```
$ rcli <command> <parameters> <options>
```

## Commands

Following commands are available:
* generate
* help

### Generate

```generate``` command allows you to generate new bundle of files. 

Parameters: 

```generate``` accepts 2 required parameters:
* bundleName - name of bundle that will be used for scaffolding
* name - name of your feature | view | component

Options:

```generate``` accepts any amount of options in format:

<optionName1>: option11 option12 ... option1N <optionName2>: option21 option22 ... option2N ... <optionNameM>: optionM1 optionM2 ... optionMN

Example:
```
$ rcli generate view myPerfectView fields: firstName lastName gender birthday buttons: ok cancel
```

## Setting up

## License

ISC
