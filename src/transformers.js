import {
    camelize as hCamelize,
    depascalize as hDepascalize,
    pascalize as hPascalize,
} from 'humps';

export const capitalize = string => string.splice(0, 1, string[0].toUpperCase());

export const decapitalize = string => string.splice(0, 1, string[0].toLowerCase());

export const camelize = string => hCamelize(string);

export const snakify = string => hDepascalize(hPascalize(string)).toUpperCase();
