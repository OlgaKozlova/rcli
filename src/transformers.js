const humps = require('humps');

const hCamelize = humps.camelize;
const hDepascalize = humps.depascalize;
const hPascalize = humps.pascalize;

module.exports.capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

module.exports.decapitalize = string => string.charAt(0).toLowerCase() + string.slice(1);

module.exports.camelize = string => hCamelize(string);

module.exports.snakify = string => hDepascalize(hPascalize(string)).toUpperCase();
