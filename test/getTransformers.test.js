import { describe, it } from 'mocha';
import chai from 'chai';
import { getTransformers } from '../src/getTransformers.js';

const assert = chai.assert;

describe('Get transformers function tests', () => {
    it('Transformers merge works incorrect', () => {
        const defaultTransformers = {
            one: 'defaultOne',
            two: 'defaultTwo',
            three: 'defaultThree',
        };
        const configuration = {
            transformers: {
                three: 'configThree',
                four: 'configFour',
            },
        };
        const expectedResult = {
            one: 'defaultOne',
            two: 'defaultTwo',
            three: 'configThree',
            four: 'configFour',
        };

        assert.deepEqual(getTransformers(configuration, defaultTransformers), expectedResult);
    });
});
