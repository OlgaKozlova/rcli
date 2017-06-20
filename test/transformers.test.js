import { describe, it } from 'mocha';
import chai from 'chai';
import TestData from './transformers.test.json';
import {
    camelize,
    snakify,
    capitalize,
    decapitalize,
} from '../src/transformers.js';

const assert = chai.assert;

const functions = {
    camelize,
    snakify,
    capitalize,
    decapitalize,
};

describe('String transformers tests', () => {
    TestData.forEach((testSuit) => {
        describe(testSuit.description, () => {
            testSuit.tests.forEach((test) => {
                it(test.description, () => {
                    assert.strictEqual(functions[testSuit.function](test.source), test.expected);
                });
            });
        });
    });
});
