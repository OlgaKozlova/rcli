import fs from 'fs-extra';
import path from 'path';

export const getConfiguration = (rootPath, configurationFileName) =>
    fs.readFileSync(path.join(rootPath, configurationFileName));
