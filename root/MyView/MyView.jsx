import React from 'react';
import { connect } from 'react-redux';

import { myViewSelector } from './MyViewSelectors.js';
import { myViewActions } from './MyViewActions.js';
import {
    SET_ONE_ACTION,
    SET_TWO_ACTION,
} from './MyViewConstants.js';

export const myView = connect(myViewSelector, myViewActions)((props) =>
    <div></div>
    // place your components here
);
