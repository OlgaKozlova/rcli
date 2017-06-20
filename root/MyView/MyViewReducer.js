import {
    SET_ONE_ACTION,
    SET_TWO_ACTION,
} from './MyViewConstants.js';

export const myViewReducer = (state = {}, action) => {
    switch (action.type) {
    case SET_ONE_ACTION : {
        return state.set('one', action.payload.one);
    }
    case SET_TWO_ACTION : {
        return state.set('two', action.payload.two);
    }
    default: {
        return state;
    }
    }
};
