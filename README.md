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
* bundleName - name of bundle that will be used for scaffolding. See description below.
* name - name of your feature | view | component

Options:

```generate``` accepts any amount of options in format:

```<optionName1>: option11 option12 ... option1N <optionName2>: option21 option22 ... option2N ... <optionNameM>: optionM1 optionM2 ... optionMN```

Example:
```
$ rcli generate view myPerfectView fields: firstName lastName gender birthday buttons: ok cancel
```

### Help

```help``` command is not supported yet. 

## Bundles

```generate``` command uses bundles for scaffolding. Bundle is a named set of items to be scaffolded.

Following default bundles are supported:
* stateFulView

Generates following structure
```
<root>
    constants
        <name>Constants.js
    actions
        <name>Actions.js
    reducers
        <name>Reducer.js
        index.js
    selectors
        <name>Selector.js
    views
        <name>.jsx
        index.js
    initials
        <name>Initial.js
        index.js        
```
and appends references to newly generated <name>Reducer.js, <name>.jsx and <name>Initial.js to the bottom of index.js files in appropriate folder.

* stateLessView

Generates following structure
```
<root>
    constants
        <name>Constants.js
    actions
        <name>Actions.js    
    selectors
        <name>Selector.js
    views
        <name>.jsx
        index.js
```
and appends references to newly generated <name>.jsx to the bottom of index.js files in appropriate folder.

* stateFulViewInFolder

Generates following structure
```
<root>
    <name>
        <name>Constants.js
        <name>Actions.js
        <name>Reducer.js
        <name>Selector.js
        <name>Initial.js
        <name>.jsx
    views.js
    reducers.js
    initials.js
```
and appends references to newly generated <name>Reducer.js, <name>.jsx and <name>Initial.js to the bottom of reducers.js, view.js and initials.js files in the root of project.

* stateLessViewInFolder

Generates following structure
```
<root>
    <name>
        <name>Constants.js
        <name>Actions.js
        <name>Selector.js
        <name>.jsx
    views.js
    reducers.js
    initials.js
```
and appends references to newly generated <name>.jsx to the bottom of view.js file in the root of project.

## Custom Bundles

We realize, that project needs differ from project to project and bundles can differ either. If default bundles don't cover your project need you can create your own bundle.

Steps to create new bundle:
1. Create folder in the root of your project where you will store your bundles, e.g. MyBundles
2. Add <bundleName>.json file there.
The structure of <bundleName>.json should be following:

```js
{  
  "actions": {
    "templateType": "file",
    "template": "actions.ejs",
    "destination": "<%= root %>/actions/<%= t.capitalize(featureName) %>Actions.js",
    "action": "create"
  },
  "actionsIndex": {
    "templateType": "string",
    "template": "export { <%= featureName %>Actions } from './<%= t.capitalize(featureName) %>Actions.js';\n",
    "destination": "<%= root %>/actions/index.js",
    "action": "appendBottom"
  },
  ...
}
```
This is object, each field of which describes the one item in the bundle for scaffolding.
Each bundle item is also an object with 4 required properties:

* templateType - "file" || "string"
* template - ejs string in case of "string" templateType or template(see below) name in case of "file" templateType
* destination: ejs string for setting the destination path
* action - "create" || "appendBottom". In case of "create" new file by destination path will be generated (replaced in case of existency). In case of "appendBottom" - new line(s) will be appended to the bottom of given destination file, new file will be created only if destination file doesn't exists.

So using the combination of these settings you can set up any bundle you wish.

3. Export all created bundles to index.js file in your MyBundles folder
Example:
```js
const myView = require('./myView.json');

module.exports = {
    myView,
};

```

Now myView bundle name is available for usage in commands
```
$ rcli generate myView PerfectView fields: firstName lastName buttons: ok cancel
```
## Templates
rcli uses templates for scaffolding. By default following set of templates is available:
(output for command ```$ rcli generate stateFulView myView fields: firstName lastName buttons: ok cancel```)


* constants
```js
const VIEW_NAME = 'MY_VIEW_';

export const SET_FIRST_NAME_ACTION = `${VIEW_NAME}SET_FIRST_NAME`;
export const SET_LAST_NAME_ACTION = `${VIEW_NAME}SET_LAST_NAME`;
export const HANDLE_OK_BUTTON_ACTION = `${VIEW_NAME}HANDLE_OK`;
export const HANDLE_CANCEL_BUTTON_ACTION = `${VIEW_NAME}HANDLE_CANCEL`;

```
* actions
```js
import {
    SET_FIRST_NAME_ACTION,
    SET_LAST_NAME_ACTION,
    HANDLE_OK_BUTTON_ACTION,
    HANDLE_CANCEL_BUTTON_ACTION,
} from '../constants/MyViewConstants.js';

export const MyViewActions = {
    [SET_FIRST_NAME_ACTION]: firstName => ({
        type: SET_FIRST_NAME_ACTION,
        payload: {
            firstName,
        },
    }),
    [SET_LAST_NAME_ACTION]: lastName => ({
        type: SET_LAST_NAME_ACTION,
        payload: {
            lastName,
        },
    }),
    [HANDLE_OK_BUTTON_ACTION]: () => (dispatch, getState) => {
        // place here code for button handling
    },
    [HANDLE_CANCEL_BUTTON_ACTION]: () => (dispatch, getState) => {
        // place here code for button handling
    },
};

```
* initials
```js
import Immutable from 'immutable';

export const MyViewInitialState = new Immutable.Map({
    firstName: '',
    lastName: '',
});

```
* reducer
```js
import {
    SET_FIRST_NAME_ACTION,
    SET_LAST_NAME_ACTION,
} from '../constants/MyViewConstants.js';

export const MyViewReducer = (state = {}, action) => {
    switch (action.type) {
    case SET_FIRST_NAME_ACTION : {
        return state.set('firstName', action.payload.firstName);
    }
    case SET_LAST_NAME_ACTION : {
        return state.set('lastName', action.payload.lastName);
    }
    default: {
        return state;
    }
    }
};

```
* selector
```js
import { createSelector } from 'reselect';

export const getFirstName = state => state.MyViewState.get('firstName');
export const getLastName = state => state.MyViewState.get('lastName');

export const MyViewSelector = createSelector(
    [
        getFirstName,
        getLastName,
    ],
    (
        firstName,
        lastName,
    ) => {
        // place code for view selector here
        return {
            // place other computed properties here
            firstName,
            lastName,
        };
    },
);

```
* view
```js
import React from 'react';
import { connect } from 'react-redux';

import { MyViewSelector } from '../selectors/MyViewSelectors.js';
import { MyViewActions } from '../actions/MyViewActions.js';
import {
    SET_FIRST_NAME_ACTION,
    SET_LAST_NAME_ACTION,
    HANDLE_OK_BUTTON_ACTION,
    HANDLE_CANCEL_BUTTON_ACTION,
} from '../constants/MyViewConstants.js';

export const MyView = connect(MyViewSelector, MyViewActions)((props) =>
    <div></div>
    // place your components here
);

```
## Setting up

## License

ISC
