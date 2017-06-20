import {
    SET_ONE_ACTION,
    SET_TWO_ACTION,
} from './MyViewConstants.js';

export const myViewActions = {
    [SET_ONE_ACTION]: one => ({
        type: SET_ONE_ACTION,
        payload: {
            one,
        },
    }),
    [SET_TWO_ACTION]: two => ({
        type: SET_TWO_ACTION,
        payload: {
            two,
        },
    }),
};
