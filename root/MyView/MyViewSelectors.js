import { createSelector } from 'reselect';

export const getOne = state => state.myViewState.get('one');
export const getTwo = state => state.myViewState.get('two');

export const myViewSelector = createSelector(
    [
        getOne,
        getTwo,
    ],
    (
        one,
        two,
    ) => {
        // place code for view selector here
        return {
            // place other computed properties here
            one,
            two,
        };
    },
);
