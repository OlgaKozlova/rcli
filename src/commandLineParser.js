const OPTION_POSTFIX = ':';

const isOption = str => str.endsWith(OPTION_POSTFIX);

const getArraySplitByIndexes = (array, indexes) => {
    const normalizedIndexes = [0].concat(indexes.filter(index => index > -1));

    const splitted = normalizedIndexes.reduce((result, current, i, arr) => {
        const sliceEnd = i === arr.length - 1
            ? array.length
            : arr[i + 1];
        result.push(array.slice(current, sliceEnd));

        return result;
    }, []);

    const additional = new Array((indexes.length + 1) - splitted.length).fill([]);

    return splitted.concat(additional);
};

const getTransformedOptions = (optionsConfiguration) => {
    const options = {};
    let currentOption = '';

    optionsConfiguration.forEach((option) => {
        if (isOption(option)) {
            currentOption = option.replace(OPTION_POSTFIX, '');
            options[currentOption] = [];
        } else {
            options[currentOption] = options[currentOption].concat(option);
        }
    });

    return options;
};

/**
 * @public
 * @param commandLine
 * @returns {{command: (string|null), parameters: (Array.<string>), options: {}}}
 */
module.exports.getParsedCommandLine = (commandLine) => {
    const indexes = [1, commandLine.findIndex(isOption)];
    const splitted = getArraySplitByIndexes(commandLine, indexes);

    return {
        command: splitted[0][0] || null,
        parameters: splitted[1],
        options: getTransformedOptions(splitted[2]),
    };
};
