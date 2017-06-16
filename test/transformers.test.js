import { describe, it } from 'mocha';
import chai from 'chai';

import {
    camelize,
} from '../src/transformers.js';

const assert = chai.assert;

describe('String transformers tests', () => {
    describe('Function "camelize" tests', () => {
        it('Function "camelize" not works correct with dashed string', () => {
            const source = 'hello-world1';
            const expectedResult = 'helloWorld1';

            assert.strictEqual(
                expectedResult,
                camelize(source),
                'Function "camelize" not works correct with dashed string',
            );
        });
    });
});
