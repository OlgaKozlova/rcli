import { describe, it } from 'mocha';
import chai from 'chai';
import {
    camelize,
    snakify,
    decapitalize,
    capitalize,
} from '../src/transformers.js';

const assert = chai.assert;

describe('String transformers tests', () => {
    describe('Function "camelize" tests', () => {
        it('Function "camelize" not works correct with dashed string', () => {
            const source = 'hello-world';
            const expectedResult = 'helloWorld';

            assert.strictEqual(
                expectedResult,
                camelize(source),
                'Function "camelize" not works correct with dashed string',
            );
        });
    });
});
