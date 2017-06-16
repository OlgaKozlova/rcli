const ejs = require('ejs');
const fs = require('fs-extra');


const settings = {
    featureName: 'FirstView',
    fields: ['firstName', 'lastName'],
    buttons: ['buttonOne', 'buttonTwo'],
};

/* const file1 = fs.readFileSync('../templates/constants.ejs', 'utf8');
const template1 = ejs.compile(file1);
const result1 = template1(settings);
console.log(result1);

const file = fs.readFileSync('../templates/actions.ejs', 'utf8');
const template = ejs.compile(file);
const result = template(settings);
console.log(result);


const file3 = fs.readFileSync('../templates/reducer.ejs', 'utf8');
const template3 = ejs.compile(file3);
const result3 = template3(settings);
console.log(result3);*/

const file3 = fs.readFileSync('../templates/initial.ejs', 'utf8');
const template3 = ejs.compile(file3);
const result3 = template3(settings);
console.log(result3);

