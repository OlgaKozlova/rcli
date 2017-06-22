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
```
"scripts": {
    "rcli": "./node_modules/.bin/rcli"
  }
```
and use it via command line in following way:
```
npm run rcli <command> <parameters> <options>
```

After global installation global variable rcli is available. You can use it directly via command line:
```
rcli <command> <parameters> <options>
```

## Example


## License

ISC