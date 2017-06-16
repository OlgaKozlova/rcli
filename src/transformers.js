import {
    camelize as hCamelize,
    depascalize as hDepascalize,
    pascalize as hPascalize,
} from 'humps';

export const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

export const decapitalize = string => string.charAt(0).toLowerCase() + string.slice(1);

export const camelize = string => hCamelize(string);

export const snakify = string => hDepascalize(hPascalize(string)).toUpperCase();
