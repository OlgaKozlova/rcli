/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 16);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(5);
var polyfills = __webpack_require__(22);
var legacy = __webpack_require__(24);
var queue = [];

var util = __webpack_require__(26);

function noop() {}

var debug = noop;
if (util.debuglog) debug = util.debuglog('gfs4');else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) debug = function debug() {
  var m = util.format.apply(util, arguments);
  m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
  console.error(m);
};

if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
  process.on('exit', function () {
    debug(queue);
    __webpack_require__(11).equal(queue.length, 0);
  });
}

module.exports = patch(__webpack_require__(10));
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH) {
  module.exports = patch(fs);
}

// Always patch fs.close/closeSync, because we want to
// retry() whenever a close happens *anywhere* in the program.
// This is essential when multiple graceful-fs instances are
// in play at the same time.
module.exports.close = fs.close = function (fs$close) {
  return function (fd, cb) {
    return fs$close.call(fs, fd, function (err) {
      if (!err) retry();

      if (typeof cb === 'function') cb.apply(this, arguments);
    });
  };
}(fs.close);

module.exports.closeSync = fs.closeSync = function (fs$closeSync) {
  return function (fd) {
    // Note that graceful-fs also retries when fs.closeSync() fails.
    // Looks like a bug to me, although it's probably a harmless one.
    var rval = fs$closeSync.apply(fs, arguments);
    retry();
    return rval;
  };
}(fs.closeSync);

function patch(fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs);
  fs.gracefulify = patch;
  fs.FileReadStream = ReadStream; // Legacy name.
  fs.FileWriteStream = WriteStream; // Legacy name.
  fs.createReadStream = createReadStream;
  fs.createWriteStream = createWriteStream;
  var fs$readFile = fs.readFile;
  fs.readFile = readFile;
  function readFile(path, options, cb) {
    if (typeof options === 'function') cb = options, options = null;

    return go$readFile(path, options, cb);

    function go$readFile(path, options, cb) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$readFile, [path, options, cb]]);else {
          if (typeof cb === 'function') cb.apply(this, arguments);
          retry();
        }
      });
    }
  }

  var fs$writeFile = fs.writeFile;
  fs.writeFile = writeFile;
  function writeFile(path, data, options, cb) {
    if (typeof options === 'function') cb = options, options = null;

    return go$writeFile(path, data, options, cb);

    function go$writeFile(path, data, options, cb) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$writeFile, [path, data, options, cb]]);else {
          if (typeof cb === 'function') cb.apply(this, arguments);
          retry();
        }
      });
    }
  }

  var fs$appendFile = fs.appendFile;
  if (fs$appendFile) fs.appendFile = appendFile;
  function appendFile(path, data, options, cb) {
    if (typeof options === 'function') cb = options, options = null;

    return go$appendFile(path, data, options, cb);

    function go$appendFile(path, data, options, cb) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$appendFile, [path, data, options, cb]]);else {
          if (typeof cb === 'function') cb.apply(this, arguments);
          retry();
        }
      });
    }
  }

  var fs$readdir = fs.readdir;
  fs.readdir = readdir;
  function readdir(path, options, cb) {
    var args = [path];
    if (typeof options !== 'function') {
      args.push(options);
    } else {
      cb = options;
    }
    args.push(go$readdir$cb);

    return go$readdir(args);

    function go$readdir$cb(err, files) {
      if (files && files.sort) files.sort();

      if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$readdir, [args]]);else {
        if (typeof cb === 'function') cb.apply(this, arguments);
        retry();
      }
    }
  }

  function go$readdir(args) {
    return fs$readdir.apply(fs, args);
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacy(fs);
    ReadStream = legStreams.ReadStream;
    WriteStream = legStreams.WriteStream;
  }

  var fs$ReadStream = fs.ReadStream;
  ReadStream.prototype = Object.create(fs$ReadStream.prototype);
  ReadStream.prototype.open = ReadStream$open;

  var fs$WriteStream = fs.WriteStream;
  WriteStream.prototype = Object.create(fs$WriteStream.prototype);
  WriteStream.prototype.open = WriteStream$open;

  fs.ReadStream = ReadStream;
  fs.WriteStream = WriteStream;

  function ReadStream(path, options) {
    if (this instanceof ReadStream) return fs$ReadStream.apply(this, arguments), this;else return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
  }

  function ReadStream$open() {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose) that.destroy();

        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
        that.read();
      }
    });
  }

  function WriteStream(path, options) {
    if (this instanceof WriteStream) return fs$WriteStream.apply(this, arguments), this;else return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
  }

  function WriteStream$open() {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy();
        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
      }
    });
  }

  function createReadStream(path, options) {
    return new ReadStream(path, options);
  }

  function createWriteStream(path, options) {
    return new WriteStream(path, options);
  }

  var fs$open = fs.open;
  fs.open = open;
  function open(path, flags, mode, cb) {
    if (typeof mode === 'function') cb = mode, mode = null;

    return go$open(path, flags, mode, cb);

    function go$open(path, flags, mode, cb) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$open, [path, flags, mode, cb]]);else {
          if (typeof cb === 'function') cb.apply(this, arguments);
          retry();
        }
      });
    }
  }

  return fs;
}

function enqueue(elem) {
  debug('ENQUEUE', elem[0].name, elem[1]);
  queue.push(elem);
}

function retry() {
  var elem = queue.shift();
  if (elem) {
    debug('RETRY', elem[0].name, elem[1]);
    elem[0].apply(null, elem[1]);
  }
}

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.fromCallback = function (fn) {
  return Object.defineProperty(function () {
    var _arguments = arguments,
        _this = this;

    if (typeof arguments[arguments.length - 1] === 'function') fn.apply(this, arguments);else {
      return new Promise(function (resolve, reject) {
        _arguments[_arguments.length] = function (err, res) {
          if (err) return reject(err);
          resolve(res);
        };
        _arguments.length++;
        fn.apply(_this, _arguments);
      });
    }
  }, 'name', { value: fn.name });
};

exports.fromPromise = function (fn) {
  return Object.defineProperty(function () {
    var cb = arguments[arguments.length - 1];
    if (typeof cb !== 'function') return fn.apply(this, arguments);else fn.apply(this, arguments).then(function (r) {
      return cb(null, r);
    }).catch(cb);
  }, 'name', { value: fn.name });
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var u = __webpack_require__(2).fromCallback;
var mkdirs = u(__webpack_require__(31));
var mkdirsSync = __webpack_require__(32);

module.exports = {
  mkdirs: mkdirs,
  mkdirsSync: mkdirsSync,
  // alias
  mkdirp: mkdirs,
  mkdirpSync: mkdirsSync,
  ensureDir: mkdirs,
  ensureDirSync: mkdirsSync
};

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var u = __webpack_require__(2).fromPromise;
var fs = __webpack_require__(9);

function pathExists(path) {
  return fs.access(path).then(function () {
    return true;
  }).catch(function () {
    return false;
  });
}

module.exports = {
  pathExists: u(pathExists),
  pathExistsSync: fs.existsSync
};

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var u = __webpack_require__(2).fromCallback;
var rimraf = __webpack_require__(35);

module.exports = {
  remove: u(rimraf),
  removeSync: rimraf.sync
};

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var u = __webpack_require__(2).fromCallback;
var jsonFile = __webpack_require__(37);

module.exports = {
  // jsonfile exports
  readJson: u(jsonFile.readFile),
  readJsonSync: jsonFile.readFileSync,
  writeJson: u(jsonFile.writeFile),
  writeJsonSync: jsonFile.writeFileSync
};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var assign = __webpack_require__(21);

var fs = {};

// Export graceful-fs:
assign(fs, __webpack_require__(9));
// Export extra methods:
assign(fs, __webpack_require__(27));
assign(fs, __webpack_require__(14));
assign(fs, __webpack_require__(3));
assign(fs, __webpack_require__(6));
assign(fs, __webpack_require__(36));
assign(fs, __webpack_require__(40));
assign(fs, __webpack_require__(41));
assign(fs, __webpack_require__(42));
assign(fs, __webpack_require__(43));
assign(fs, __webpack_require__(49));
assign(fs, __webpack_require__(4));

module.exports = fs;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// This is adapted from https://github.com/normalize/mz
// Copyright (c) 2014-2016 Jonathan Ong me@jongleberry.com and Contributors
var u = __webpack_require__(2).fromCallback;
var fs = __webpack_require__(1);

var api = ['access', 'appendFile', 'chmod', 'chown', 'close', 'fchmod', 'fchown', 'fdatasync', 'fstat', 'fsync', 'ftruncate', 'futimes', 'lchown', 'link', 'lstat', 'mkdir', 'open', 'read', 'readFile', 'readdir', 'readlink', 'realpath', 'rename', 'rmdir', 'stat', 'symlink', 'truncate', 'unlink', 'utimes', 'write', 'writeFile'];
// fs.mkdtemp() was added in Node.js v5.10.0, so check if it exists
typeof fs.mkdtemp === 'function' && api.push('mkdtemp');

// Export all keys:
Object.keys(fs).forEach(function (key) {
  exports[key] = fs[key];
});

// Universalify async methods:
api.forEach(function (method) {
  exports[method] = u(fs[method]);
});

// We differ from mz/fs in that we still ship the old, broken, fs.exists()
// since we are a drop-in replacement for the native module
exports.exists = function (filename, callback) {
  if (typeof callback === 'function') {
    return fs.exists(filename, callback);
  }
  return new Promise(function (resolve) {
    return fs.exists(filename, resolve);
  });
};

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var fs = __webpack_require__(5);

module.exports = clone(fs);

function clone(obj) {
  if (obj === null || (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object') return obj;

  if (obj instanceof Object) var copy = { __proto__: obj.__proto__ };else var copy = Object.create(null);

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
  });

  return copy;
}

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("assert");

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// imported from ncp (this is temporary, will rewrite)

var fs = __webpack_require__(1);
var path = __webpack_require__(0);
var utimes = __webpack_require__(29);

function ncp(source, dest, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }

  var basePath = process.cwd();
  var currentPath = path.resolve(basePath, source);
  var targetPath = path.resolve(basePath, dest);

  var filter = options.filter;
  var transform = options.transform;
  var overwrite = options.overwrite;
  // If overwrite is undefined, use clobber, otherwise default to true:
  if (overwrite === undefined) overwrite = options.clobber;
  if (overwrite === undefined) overwrite = true;
  var errorOnExist = options.errorOnExist;
  var dereference = options.dereference;
  var preserveTimestamps = options.preserveTimestamps === true;

  var started = 0;
  var finished = 0;
  var running = 0;

  var errored = false;

  startCopy(currentPath);

  function startCopy(source) {
    started++;
    if (filter) {
      if (filter instanceof RegExp) {
        console.warn('Warning: fs-extra: Passing a RegExp filter is deprecated, use a function');
        if (!filter.test(source)) {
          return doneOne(true);
        }
      } else if (typeof filter === 'function') {
        if (!filter(source, dest)) {
          return doneOne(true);
        }
      }
    }
    return getStats(source);
  }

  function getStats(source) {
    var stat = dereference ? fs.stat : fs.lstat;
    running++;
    stat(source, function (err, stats) {
      if (err) return onError(err);

      // We need to get the mode from the stats object and preserve it.
      var item = {
        name: source,
        mode: stats.mode,
        mtime: stats.mtime, // modified time
        atime: stats.atime, // access time
        stats: stats // temporary
      };

      if (stats.isDirectory()) {
        return onDir(item);
      } else if (stats.isFile() || stats.isCharacterDevice() || stats.isBlockDevice()) {
        return onFile(item);
      } else if (stats.isSymbolicLink()) {
        // Symlinks don't really need to know about the mode.
        return onLink(source);
      }
    });
  }

  function onFile(file) {
    var target = file.name.replace(currentPath, targetPath.replace('$', '$$$$')); // escapes '$' with '$$'
    isWritable(target, function (writable) {
      if (writable) {
        copyFile(file, target);
      } else {
        if (overwrite) {
          rmFile(target, function () {
            copyFile(file, target);
          });
        } else if (errorOnExist) {
          onError(new Error(target + ' already exists'));
        } else {
          doneOne();
        }
      }
    });
  }

  function copyFile(file, target) {
    var readStream = fs.createReadStream(file.name);
    var writeStream = fs.createWriteStream(target, { mode: file.mode });

    readStream.on('error', onError);
    writeStream.on('error', onError);

    if (transform) {
      transform(readStream, writeStream, file);
    } else {
      writeStream.on('open', function () {
        readStream.pipe(writeStream);
      });
    }

    writeStream.once('close', function () {
      fs.chmod(target, file.mode, function (err) {
        if (err) return onError(err);
        if (preserveTimestamps) {
          utimes.utimesMillis(target, file.atime, file.mtime, function (err) {
            if (err) return onError(err);
            return doneOne();
          });
        } else {
          doneOne();
        }
      });
    });
  }

  function rmFile(file, done) {
    fs.unlink(file, function (err) {
      if (err) return onError(err);
      return done();
    });
  }

  function onDir(dir) {
    var target = dir.name.replace(currentPath, targetPath.replace('$', '$$$$')); // escapes '$' with '$$'
    isWritable(target, function (writable) {
      if (writable) {
        return mkDir(dir, target);
      }
      copyDir(dir.name);
    });
  }

  function mkDir(dir, target) {
    fs.mkdir(target, dir.mode, function (err) {
      if (err) return onError(err);
      // despite setting mode in fs.mkdir, doesn't seem to work
      // so we set it here.
      fs.chmod(target, dir.mode, function (err) {
        if (err) return onError(err);
        copyDir(dir.name);
      });
    });
  }

  function copyDir(dir) {
    fs.readdir(dir, function (err, items) {
      if (err) return onError(err);
      items.forEach(function (item) {
        startCopy(path.join(dir, item));
      });
      return doneOne();
    });
  }

  function onLink(link) {
    var target = link.replace(currentPath, targetPath);
    fs.readlink(link, function (err, resolvedPath) {
      if (err) return onError(err);
      checkLink(resolvedPath, target);
    });
  }

  function checkLink(resolvedPath, target) {
    if (dereference) {
      resolvedPath = path.resolve(basePath, resolvedPath);
    }
    isWritable(target, function (writable) {
      if (writable) {
        return makeLink(resolvedPath, target);
      }
      fs.readlink(target, function (err, targetDest) {
        if (err) return onError(err);

        if (dereference) {
          targetDest = path.resolve(basePath, targetDest);
        }
        if (targetDest === resolvedPath) {
          return doneOne();
        }
        return rmFile(target, function () {
          makeLink(resolvedPath, target);
        });
      });
    });
  }

  function makeLink(linkPath, target) {
    fs.symlink(linkPath, target, function (err) {
      if (err) return onError(err);
      return doneOne();
    });
  }

  function isWritable(path, done) {
    fs.lstat(path, function (err) {
      if (err) {
        if (err.code === 'ENOENT') return done(true);
        return done(false);
      }
      return done(false);
    });
  }

  function onError(err) {
    // ensure callback is defined & called only once:
    if (!errored && callback !== undefined) {
      errored = true;
      return callback(err);
    }
  }

  function doneOne(skipped) {
    if (!skipped) running--;
    finished++;
    if (started === finished && running === 0) {
      if (callback !== undefined) {
        return callback(null);
      }
    }
  }
}

module.exports = ncp;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var path = __webpack_require__(0);

// get drive on windows
function getRootPath(p) {
  p = path.normalize(path.resolve(p)).split(path.sep);
  if (p.length > 0) return p[0];
  return null;
}

// http://stackoverflow.com/a/62888/10333 contains more accurate
// TODO: expand to include the rest
var INVALID_PATH_CHARS = /[<>:"|?*]/;

function invalidWin32Path(p) {
  var rp = getRootPath(p);
  p = p.replace(rp, '');
  return INVALID_PATH_CHARS.test(p);
}

module.exports = {
  getRootPath: getRootPath,
  invalidWin32Path: invalidWin32Path
};

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  copySync: __webpack_require__(33)
};

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* eslint-disable node/no-deprecated-api */
module.exports = function (size) {
  if (typeof Buffer.allocUnsafe === 'function') {
    try {
      return Buffer.allocUnsafe(size);
    } catch (e) {
      return new Buffer(size);
    }
  }
  return new Buffer(size);
};

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _commandLineParser = __webpack_require__(17);

var _index = __webpack_require__(18);

var _index2 = _interopRequireDefault(_index);

var _index3 = __webpack_require__(59);

var _index4 = _interopRequireDefault(_index3);

var _rcliConfig = __webpack_require__(64);

var _rcliConfig2 = _interopRequireDefault(_rcliConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var args = process.argv;
var commandLine = args.slice(2);

var commandLineOptions = (0, _commandLineParser.getParsedCommandLine)(commandLine);
var command = commandLineOptions.command,
    parameters = commandLineOptions.parameters,
    options = commandLineOptions.options;


var conf = {
    root: _rcliConfig2.default.root || './defaultRoot',
    templates: _rcliConfig2.default.templates,
    defaultTemplates: './dist/templates/',
    bundles: _extends({}, _index4.default, _rcliConfig2.default.bundles)
};

var currentCommand = _index2.default[command];

var validationResult = currentCommand.validator(parameters, options, conf);
if (!validationResult.isValid) {
    console.log(validationResult.error);
    process.exit(1);
}

_index2.default[command].executor(parameters, options, conf);

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
var OPTION_POSTFIX = ':';

var isOption = function isOption(str) {
    return str.endsWith(OPTION_POSTFIX);
};

var getArraySplitByIndexes = function getArraySplitByIndexes(array, indexes) {
    var normalizedIndexes = [0].concat(indexes.filter(function (index) {
        return index > -1;
    }));

    var splitted = normalizedIndexes.reduce(function (result, current, i, arr) {
        var sliceEnd = i === arr.length - 1 ? array.length : arr[i + 1];
        result.push(array.slice(current, sliceEnd));

        return result;
    }, []);

    var additional = new Array(indexes.length + 1 - splitted.length).fill([]);

    return splitted.concat(additional);
};

var getTransformedOptions = function getTransformedOptions(optionsConfiguration) {
    var options = {};
    var currentOption = '';

    optionsConfiguration.forEach(function (option) {
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
var getParsedCommandLine = exports.getParsedCommandLine = function getParsedCommandLine(commandLine) {
    var indexes = [1, commandLine.findIndex(isOption)];
    var splitted = getArraySplitByIndexes(commandLine, indexes);

    return {
        command: splitted[0][0] || null,
        parameters: splitted[1],
        options: getTransformedOptions(splitted[2])
    };
};

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _generate = __webpack_require__(19);

var _generate2 = _interopRequireDefault(_generate);

var _help = __webpack_require__(56);

var _help2 = _interopRequireDefault(_help);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
    generate: _generate2.default,
    help: _help2.default
};

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _executor = __webpack_require__(20);

var _executor2 = _interopRequireDefault(_executor);

var _validator = __webpack_require__(55);

var _validator2 = _interopRequireDefault(_validator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
    executor: _executor2.default,
    validator: _validator2.default
};

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = function (parameters, options, configuration) {
    var bundleName = parameters[0];
    var setName = parameters[1];

    var bundleConfiguration = configuration.bundles[bundleName];
    var settings = _extends({}, options, {
        featureName: setName,
        root: configuration.root + '/',
        t: t
    });

    console.log(configuration);

    Object.keys(bundleConfiguration).forEach(function (key) {
        var config = bundleConfiguration[key];
        var sourceTemplate = getTemplate(config.templateType, config.template, configuration.templates, // TODO rename to templatePath
        configuration.defaultTemplates);
        var compiledSourceTemplate = getCompiledTemplate(sourceTemplate, settings);
        var destinationTemplate = getTemplate('string', config.destination);
        var compiledDestinationTemplate = getCompiledTemplate(destinationTemplate, settings);

        console.log(key + ' is generating...');

        performAction(config.action, compiledSourceTemplate, compiledDestinationTemplate);
    });

    console.log('-------');
    console.log('success');
};

var _path = __webpack_require__(0);

var _path2 = _interopRequireDefault(_path);

var _fsExtra = __webpack_require__(8);

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _ejs = __webpack_require__(50);

var _ejs2 = _interopRequireDefault(_ejs);

var _transformers = __webpack_require__(53);

var t = _interopRequireWildcard(_transformers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getTemplate = function getTemplate(templateType, template, templatePath, defaultTemplatePath) {
    if (templateType === 'file') {
        if (_fsExtra2.default.pathExistsSync(_path2.default.join(templatePath, template))) {
            return _fsExtra2.default.readFileSync(_path2.default.join(templatePath, template), 'utf8');
        }
        return _fsExtra2.default.readFileSync(_path2.default.join(defaultTemplatePath, template), 'utf8');
    }
    return template;
};

var getCompiledTemplate = function getCompiledTemplate(string, settings) {
    return _ejs2.default.render(string, settings);
};

var performAction = function performAction(action, template, destinationPath) {
    switch (action) {
        case 'create':
            {
                _fsExtra2.default.outputFileSync(destinationPath, template);
                break;
            }
        case 'appendBottom':
            {
                if (!_fsExtra2.default.pathExistsSync(destinationPath)) {
                    _fsExtra2.default.outputFileSync(destinationPath, template);
                } else if (!_fsExtra2.default.readFileSync(destinationPath, 'utf8').includes(template)) {
                    _fsExtra2.default.appendFileSync(destinationPath, template);
                }
                break;
            }
        default:
            {
                console.log('invalid action');
                break;
            }
    }
};

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// simple mutable assign

function assign() {
  var args = [].slice.call(arguments).filter(function (i) {
    return i;
  });
  var dest = args.shift();
  args.forEach(function (src) {
    Object.keys(src).forEach(function (key) {
      dest[key] = src[key];
    });
  });

  return dest;
}

module.exports = assign;

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(10);
var constants = __webpack_require__(23);

var origCwd = process.cwd;
var cwd = null;

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;

process.cwd = function () {
  if (!cwd) cwd = origCwd.call(process);
  return cwd;
};
try {
  process.cwd();
} catch (er) {}

var chdir = process.chdir;
process.chdir = function (d) {
  cwd = null;
  chdir.call(process, d);
};

module.exports = patch;

function patch(fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants.hasOwnProperty('O_SYMLINK') && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs);
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs);
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown);
  fs.fchown = chownFix(fs.fchown);
  fs.lchown = chownFix(fs.lchown);

  fs.chmod = chmodFix(fs.chmod);
  fs.fchmod = chmodFix(fs.fchmod);
  fs.lchmod = chmodFix(fs.lchmod);

  fs.chownSync = chownFixSync(fs.chownSync);
  fs.fchownSync = chownFixSync(fs.fchownSync);
  fs.lchownSync = chownFixSync(fs.lchownSync);

  fs.chmodSync = chmodFixSync(fs.chmodSync);
  fs.fchmodSync = chmodFixSync(fs.fchmodSync);
  fs.lchmodSync = chmodFixSync(fs.lchmodSync);

  fs.stat = statFix(fs.stat);
  fs.fstat = statFix(fs.fstat);
  fs.lstat = statFix(fs.lstat);

  fs.statSync = statFixSync(fs.statSync);
  fs.fstatSync = statFixSync(fs.fstatSync);
  fs.lstatSync = statFixSync(fs.lstatSync);

  // if lchmod/lchown do not exist, then make them no-ops
  if (!fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchmodSync = function () {};
  }
  if (!fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchownSync = function () {};
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = function (fs$rename) {
      return function (from, to, cb) {
        var start = Date.now();
        var backoff = 0;
        fs$rename(from, to, function CB(er) {
          if (er && (er.code === "EACCES" || er.code === "EPERM") && Date.now() - start < 60000) {
            setTimeout(function () {
              fs.stat(to, function (stater, st) {
                if (stater && stater.code === "ENOENT") fs$rename(from, to, CB);else cb(er);
              });
            }, backoff);
            if (backoff < 100) backoff += 10;
            return;
          }
          if (cb) cb(er);
        });
      };
    }(fs.rename);
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = function (fs$read) {
    return function (fd, buffer, offset, length, position, callback_) {
      var _callback;
      if (callback_ && typeof callback_ === 'function') {
        var eagCounter = 0;
        _callback = function callback(er, _, __) {
          if (er && er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter++;
            return fs$read.call(fs, fd, buffer, offset, length, position, _callback);
          }
          callback_.apply(this, arguments);
        };
      }
      return fs$read.call(fs, fd, buffer, offset, length, position, _callback);
    };
  }(fs.read);

  fs.readSync = function (fs$readSync) {
    return function (fd, buffer, offset, length, position) {
      var eagCounter = 0;
      while (true) {
        try {
          return fs$readSync.call(fs, fd, buffer, offset, length, position);
        } catch (er) {
          if (er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter++;
            continue;
          }
          throw er;
        }
      }
    };
  }(fs.readSync);
}

function patchLchmod(fs) {
  fs.lchmod = function (path, mode, callback) {
    fs.open(path, constants.O_WRONLY | constants.O_SYMLINK, mode, function (err, fd) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      fs.fchmod(fd, mode, function (err) {
        fs.close(fd, function (err2) {
          if (callback) callback(err || err2);
        });
      });
    });
  };

  fs.lchmodSync = function (path, mode) {
    var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);

    // prefer to return the chmod error, if one occurs,
    // but still try to close, and report closing errors if they occur.
    var threw = true;
    var ret;
    try {
      ret = fs.fchmodSync(fd, mode);
      threw = false;
    } finally {
      if (threw) {
        try {
          fs.closeSync(fd);
        } catch (er) {}
      } else {
        fs.closeSync(fd);
      }
    }
    return ret;
  };
}

function patchLutimes(fs) {
  if (constants.hasOwnProperty("O_SYMLINK")) {
    fs.lutimes = function (path, at, mt, cb) {
      fs.open(path, constants.O_SYMLINK, function (er, fd) {
        if (er) {
          if (cb) cb(er);
          return;
        }
        fs.futimes(fd, at, mt, function (er) {
          fs.close(fd, function (er2) {
            if (cb) cb(er || er2);
          });
        });
      });
    };

    fs.lutimesSync = function (path, at, mt) {
      var fd = fs.openSync(path, constants.O_SYMLINK);
      var ret;
      var threw = true;
      try {
        ret = fs.futimesSync(fd, at, mt);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd);
          } catch (er) {}
        } else {
          fs.closeSync(fd);
        }
      }
      return ret;
    };
  } else {
    fs.lutimes = function (_a, _b, _c, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lutimesSync = function () {};
  }
}

function chmodFix(orig) {
  if (!orig) return orig;
  return function (target, mode, cb) {
    return orig.call(fs, target, mode, function (er) {
      if (chownErOk(er)) er = null;
      if (cb) cb.apply(this, arguments);
    });
  };
}

function chmodFixSync(orig) {
  if (!orig) return orig;
  return function (target, mode) {
    try {
      return orig.call(fs, target, mode);
    } catch (er) {
      if (!chownErOk(er)) throw er;
    }
  };
}

function chownFix(orig) {
  if (!orig) return orig;
  return function (target, uid, gid, cb) {
    return orig.call(fs, target, uid, gid, function (er) {
      if (chownErOk(er)) er = null;
      if (cb) cb.apply(this, arguments);
    });
  };
}

function chownFixSync(orig) {
  if (!orig) return orig;
  return function (target, uid, gid) {
    try {
      return orig.call(fs, target, uid, gid);
    } catch (er) {
      if (!chownErOk(er)) throw er;
    }
  };
}

function statFix(orig) {
  if (!orig) return orig;
  // Older versions of Node erroneously returned signed integers for
  // uid + gid.
  return function (target, cb) {
    return orig.call(fs, target, function (er, stats) {
      if (!stats) return cb.apply(this, arguments);
      if (stats.uid < 0) stats.uid += 0x100000000;
      if (stats.gid < 0) stats.gid += 0x100000000;
      if (cb) cb.apply(this, arguments);
    });
  };
}

function statFixSync(orig) {
  if (!orig) return orig;
  // Older versions of Node erroneously returned signed integers for
  // uid + gid.
  return function (target) {
    var stats = orig.call(fs, target);
    if (stats.uid < 0) stats.uid += 0x100000000;
    if (stats.gid < 0) stats.gid += 0x100000000;
    return stats;
  };
}

// ENOSYS means that the fs doesn't support the op. Just ignore
// that, because it doesn't matter.
//
// if there's no getuid, or if getuid() is something other
// than 0, and the error is EINVAL or EPERM, then just ignore
// it.
//
// This specific case is a silent failure in cp, install, tar,
// and most other unix tools that manage permissions.
//
// When running as root, or if other types of errors are
// encountered, then it's strict.
function chownErOk(er) {
  if (!er) return true;

  if (er.code === "ENOSYS") return true;

  var nonroot = !process.getuid || process.getuid() !== 0;
  if (nonroot) {
    if (er.code === "EINVAL" || er.code === "EPERM") return true;
  }

  return false;
}

/***/ }),
/* 23 */
/***/ (function(module, exports) {

module.exports = require("constants");

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Stream = __webpack_require__(25).Stream;

module.exports = legacy;

function legacy(fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  };

  function ReadStream(path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function () {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    });
  }

  function WriteStream(path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}

/***/ }),
/* 25 */
/***/ (function(module, exports) {

module.exports = require("stream");

/***/ }),
/* 26 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var u = __webpack_require__(2).fromCallback;
module.exports = {
  copy: u(__webpack_require__(28))
};

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(1);
var path = __webpack_require__(0);
var ncp = __webpack_require__(12);
var mkdir = __webpack_require__(3);
var pathExists = __webpack_require__(4).pathExists;

function copy(src, dest, options, callback) {
  if (typeof options === 'function' && !callback) {
    callback = options;
    options = {};
  } else if (typeof options === 'function' || options instanceof RegExp) {
    options = { filter: options };
  }
  callback = callback || function () {};
  options = options || {};

  // Warn about using preserveTimestamps on 32-bit node:
  if (options.preserveTimestamps && process.arch === 'ia32') {
    console.warn('fs-extra: Using the preserveTimestamps option in 32-bit node is not recommended;\n\n    see https://github.com/jprichardson/node-fs-extra/issues/269');
  }

  // don't allow src and dest to be the same
  var basePath = process.cwd();
  var currentPath = path.resolve(basePath, src);
  var targetPath = path.resolve(basePath, dest);
  if (currentPath === targetPath) return callback(new Error('Source and destination must not be the same.'));

  fs.lstat(src, function (err, stats) {
    if (err) return callback(err);

    var dir = null;
    if (stats.isDirectory()) {
      var parts = dest.split(path.sep);
      parts.pop();
      dir = parts.join(path.sep);
    } else {
      dir = path.dirname(dest);
    }

    pathExists(dir, function (err, dirExists) {
      if (err) return callback(err);
      if (dirExists) return ncp(src, dest, options, callback);
      mkdir.mkdirs(dir, function (err) {
        if (err) return callback(err);
        ncp(src, dest, options, callback);
      });
    });
  });
}

module.exports = copy;

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(1);
var os = __webpack_require__(30);
var path = __webpack_require__(0);

// HFS, ext{2,3}, FAT do not, Node.js v0.10 does not
function hasMillisResSync() {
  var tmpfile = path.join('millis-test-sync' + Date.now().toString() + Math.random().toString().slice(2));
  tmpfile = path.join(os.tmpdir(), tmpfile);

  // 550 millis past UNIX epoch
  var d = new Date(1435410243862);
  fs.writeFileSync(tmpfile, 'https://github.com/jprichardson/node-fs-extra/pull/141');
  var fd = fs.openSync(tmpfile, 'r+');
  fs.futimesSync(fd, d, d);
  fs.closeSync(fd);
  return fs.statSync(tmpfile).mtime > 1435410243000;
}

function hasMillisRes(callback) {
  var tmpfile = path.join('millis-test' + Date.now().toString() + Math.random().toString().slice(2));
  tmpfile = path.join(os.tmpdir(), tmpfile);

  // 550 millis past UNIX epoch
  var d = new Date(1435410243862);
  fs.writeFile(tmpfile, 'https://github.com/jprichardson/node-fs-extra/pull/141', function (err) {
    if (err) return callback(err);
    fs.open(tmpfile, 'r+', function (err, fd) {
      if (err) return callback(err);
      fs.futimes(fd, d, d, function (err) {
        if (err) return callback(err);
        fs.close(fd, function (err) {
          if (err) return callback(err);
          fs.stat(tmpfile, function (err, stats) {
            if (err) return callback(err);
            callback(null, stats.mtime > 1435410243000);
          });
        });
      });
    });
  });
}

function timeRemoveMillis(timestamp) {
  if (typeof timestamp === 'number') {
    return Math.floor(timestamp / 1000) * 1000;
  } else if (timestamp instanceof Date) {
    return new Date(Math.floor(timestamp.getTime() / 1000) * 1000);
  } else {
    throw new Error('fs-extra: timeRemoveMillis() unknown parameter type');
  }
}

function utimesMillis(path, atime, mtime, callback) {
  // if (!HAS_MILLIS_RES) return fs.utimes(path, atime, mtime, callback)
  fs.open(path, 'r+', function (err, fd) {
    if (err) return callback(err);
    fs.futimes(fd, atime, mtime, function (futimesErr) {
      fs.close(fd, function (closeErr) {
        if (callback) callback(futimesErr || closeErr);
      });
    });
  });
}

module.exports = {
  hasMillisRes: hasMillisRes,
  hasMillisResSync: hasMillisResSync,
  timeRemoveMillis: timeRemoveMillis,
  utimesMillis: utimesMillis
};

/***/ }),
/* 30 */
/***/ (function(module, exports) {

module.exports = require("os");

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var fs = __webpack_require__(1);
var path = __webpack_require__(0);
var invalidWin32Path = __webpack_require__(13).invalidWin32Path;

var o777 = parseInt('0777', 8);

function mkdirs(p, opts, callback, made) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  } else if (!opts || (typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) !== 'object') {
    opts = { mode: opts };
  }

  if (process.platform === 'win32' && invalidWin32Path(p)) {
    var errInval = new Error(p + ' contains invalid WIN32 path characters.');
    errInval.code = 'EINVAL';
    return callback(errInval);
  }

  var mode = opts.mode;
  var xfs = opts.fs || fs;

  if (mode === undefined) {
    mode = o777 & ~process.umask();
  }
  if (!made) made = null;

  callback = callback || function () {};
  p = path.resolve(p);

  xfs.mkdir(p, mode, function (er) {
    if (!er) {
      made = made || p;
      return callback(null, made);
    }
    switch (er.code) {
      case 'ENOENT':
        if (path.dirname(p) === p) return callback(er);
        mkdirs(path.dirname(p), opts, function (er, made) {
          if (er) callback(er, made);else mkdirs(p, opts, callback, made);
        });
        break;

      // In the case of any other error, just see if there's a dir
      // there already.  If so, then hooray!  If not, then something
      // is borked.
      default:
        xfs.stat(p, function (er2, stat) {
          // if the stat fails, then that's super weird.
          // let the original error be the failure reason.
          if (er2 || !stat.isDirectory()) callback(er, made);else callback(null, made);
        });
        break;
    }
  });
}

module.exports = mkdirs;

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var fs = __webpack_require__(1);
var path = __webpack_require__(0);
var invalidWin32Path = __webpack_require__(13).invalidWin32Path;

var o777 = parseInt('0777', 8);

function mkdirsSync(p, opts, made) {
  if (!opts || (typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) !== 'object') {
    opts = { mode: opts };
  }

  var mode = opts.mode;
  var xfs = opts.fs || fs;

  if (process.platform === 'win32' && invalidWin32Path(p)) {
    var errInval = new Error(p + ' contains invalid WIN32 path characters.');
    errInval.code = 'EINVAL';
    throw errInval;
  }

  if (mode === undefined) {
    mode = o777 & ~process.umask();
  }
  if (!made) made = null;

  p = path.resolve(p);

  try {
    xfs.mkdirSync(p, mode);
    made = made || p;
  } catch (err0) {
    switch (err0.code) {
      case 'ENOENT':
        if (path.dirname(p) === p) throw err0;
        made = mkdirsSync(path.dirname(p), opts, made);
        mkdirsSync(p, opts, made);
        break;

      // In the case of any other error, just see if there's a dir
      // there already.  If so, then hooray!  If not, then something
      // is borked.
      default:
        var stat = void 0;
        try {
          stat = xfs.statSync(p);
        } catch (err1) {
          throw err0;
        }
        if (!stat.isDirectory()) throw err0;
        break;
    }
  }

  return made;
}

module.exports = mkdirsSync;

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(1);
var path = __webpack_require__(0);
var copyFileSync = __webpack_require__(34);
var mkdir = __webpack_require__(3);

function copySync(src, dest, options) {
  if (typeof options === 'function' || options instanceof RegExp) {
    options = { filter: options };
  }

  options = options || {};
  options.recursive = !!options.recursive;

  // default to true for now
  options.clobber = 'clobber' in options ? !!options.clobber : true;
  // overwrite falls back to clobber
  options.overwrite = 'overwrite' in options ? !!options.overwrite : options.clobber;
  options.dereference = 'dereference' in options ? !!options.dereference : false;
  options.preserveTimestamps = 'preserveTimestamps' in options ? !!options.preserveTimestamps : false;

  options.filter = options.filter || function () {
    return true;
  };

  // Warn about using preserveTimestamps on 32-bit node:
  if (options.preserveTimestamps && process.arch === 'ia32') {
    console.warn('fs-extra: Using the preserveTimestamps option in 32-bit node is not recommended;\n\n    see https://github.com/jprichardson/node-fs-extra/issues/269');
  }

  var stats = options.recursive && !options.dereference ? fs.lstatSync(src) : fs.statSync(src);
  var destFolder = path.dirname(dest);
  var destFolderExists = fs.existsSync(destFolder);
  var performCopy = false;

  if (options.filter instanceof RegExp) {
    console.warn('Warning: fs-extra: Passing a RegExp filter is deprecated, use a function');
    performCopy = options.filter.test(src);
  } else if (typeof options.filter === 'function') performCopy = options.filter(src, dest);

  if (stats.isFile() && performCopy) {
    if (!destFolderExists) mkdir.mkdirsSync(destFolder);
    copyFileSync(src, dest, {
      overwrite: options.overwrite,
      errorOnExist: options.errorOnExist,
      preserveTimestamps: options.preserveTimestamps
    });
  } else if (stats.isDirectory() && performCopy) {
    if (!fs.existsSync(dest)) mkdir.mkdirsSync(dest);
    var contents = fs.readdirSync(src);
    contents.forEach(function (content) {
      var opts = options;
      opts.recursive = true;
      copySync(path.join(src, content), path.join(dest, content), opts);
    });
  } else if (options.recursive && stats.isSymbolicLink() && performCopy) {
    var srcPath = fs.readlinkSync(src);
    fs.symlinkSync(srcPath, dest);
  }
}

module.exports = copySync;

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(1);

var BUF_LENGTH = 64 * 1024;
var _buff = __webpack_require__(15)(BUF_LENGTH);

function copyFileSync(srcFile, destFile, options) {
  var overwrite = options.overwrite;
  var errorOnExist = options.errorOnExist;
  var preserveTimestamps = options.preserveTimestamps;

  if (fs.existsSync(destFile)) {
    if (overwrite) {
      fs.unlinkSync(destFile);
    } else if (errorOnExist) {
      throw new Error(destFile + ' already exists');
    } else return;
  }

  var fdr = fs.openSync(srcFile, 'r');
  var stat = fs.fstatSync(fdr);
  var fdw = fs.openSync(destFile, 'w', stat.mode);
  var bytesRead = 1;
  var pos = 0;

  while (bytesRead > 0) {
    bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
    fs.writeSync(fdw, _buff, 0, bytesRead);
    pos += bytesRead;
  }

  if (preserveTimestamps) {
    fs.futimesSync(fdw, stat.atime, stat.mtime);
  }

  fs.closeSync(fdr);
  fs.closeSync(fdw);
}

module.exports = copyFileSync;

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var fs = __webpack_require__(1);
var path = __webpack_require__(0);
var assert = __webpack_require__(11);

var isWindows = process.platform === 'win32';

function defaults(options) {
  var methods = ['unlink', 'chmod', 'stat', 'lstat', 'rmdir', 'readdir'];
  methods.forEach(function (m) {
    options[m] = options[m] || fs[m];
    m = m + 'Sync';
    options[m] = options[m] || fs[m];
  });

  options.maxBusyTries = options.maxBusyTries || 3;
}

function rimraf(p, options, cb) {
  var busyTries = 0;

  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  assert(p, 'rimraf: missing path');
  assert.equal(typeof p === 'undefined' ? 'undefined' : _typeof(p), 'string', 'rimraf: path should be a string');
  assert.equal(typeof cb === 'undefined' ? 'undefined' : _typeof(cb), 'function', 'rimraf: callback function required');
  assert(options, 'rimraf: invalid options argument provided');
  assert.equal(typeof options === 'undefined' ? 'undefined' : _typeof(options), 'object', 'rimraf: options should be object');

  defaults(options);

  rimraf_(p, options, function CB(er) {
    if (er) {
      if (isWindows && (er.code === 'EBUSY' || er.code === 'ENOTEMPTY' || er.code === 'EPERM') && busyTries < options.maxBusyTries) {
        busyTries++;
        var time = busyTries * 100;
        // try again, with the same exact callback as this one.
        return setTimeout(function () {
          return rimraf_(p, options, CB);
        }, time);
      }

      // already gone
      if (er.code === 'ENOENT') er = null;
    }

    cb(er);
  });
}

// Two possible strategies.
// 1. Assume it's a file.  unlink it, then do the dir stuff on EPERM or EISDIR
// 2. Assume it's a directory.  readdir, then do the file stuff on ENOTDIR
//
// Both result in an extra syscall when you guess wrong.  However, there
// are likely far more normal files in the world than directories.  This
// is based on the assumption that a the average number of files per
// directory is >= 1.
//
// If anyone ever complains about this, then I guess the strategy could
// be made configurable somehow.  But until then, YAGNI.
function rimraf_(p, options, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  // sunos lets the root user unlink directories, which is... weird.
  // so we have to lstat here and make sure it's not a dir.
  options.lstat(p, function (er, st) {
    if (er && er.code === 'ENOENT') {
      return cb(null);
    }

    // Windows can EPERM on stat.  Life is suffering.
    if (er && er.code === 'EPERM' && isWindows) {
      return fixWinEPERM(p, options, er, cb);
    }

    if (st && st.isDirectory()) {
      return rmdir(p, options, er, cb);
    }

    options.unlink(p, function (er) {
      if (er) {
        if (er.code === 'ENOENT') {
          return cb(null);
        }
        if (er.code === 'EPERM') {
          return isWindows ? fixWinEPERM(p, options, er, cb) : rmdir(p, options, er, cb);
        }
        if (er.code === 'EISDIR') {
          return rmdir(p, options, er, cb);
        }
      }
      return cb(er);
    });
  });
}

function fixWinEPERM(p, options, er, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');
  if (er) {
    assert(er instanceof Error);
  }

  options.chmod(p, 666, function (er2) {
    if (er2) {
      cb(er2.code === 'ENOENT' ? null : er);
    } else {
      options.stat(p, function (er3, stats) {
        if (er3) {
          cb(er3.code === 'ENOENT' ? null : er);
        } else if (stats.isDirectory()) {
          rmdir(p, options, er, cb);
        } else {
          options.unlink(p, cb);
        }
      });
    }
  });
}

function fixWinEPERMSync(p, options, er) {
  var stats = void 0;

  assert(p);
  assert(options);
  if (er) {
    assert(er instanceof Error);
  }

  try {
    options.chmodSync(p, 666);
  } catch (er2) {
    if (er2.code === 'ENOENT') {
      return;
    } else {
      throw er;
    }
  }

  try {
    stats = options.statSync(p);
  } catch (er3) {
    if (er3.code === 'ENOENT') {
      return;
    } else {
      throw er;
    }
  }

  if (stats.isDirectory()) {
    rmdirSync(p, options, er);
  } else {
    options.unlinkSync(p);
  }
}

function rmdir(p, options, originalEr, cb) {
  assert(p);
  assert(options);
  if (originalEr) {
    assert(originalEr instanceof Error);
  }
  assert(typeof cb === 'function');

  // try to rmdir first, and only readdir on ENOTEMPTY or EEXIST (SunOS)
  // if we guessed wrong, and it's not a directory, then
  // raise the original error.
  options.rmdir(p, function (er) {
    if (er && (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM')) {
      rmkids(p, options, cb);
    } else if (er && er.code === 'ENOTDIR') {
      cb(originalEr);
    } else {
      cb(er);
    }
  });
}

function rmkids(p, options, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  options.readdir(p, function (er, files) {
    if (er) return cb(er);

    var n = files.length;
    var errState = void 0;

    if (n === 0) return options.rmdir(p, cb);

    files.forEach(function (f) {
      rimraf(path.join(p, f), options, function (er) {
        if (errState) {
          return;
        }
        if (er) return cb(errState = er);
        if (--n === 0) {
          options.rmdir(p, cb);
        }
      });
    });
  });
}

// this looks simpler, and is strictly *faster*, but will
// tie up the JavaScript thread and fail on excessively
// deep directory trees.
function rimrafSync(p, options) {
  var st = void 0;

  options = options || {};
  defaults(options);

  assert(p, 'rimraf: missing path');
  assert.equal(typeof p === 'undefined' ? 'undefined' : _typeof(p), 'string', 'rimraf: path should be a string');
  assert(options, 'rimraf: missing options');
  assert.equal(typeof options === 'undefined' ? 'undefined' : _typeof(options), 'object', 'rimraf: options should be object');

  try {
    st = options.lstatSync(p);
  } catch (er) {
    if (er.code === 'ENOENT') {
      return;
    }

    // Windows can EPERM on stat.  Life is suffering.
    if (er.code === 'EPERM' && isWindows) {
      fixWinEPERMSync(p, options, er);
    }
  }

  try {
    // sunos lets the root user unlink directories, which is... weird.
    if (st && st.isDirectory()) {
      rmdirSync(p, options, null);
    } else {
      options.unlinkSync(p);
    }
  } catch (er) {
    if (er.code === 'ENOENT') {
      return;
    } else if (er.code === 'EPERM') {
      return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er);
    } else if (er.code !== 'EISDIR') {
      throw er;
    }
    rmdirSync(p, options, er);
  }
}

function rmdirSync(p, options, originalEr) {
  assert(p);
  assert(options);
  if (originalEr) {
    assert(originalEr instanceof Error);
  }

  try {
    options.rmdirSync(p);
  } catch (er) {
    if (er.code === 'ENOTDIR') {
      throw originalEr;
    } else if (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM') {
      rmkidsSync(p, options);
    } else if (er.code !== 'ENOENT') {
      throw er;
    }
  }
}

function rmkidsSync(p, options) {
  assert(p);
  assert(options);
  options.readdirSync(p).forEach(function (f) {
    return rimrafSync(path.join(p, f), options);
  });
  options.rmdirSync(p, options);
}

module.exports = rimraf;
rimraf.sync = rimrafSync;

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var u = __webpack_require__(2).fromCallback;
var jsonFile = __webpack_require__(7);

jsonFile.outputJsonSync = __webpack_require__(38);
jsonFile.outputJson = u(__webpack_require__(39));
// aliases
jsonFile.outputJSONSync = jsonFile.outputJSONSync;
jsonFile.outputJSON = jsonFile.outputJson;
jsonFile.writeJSON = jsonFile.writeJson;
jsonFile.writeJSONSync = jsonFile.writeJsonSync;
jsonFile.readJSON = jsonFile.readJson;
jsonFile.readJSONSync = jsonFile.readJsonSync;

module.exports = jsonFile;

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _fs;
try {
  _fs = __webpack_require__(1);
} catch (_) {
  _fs = __webpack_require__(5);
}

function readFile(file, options, callback) {
  if (callback == null) {
    callback = options;
    options = {};
  }

  if (typeof options === 'string') {
    options = { encoding: options };
  }

  options = options || {};
  var fs = options.fs || _fs;

  var shouldThrow = true;
  // DO NOT USE 'passParsingErrors' THE NAME WILL CHANGE!!!, use 'throws' instead
  if ('passParsingErrors' in options) {
    shouldThrow = options.passParsingErrors;
  } else if ('throws' in options) {
    shouldThrow = options.throws;
  }

  fs.readFile(file, options, function (err, data) {
    if (err) return callback(err);

    data = stripBom(data);

    var obj;
    try {
      obj = JSON.parse(data, options ? options.reviver : null);
    } catch (err2) {
      if (shouldThrow) {
        err2.message = file + ': ' + err2.message;
        return callback(err2);
      } else {
        return callback(null, null);
      }
    }

    callback(null, obj);
  });
}

function readFileSync(file, options) {
  options = options || {};
  if (typeof options === 'string') {
    options = { encoding: options };
  }

  var fs = options.fs || _fs;

  var shouldThrow = true;
  // DO NOT USE 'passParsingErrors' THE NAME WILL CHANGE!!!, use 'throws' instead
  if ('passParsingErrors' in options) {
    shouldThrow = options.passParsingErrors;
  } else if ('throws' in options) {
    shouldThrow = options.throws;
  }

  try {
    var content = fs.readFileSync(file, options);
    content = stripBom(content);
    return JSON.parse(content, options.reviver);
  } catch (err) {
    if (shouldThrow) {
      err.message = file + ': ' + err.message;
      throw err;
    } else {
      return null;
    }
  }
}

function writeFile(file, obj, options, callback) {
  if (callback == null) {
    callback = options;
    options = {};
  }
  options = options || {};
  var fs = options.fs || _fs;

  var spaces = (typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object' && options !== null ? 'spaces' in options ? options.spaces : this.spaces : this.spaces;

  var str = '';
  try {
    str = JSON.stringify(obj, options ? options.replacer : null, spaces) + '\n';
  } catch (err) {
    if (callback) return callback(err, null);
  }

  fs.writeFile(file, str, options, callback);
}

function writeFileSync(file, obj, options) {
  options = options || {};
  var fs = options.fs || _fs;

  var spaces = (typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object' && options !== null ? 'spaces' in options ? options.spaces : this.spaces : this.spaces;

  var str = JSON.stringify(obj, options.replacer, spaces) + '\n';
  // not sure if fs.writeFileSync returns anything, but just in case
  return fs.writeFileSync(file, str, options);
}

function stripBom(content) {
  // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
  if (Buffer.isBuffer(content)) content = content.toString('utf8');
  content = content.replace(/^\uFEFF/, '');
  return content;
}

var jsonfile = {
  spaces: null,
  readFile: readFile,
  readFileSync: readFileSync,
  writeFile: writeFile,
  writeFileSync: writeFileSync
};

module.exports = jsonfile;

/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(1);
var path = __webpack_require__(0);
var mkdir = __webpack_require__(3);
var jsonFile = __webpack_require__(7);

function outputJsonSync(file, data, options) {
  var dir = path.dirname(file);

  if (!fs.existsSync(dir)) {
    mkdir.mkdirsSync(dir);
  }

  jsonFile.writeJsonSync(file, data, options);
}

module.exports = outputJsonSync;

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var path = __webpack_require__(0);
var mkdir = __webpack_require__(3);
var pathExists = __webpack_require__(4).pathExists;
var jsonFile = __webpack_require__(7);

function outputJson(file, data, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var dir = path.dirname(file);

  pathExists(dir, function (err, itDoes) {
    if (err) return callback(err);
    if (itDoes) return jsonFile.writeJson(file, data, options, callback);

    mkdir.mkdirs(dir, function (err) {
      if (err) return callback(err);
      jsonFile.writeJson(file, data, options, callback);
    });
  });
}

module.exports = outputJson;

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// most of this code was written by Andrew Kelley
// licensed under the BSD license: see
// https://github.com/andrewrk/node-mv/blob/master/package.json

// this needs a cleanup

var u = __webpack_require__(2).fromCallback;
var fs = __webpack_require__(1);
var ncp = __webpack_require__(12);
var path = __webpack_require__(0);
var remove = __webpack_require__(6).remove;
var mkdirp = __webpack_require__(3).mkdirs;

function move(source, dest, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var shouldMkdirp = 'mkdirp' in options ? options.mkdirp : true;
  var overwrite = options.overwrite || options.clobber || false;

  if (shouldMkdirp) {
    mkdirs();
  } else {
    doRename();
  }

  function mkdirs() {
    mkdirp(path.dirname(dest), function (err) {
      if (err) return callback(err);
      doRename();
    });
  }

  function doRename() {
    if (path.resolve(source) === path.resolve(dest)) {
      fs.access(source, callback);
    } else if (overwrite) {
      fs.rename(source, dest, function (err) {
        if (!err) return callback();

        if (err.code === 'ENOTEMPTY' || err.code === 'EEXIST') {
          remove(dest, function (err) {
            if (err) return callback(err);
            options.overwrite = false; // just overwriteed it, no need to do it again
            move(source, dest, options, callback);
          });
          return;
        }

        // weird Windows shit
        if (err.code === 'EPERM') {
          setTimeout(function () {
            remove(dest, function (err) {
              if (err) return callback(err);
              options.overwrite = false;
              move(source, dest, options, callback);
            });
          }, 200);
          return;
        }

        if (err.code !== 'EXDEV') return callback(err);
        moveAcrossDevice(source, dest, overwrite, callback);
      });
    } else {
      fs.link(source, dest, function (err) {
        if (err) {
          if (err.code === 'EXDEV' || err.code === 'EISDIR' || err.code === 'EPERM' || err.code === 'ENOTSUP') {
            moveAcrossDevice(source, dest, overwrite, callback);
            return;
          }
          callback(err);
          return;
        }
        fs.unlink(source, callback);
      });
    }
  }
}

function moveAcrossDevice(source, dest, overwrite, callback) {
  fs.stat(source, function (err, stat) {
    if (err) {
      callback(err);
      return;
    }

    if (stat.isDirectory()) {
      moveDirAcrossDevice(source, dest, overwrite, callback);
    } else {
      moveFileAcrossDevice(source, dest, overwrite, callback);
    }
  });
}

function moveFileAcrossDevice(source, dest, overwrite, callback) {
  var flags = overwrite ? 'w' : 'wx';
  var ins = fs.createReadStream(source);
  var outs = fs.createWriteStream(dest, { flags: flags });

  ins.on('error', function (err) {
    ins.destroy();
    outs.destroy();
    outs.removeListener('close', onClose);

    // may want to create a directory but `out` line above
    // creates an empty file for us: See #108
    // don't care about error here
    fs.unlink(dest, function () {
      // note: `err` here is from the input stream errror
      if (err.code === 'EISDIR' || err.code === 'EPERM') {
        moveDirAcrossDevice(source, dest, overwrite, callback);
      } else {
        callback(err);
      }
    });
  });

  outs.on('error', function (err) {
    ins.destroy();
    outs.destroy();
    outs.removeListener('close', onClose);
    callback(err);
  });

  outs.once('close', onClose);
  ins.pipe(outs);

  function onClose() {
    fs.unlink(source, callback);
  }
}

function moveDirAcrossDevice(source, dest, overwrite, callback) {
  var options = {
    overwrite: false
  };

  if (overwrite) {
    remove(dest, function (err) {
      if (err) return callback(err);
      startNcp();
    });
  } else {
    startNcp();
  }

  function startNcp() {
    ncp(source, dest, options, function (err) {
      if (err) return callback(err);
      remove(source, callback);
    });
  }
}

module.exports = {
  move: u(move)
};

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(1);
var path = __webpack_require__(0);
var copySync = __webpack_require__(14).copySync;
var removeSync = __webpack_require__(6).removeSync;
var mkdirpSync = __webpack_require__(3).mkdirsSync;
var buffer = __webpack_require__(15);

function moveSync(src, dest, options) {
  options = options || {};
  var overwrite = options.overwrite || options.clobber || false;

  src = path.resolve(src);
  dest = path.resolve(dest);

  if (src === dest) return fs.accessSync(src);

  if (isSrcSubdir(src, dest)) throw new Error('Cannot move \'' + src + '\' into itself \'' + dest + '\'.');

  mkdirpSync(path.dirname(dest));
  tryRenameSync();

  function tryRenameSync() {
    if (overwrite) {
      try {
        return fs.renameSync(src, dest);
      } catch (err) {
        if (err.code === 'ENOTEMPTY' || err.code === 'EEXIST' || err.code === 'EPERM') {
          removeSync(dest);
          options.overwrite = false; // just overwriteed it, no need to do it again
          return moveSync(src, dest, options);
        }

        if (err.code !== 'EXDEV') throw err;
        return moveSyncAcrossDevice(src, dest, overwrite);
      }
    } else {
      try {
        fs.linkSync(src, dest);
        return fs.unlinkSync(src);
      } catch (err) {
        if (err.code === 'EXDEV' || err.code === 'EISDIR' || err.code === 'EPERM' || err.code === 'ENOTSUP') {
          return moveSyncAcrossDevice(src, dest, overwrite);
        }
        throw err;
      }
    }
  }
}

function moveSyncAcrossDevice(src, dest, overwrite) {
  var stat = fs.statSync(src);

  if (stat.isDirectory()) {
    return moveDirSyncAcrossDevice(src, dest, overwrite);
  } else {
    return moveFileSyncAcrossDevice(src, dest, overwrite);
  }
}

function moveFileSyncAcrossDevice(src, dest, overwrite) {
  var BUF_LENGTH = 64 * 1024;
  var _buff = buffer(BUF_LENGTH);

  var flags = overwrite ? 'w' : 'wx';

  var fdr = fs.openSync(src, 'r');
  var stat = fs.fstatSync(fdr);
  var fdw = fs.openSync(dest, flags, stat.mode);
  var bytesRead = 1;
  var pos = 0;

  while (bytesRead > 0) {
    bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
    fs.writeSync(fdw, _buff, 0, bytesRead);
    pos += bytesRead;
  }

  fs.closeSync(fdr);
  fs.closeSync(fdw);
  return fs.unlinkSync(src);
}

function moveDirSyncAcrossDevice(src, dest, overwrite) {
  var options = {
    overwrite: false
  };

  if (overwrite) {
    removeSync(dest);
    tryCopySync();
  } else {
    tryCopySync();
  }

  function tryCopySync() {
    copySync(src, dest, options);
    return removeSync(src);
  }
}

// return true if dest is a subdir of src, otherwise false.
// extract dest base dir and check if that is the same as src basename
function isSrcSubdir(src, dest) {
  try {
    return fs.statSync(src).isDirectory() && src !== dest && dest.indexOf(src) > -1 && dest.split(path.dirname(src) + path.sep)[1].split(path.sep)[0] === path.basename(src);
  } catch (e) {
    return false;
  }
}

module.exports = {
  moveSync: moveSync
};

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var u = __webpack_require__(2).fromCallback;
var fs = __webpack_require__(5);
var path = __webpack_require__(0);
var mkdir = __webpack_require__(3);
var remove = __webpack_require__(6);

var emptyDir = u(function emptyDir(dir, callback) {
  callback = callback || function () {};
  fs.readdir(dir, function (err, items) {
    if (err) return mkdir.mkdirs(dir, callback);

    items = items.map(function (item) {
      return path.join(dir, item);
    });

    deleteItem();

    function deleteItem() {
      var item = items.pop();
      if (!item) return callback();
      remove.remove(item, function (err) {
        if (err) return callback(err);
        deleteItem();
      });
    }
  });
});

function emptyDirSync(dir) {
  var items = void 0;
  try {
    items = fs.readdirSync(dir);
  } catch (err) {
    return mkdir.mkdirsSync(dir);
  }

  items.forEach(function (item) {
    item = path.join(dir, item);
    remove.removeSync(item);
  });
}

module.exports = {
  emptyDirSync: emptyDirSync,
  emptydirSync: emptyDirSync,
  emptyDir: emptyDir,
  emptydir: emptyDir
};

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var file = __webpack_require__(44);
var link = __webpack_require__(45);
var symlink = __webpack_require__(46);

module.exports = {
  // file
  createFile: file.createFile,
  createFileSync: file.createFileSync,
  ensureFile: file.createFile,
  ensureFileSync: file.createFileSync,
  // link
  createLink: link.createLink,
  createLinkSync: link.createLinkSync,
  ensureLink: link.createLink,
  ensureLinkSync: link.createLinkSync,
  // symlink
  createSymlink: symlink.createSymlink,
  createSymlinkSync: symlink.createSymlinkSync,
  ensureSymlink: symlink.createSymlink,
  ensureSymlinkSync: symlink.createSymlinkSync
};

/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var u = __webpack_require__(2).fromCallback;
var path = __webpack_require__(0);
var fs = __webpack_require__(1);
var mkdir = __webpack_require__(3);
var pathExists = __webpack_require__(4).pathExists;

function createFile(file, callback) {
  function makeFile() {
    fs.writeFile(file, '', function (err) {
      if (err) return callback(err);
      callback();
    });
  }

  pathExists(file, function (err, fileExists) {
    if (err) return callback(err);
    if (fileExists) return callback();
    var dir = path.dirname(file);
    pathExists(dir, function (err, dirExists) {
      if (err) return callback(err);
      if (dirExists) return makeFile();
      mkdir.mkdirs(dir, function (err) {
        if (err) return callback(err);
        makeFile();
      });
    });
  });
}

function createFileSync(file) {
  if (fs.existsSync(file)) return;

  var dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    mkdir.mkdirsSync(dir);
  }

  fs.writeFileSync(file, '');
}

module.exports = {
  createFile: u(createFile),
  createFileSync: createFileSync
};

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var u = __webpack_require__(2).fromCallback;
var path = __webpack_require__(0);
var fs = __webpack_require__(1);
var mkdir = __webpack_require__(3);
var pathExists = __webpack_require__(4).pathExists;

function createLink(srcpath, dstpath, callback) {
  function makeLink(srcpath, dstpath) {
    fs.link(srcpath, dstpath, function (err) {
      if (err) return callback(err);
      callback(null);
    });
  }

  pathExists(dstpath, function (err, destinationExists) {
    if (err) return callback(err);
    if (destinationExists) return callback(null);
    fs.lstat(srcpath, function (err, stat) {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureLink');
        return callback(err);
      }

      var dir = path.dirname(dstpath);
      pathExists(dir, function (err, dirExists) {
        if (err) return callback(err);
        if (dirExists) return makeLink(srcpath, dstpath);
        mkdir.mkdirs(dir, function (err) {
          if (err) return callback(err);
          makeLink(srcpath, dstpath);
        });
      });
    });
  });
}

function createLinkSync(srcpath, dstpath, callback) {
  var destinationExists = fs.existsSync(dstpath);
  if (destinationExists) return undefined;

  try {
    fs.lstatSync(srcpath);
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureLink');
    throw err;
  }

  var dir = path.dirname(dstpath);
  var dirExists = fs.existsSync(dir);
  if (dirExists) return fs.linkSync(srcpath, dstpath);
  mkdir.mkdirsSync(dir);

  return fs.linkSync(srcpath, dstpath);
}

module.exports = {
  createLink: u(createLink),
  createLinkSync: createLinkSync
};

/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var u = __webpack_require__(2).fromCallback;
var path = __webpack_require__(0);
var fs = __webpack_require__(1);
var _mkdirs = __webpack_require__(3);
var mkdirs = _mkdirs.mkdirs;
var mkdirsSync = _mkdirs.mkdirsSync;

var _symlinkPaths = __webpack_require__(47);
var symlinkPaths = _symlinkPaths.symlinkPaths;
var symlinkPathsSync = _symlinkPaths.symlinkPathsSync;

var _symlinkType = __webpack_require__(48);
var symlinkType = _symlinkType.symlinkType;
var symlinkTypeSync = _symlinkType.symlinkTypeSync;

var pathExists = __webpack_require__(4).pathExists;

function createSymlink(srcpath, dstpath, type, callback) {
  callback = typeof type === 'function' ? type : callback;
  type = typeof type === 'function' ? false : type;

  pathExists(dstpath, function (err, destinationExists) {
    if (err) return callback(err);
    if (destinationExists) return callback(null);
    symlinkPaths(srcpath, dstpath, function (err, relative) {
      if (err) return callback(err);
      srcpath = relative.toDst;
      symlinkType(relative.toCwd, type, function (err, type) {
        if (err) return callback(err);
        var dir = path.dirname(dstpath);
        pathExists(dir, function (err, dirExists) {
          if (err) return callback(err);
          if (dirExists) return fs.symlink(srcpath, dstpath, type, callback);
          mkdirs(dir, function (err) {
            if (err) return callback(err);
            fs.symlink(srcpath, dstpath, type, callback);
          });
        });
      });
    });
  });
}

function createSymlinkSync(srcpath, dstpath, type, callback) {
  callback = typeof type === 'function' ? type : callback;
  type = typeof type === 'function' ? false : type;

  var destinationExists = fs.existsSync(dstpath);
  if (destinationExists) return undefined;

  var relative = symlinkPathsSync(srcpath, dstpath);
  srcpath = relative.toDst;
  type = symlinkTypeSync(relative.toCwd, type);
  var dir = path.dirname(dstpath);
  var exists = fs.existsSync(dir);
  if (exists) return fs.symlinkSync(srcpath, dstpath, type);
  mkdirsSync(dir);
  return fs.symlinkSync(srcpath, dstpath, type);
}

module.exports = {
  createSymlink: u(createSymlink),
  createSymlinkSync: createSymlinkSync
};

/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var path = __webpack_require__(0);
var fs = __webpack_require__(1);
var pathExists = __webpack_require__(4).pathExists;

/**
 * Function that returns two types of paths, one relative to symlink, and one
 * relative to the current working directory. Checks if path is absolute or
 * relative. If the path is relative, this function checks if the path is
 * relative to symlink or relative to current working directory. This is an
 * initiative to find a smarter `srcpath` to supply when building symlinks.
 * This allows you to determine which path to use out of one of three possible
 * types of source paths. The first is an absolute path. This is detected by
 * `path.isAbsolute()`. When an absolute path is provided, it is checked to
 * see if it exists. If it does it's used, if not an error is returned
 * (callback)/ thrown (sync). The other two options for `srcpath` are a
 * relative url. By default Node's `fs.symlink` works by creating a symlink
 * using `dstpath` and expects the `srcpath` to be relative to the newly
 * created symlink. If you provide a `srcpath` that does not exist on the file
 * system it results in a broken symlink. To minimize this, the function
 * checks to see if the 'relative to symlink' source file exists, and if it
 * does it will use it. If it does not, it checks if there's a file that
 * exists that is relative to the current working directory, if does its used.
 * This preserves the expectations of the original fs.symlink spec and adds
 * the ability to pass in `relative to current working direcotry` paths.
 */

function symlinkPaths(srcpath, dstpath, callback) {
  if (path.isAbsolute(srcpath)) {
    return fs.lstat(srcpath, function (err, stat) {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureSymlink');
        return callback(err);
      }
      return callback(null, {
        'toCwd': srcpath,
        'toDst': srcpath
      });
    });
  } else {
    var dstdir = path.dirname(dstpath);
    var relativeToDst = path.join(dstdir, srcpath);
    return pathExists(relativeToDst, function (err, exists) {
      if (err) return callback(err);
      if (exists) {
        return callback(null, {
          'toCwd': relativeToDst,
          'toDst': srcpath
        });
      } else {
        return fs.lstat(srcpath, function (err, stat) {
          if (err) {
            err.message = err.message.replace('lstat', 'ensureSymlink');
            return callback(err);
          }
          return callback(null, {
            'toCwd': srcpath,
            'toDst': path.relative(dstdir, srcpath)
          });
        });
      }
    });
  }
}

function symlinkPathsSync(srcpath, dstpath) {
  var exists = void 0;
  if (path.isAbsolute(srcpath)) {
    exists = fs.existsSync(srcpath);
    if (!exists) throw new Error('absolute srcpath does not exist');
    return {
      'toCwd': srcpath,
      'toDst': srcpath
    };
  } else {
    var dstdir = path.dirname(dstpath);
    var relativeToDst = path.join(dstdir, srcpath);
    exists = fs.existsSync(relativeToDst);
    if (exists) {
      return {
        'toCwd': relativeToDst,
        'toDst': srcpath
      };
    } else {
      exists = fs.existsSync(srcpath);
      if (!exists) throw new Error('relative srcpath does not exist');
      return {
        'toCwd': srcpath,
        'toDst': path.relative(dstdir, srcpath)
      };
    }
  }
}

module.exports = {
  symlinkPaths: symlinkPaths,
  symlinkPathsSync: symlinkPathsSync
};

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(1);

function symlinkType(srcpath, type, callback) {
  callback = typeof type === 'function' ? type : callback;
  type = typeof type === 'function' ? false : type;
  if (type) return callback(null, type);
  fs.lstat(srcpath, function (err, stats) {
    if (err) return callback(null, 'file');
    type = stats && stats.isDirectory() ? 'dir' : 'file';
    callback(null, type);
  });
}

function symlinkTypeSync(srcpath, type) {
  var stats = void 0;

  if (type) return type;
  try {
    stats = fs.lstatSync(srcpath);
  } catch (e) {
    return 'file';
  }
  return stats && stats.isDirectory() ? 'dir' : 'file';
}

module.exports = {
  symlinkType: symlinkType,
  symlinkTypeSync: symlinkTypeSync
};

/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var u = __webpack_require__(2).fromCallback;
var fs = __webpack_require__(1);
var path = __webpack_require__(0);
var mkdir = __webpack_require__(3);
var pathExists = __webpack_require__(4).pathExists;

function outputFile(file, data, encoding, callback) {
  if (typeof encoding === 'function') {
    callback = encoding;
    encoding = 'utf8';
  }

  var dir = path.dirname(file);
  pathExists(dir, function (err, itDoes) {
    if (err) return callback(err);
    if (itDoes) return fs.writeFile(file, data, encoding, callback);

    mkdir.mkdirs(dir, function (err) {
      if (err) return callback(err);

      fs.writeFile(file, data, encoding, callback);
    });
  });
}

function outputFileSync(file, data, encoding) {
  var dir = path.dirname(file);
  if (fs.existsSync(dir)) {
    return fs.writeFileSync.apply(fs, arguments);
  }
  mkdir.mkdirsSync(dir);
  fs.writeFileSync.apply(fs, arguments);
}

module.exports = {
  outputFile: u(outputFile),
  outputFileSync: outputFileSync
};

/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
 * EJS Embedded JavaScript templates
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/



/**
 * @file Embedded JavaScript templating engine. {@link http://ejs.co}
 * @author Matthew Eernisse <mde@fleegix.org>
 * @author Tiancheng "Timothy" Gu <timothygu99@gmail.com>
 * @project EJS
 * @license {@link http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0}
 */

/**
 * EJS internal functions.
 *
 * Technically this "module" lies in the same file as {@link module:ejs}, for
 * the sake of organization all the private functions re grouped into this
 * module.
 *
 * @module ejs-internal
 * @private
 */

/**
 * Embedded JavaScript templating engine.
 *
 * @module ejs
 * @public
 */

var fs = __webpack_require__(5);
var path = __webpack_require__(0);
var utils = __webpack_require__(51);

var scopeOptionWarned = false;
var _VERSION_STRING = __webpack_require__(52).version;
var _DEFAULT_DELIMITER = '%';
var _DEFAULT_LOCALS_NAME = 'locals';
var _NAME = 'ejs';
var _REGEX_STRING = '(<%%|%%>|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)';
var _OPTS = ['delimiter', 'scope', 'context', 'debug', 'compileDebug', 'client', '_with', 'rmWhitespace', 'strict', 'filename'];
// We don't allow 'cache' option to be passed in the data obj
// for the normal `render` call, but this is where Express puts it
// so we make an exception for `renderFile`
var _OPTS_EXPRESS = _OPTS.concat('cache');
var _BOM = /^\uFEFF/;

/**
 * EJS template function cache. This can be a LRU object from lru-cache NPM
 * module. By default, it is {@link module:utils.cache}, a simple in-process
 * cache that grows continuously.
 *
 * @type {Cache}
 */

exports.cache = utils.cache;

/**
 * Custom file loader. Useful for template preprocessing or restricting access
 * to a certain part of the filesystem.
 *
 * @type {fileLoader}
 */

exports.fileLoader = fs.readFileSync;

/**
 * Name of the object containing the locals.
 *
 * This variable is overridden by {@link Options}`.localsName` if it is not
 * `undefined`.
 *
 * @type {String}
 * @public
 */

exports.localsName = _DEFAULT_LOCALS_NAME;

/**
 * Get the path to the included file from the parent file path and the
 * specified path.
 *
 * @param {String}  name     specified path
 * @param {String}  filename parent file path
 * @param {Boolean} isDir    parent file path whether is directory
 * @return {String}
 */
exports.resolveInclude = function (name, filename, isDir) {
  var dirname = path.dirname;
  var extname = path.extname;
  var resolve = path.resolve;
  var includePath = resolve(isDir ? filename : dirname(filename), name);
  var ext = extname(name);
  if (!ext) {
    includePath += '.ejs';
  }
  return includePath;
};

/**
 * Get the path to the included file by Options
 *
 * @param  {String}  path    specified path
 * @param  {Options} options compilation options
 * @return {String}
 */
function getIncludePath(path, options) {
  var includePath;
  if (path.charAt(0) == '/') {
    includePath = exports.resolveInclude(path.replace(/^\/*/, ''), options.root || '/', true);
  } else {
    if (!options.filename) {
      throw new Error('`include` use relative path requires the \'filename\' option.');
    }
    includePath = exports.resolveInclude(path, options.filename);
  }
  return includePath;
}

/**
 * Get the template from a string or a file, either compiled on-the-fly or
 * read from cache (if enabled), and cache the template if needed.
 *
 * If `template` is not set, the file specified in `options.filename` will be
 * read.
 *
 * If `options.cache` is true, this function reads the file from
 * `options.filename` so it must be set prior to calling this function.
 *
 * @memberof module:ejs-internal
 * @param {Options} options   compilation options
 * @param {String} [template] template source
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `options.client`, either type might be returned.
 * @static
 */

function handleCache(options, template) {
  var func;
  var filename = options.filename;
  var hasTemplate = arguments.length > 1;

  if (options.cache) {
    if (!filename) {
      throw new Error('cache option requires a filename');
    }
    func = exports.cache.get(filename);
    if (func) {
      return func;
    }
    if (!hasTemplate) {
      template = fileLoader(filename).toString().replace(_BOM, '');
    }
  } else if (!hasTemplate) {
    // istanbul ignore if: should not happen at all
    if (!filename) {
      throw new Error('Internal EJS error: no file name or template ' + 'provided');
    }
    template = fileLoader(filename).toString().replace(_BOM, '');
  }
  func = exports.compile(template, options);
  if (options.cache) {
    exports.cache.set(filename, func);
  }
  return func;
}

/**
 * Try calling handleCache with the given options and data and call the
 * callback with the result. If an error occurs, call the callback with
 * the error. Used by renderFile().
 *
 * @memberof module:ejs-internal
 * @param {Options} options    compilation options
 * @param {Object} data        template data
 * @param {RenderFileCallback} cb callback
 * @static
 */

function tryHandleCache(options, data, cb) {
  var result;
  try {
    result = handleCache(options)(data);
  } catch (err) {
    return cb(err);
  }
  return cb(null, result);
}

/**
 * fileLoader is independent
 *
 * @param {String} filePath ejs file path.
 * @return {String} The contents of the specified file.
 * @static
 */

function fileLoader(filePath) {
  return exports.fileLoader(filePath);
}

/**
 * Get the template function.
 *
 * If `options.cache` is `true`, then the template is cached.
 *
 * @memberof module:ejs-internal
 * @param {String}  path    path for the specified file
 * @param {Options} options compilation options
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `options.client`, either type might be returned
 * @static
 */

function includeFile(path, options) {
  var opts = utils.shallowCopy({}, options);
  opts.filename = getIncludePath(path, opts);
  return handleCache(opts);
}

/**
 * Get the JavaScript source of an included file.
 *
 * @memberof module:ejs-internal
 * @param {String}  path    path for the specified file
 * @param {Options} options compilation options
 * @return {Object}
 * @static
 */

function includeSource(path, options) {
  var opts = utils.shallowCopy({}, options);
  var includePath;
  var template;
  includePath = getIncludePath(path, opts);
  template = fileLoader(includePath).toString().replace(_BOM, '');
  opts.filename = includePath;
  var templ = new Template(template, opts);
  templ.generateSource();
  return {
    source: templ.source,
    filename: includePath,
    template: template
  };
}

/**
 * Re-throw the given `err` in context to the `str` of ejs, `filename`, and
 * `lineno`.
 *
 * @implements RethrowCallback
 * @memberof module:ejs-internal
 * @param {Error}  err      Error object
 * @param {String} str      EJS source
 * @param {String} filename file name of the EJS file
 * @param {String} lineno   line number of the error
 * @static
 */

function rethrow(err, str, flnm, lineno, esc) {
  var lines = str.split('\n');
  var start = Math.max(lineno - 3, 0);
  var end = Math.min(lines.length, lineno + 3);
  var filename = esc(flnm); // eslint-disable-line
  // Error context
  var context = lines.slice(start, end).map(function (line, i) {
    var curr = i + start + 1;
    return (curr == lineno ? ' >> ' : '    ') + curr + '| ' + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'ejs') + ':' + lineno + '\n' + context + '\n\n' + err.message;

  throw err;
}

function stripSemi(str) {
  return str.replace(/;(\s*$)/, '$1');
}

/**
 * Compile the given `str` of ejs into a template function.
 *
 * @param {String}  template EJS template
 *
 * @param {Options} opts     compilation options
 *
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `opts.client`, either type might be returned.
 * @public
 */

exports.compile = function compile(template, opts) {
  var templ;

  // v1 compat
  // 'scope' is 'context'
  // FIXME: Remove this in a future version
  if (opts && opts.scope) {
    if (!scopeOptionWarned) {
      console.warn('`scope` option is deprecated and will be removed in EJS 3');
      scopeOptionWarned = true;
    }
    if (!opts.context) {
      opts.context = opts.scope;
    }
    delete opts.scope;
  }
  templ = new Template(template, opts);
  return templ.compile();
};

/**
 * Render the given `template` of ejs.
 *
 * If you would like to include options but not data, you need to explicitly
 * call this function with `data` being an empty object or `null`.
 *
 * @param {String}   template EJS template
 * @param {Object}  [data={}] template data
 * @param {Options} [opts={}] compilation and rendering options
 * @return {String}
 * @public
 */

exports.render = function (template, d, o) {
  var data = d || {};
  var opts = o || {};

  // No options object -- if there are optiony names
  // in the data, copy them to options
  if (arguments.length == 2) {
    utils.shallowCopyFromList(opts, data, _OPTS);
  }

  return handleCache(opts, template)(data);
};

/**
 * Render an EJS file at the given `path` and callback `cb(err, str)`.
 *
 * If you would like to include options but not data, you need to explicitly
 * call this function with `data` being an empty object or `null`.
 *
 * @param {String}             path     path to the EJS file
 * @param {Object}            [data={}] template data
 * @param {Options}           [opts={}] compilation and rendering options
 * @param {RenderFileCallback} cb callback
 * @public
 */

exports.renderFile = function () {
  var filename = arguments[0];
  var cb = arguments[arguments.length - 1];
  var opts = { filename: filename };
  var data;

  if (arguments.length > 2) {
    data = arguments[1];

    // No options object -- if there are optiony names
    // in the data, copy them to options
    if (arguments.length === 3) {
      // Express 4
      if (data.settings && data.settings['view options']) {
        utils.shallowCopyFromList(opts, data.settings['view options'], _OPTS_EXPRESS);
      }
      // Express 3 and lower
      else {
          utils.shallowCopyFromList(opts, data, _OPTS_EXPRESS);
        }
    } else {
      // Use shallowCopy so we don't pollute passed in opts obj with new vals
      utils.shallowCopy(opts, arguments[2]);
    }

    opts.filename = filename;
  } else {
    data = {};
  }

  return tryHandleCache(opts, data, cb);
};

/**
 * Clear intermediate JavaScript cache. Calls {@link Cache#reset}.
 * @public
 */

exports.clearCache = function () {
  exports.cache.reset();
};

function Template(text, opts) {
  opts = opts || {};
  var options = {};
  this.templateText = text;
  this.mode = null;
  this.truncate = false;
  this.currentLine = 1;
  this.source = '';
  this.dependencies = [];
  options.client = opts.client || false;
  options.escapeFunction = opts.escape || utils.escapeXML;
  options.compileDebug = opts.compileDebug !== false;
  options.debug = !!opts.debug;
  options.filename = opts.filename;
  options.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
  options.strict = opts.strict || false;
  options.context = opts.context;
  options.cache = opts.cache || false;
  options.rmWhitespace = opts.rmWhitespace;
  options.root = opts.root;
  options.localsName = opts.localsName || exports.localsName || _DEFAULT_LOCALS_NAME;

  if (options.strict) {
    options._with = false;
  } else {
    options._with = typeof opts._with != 'undefined' ? opts._with : true;
  }

  this.opts = options;

  this.regex = this.createRegex();
}

Template.modes = {
  EVAL: 'eval',
  ESCAPED: 'escaped',
  RAW: 'raw',
  COMMENT: 'comment',
  LITERAL: 'literal'
};

Template.prototype = {
  createRegex: function createRegex() {
    var str = _REGEX_STRING;
    var delim = utils.escapeRegExpChars(this.opts.delimiter);
    str = str.replace(/%/g, delim);
    return new RegExp(str);
  },

  compile: function compile() {
    var src;
    var fn;
    var opts = this.opts;
    var prepended = '';
    var appended = '';
    var escapeFn = opts.escapeFunction;

    if (!this.source) {
      this.generateSource();
      prepended += '  var __output = [], __append = __output.push.bind(__output);' + '\n';
      if (opts._with !== false) {
        prepended += '  with (' + opts.localsName + ' || {}) {' + '\n';
        appended += '  }' + '\n';
      }
      appended += '  return __output.join("");' + '\n';
      this.source = prepended + this.source + appended;
    }

    if (opts.compileDebug) {
      src = 'var __line = 1' + '\n' + '  , __lines = ' + JSON.stringify(this.templateText) + '\n' + '  , __filename = ' + (opts.filename ? JSON.stringify(opts.filename) : 'undefined') + ';' + '\n' + 'try {' + '\n' + this.source + '} catch (e) {' + '\n' + '  rethrow(e, __lines, __filename, __line, escapeFn);' + '\n' + '}' + '\n';
    } else {
      src = this.source;
    }

    if (opts.debug) {
      console.log(src);
    }

    if (opts.client) {
      src = 'escapeFn = escapeFn || ' + escapeFn.toString() + ';' + '\n' + src;
      if (opts.compileDebug) {
        src = 'rethrow = rethrow || ' + rethrow.toString() + ';' + '\n' + src;
      }
    }

    if (opts.strict) {
      src = '"use strict";\n' + src;
    }

    try {
      fn = new Function(opts.localsName + ', escapeFn, include, rethrow', src);
    } catch (e) {
      // istanbul ignore else
      if (e instanceof SyntaxError) {
        if (opts.filename) {
          e.message += ' in ' + opts.filename;
        }
        e.message += ' while compiling ejs\n\n';
        e.message += 'If the above error is not helpful, you may want to try EJS-Lint:\n';
        e.message += 'https://github.com/RyanZim/EJS-Lint';
      }
      throw e;
    }

    if (opts.client) {
      fn.dependencies = this.dependencies;
      return fn;
    }

    // Return a callable function which will execute the function
    // created by the source-code, with the passed data as locals
    // Adds a local `include` function which allows full recursive include
    var returnedFn = function returnedFn(data) {
      var include = function include(path, includeData) {
        var d = utils.shallowCopy({}, data);
        if (includeData) {
          d = utils.shallowCopy(d, includeData);
        }
        return includeFile(path, opts)(d);
      };
      return fn.apply(opts.context, [data || {}, escapeFn, include, rethrow]);
    };
    returnedFn.dependencies = this.dependencies;
    return returnedFn;
  },

  generateSource: function generateSource() {
    var opts = this.opts;

    if (opts.rmWhitespace) {
      // Have to use two separate replace here as `^` and `$` operators don't
      // work well with `\r`.
      this.templateText = this.templateText.replace(/\r/g, '').replace(/^\s+|\s+$/gm, '');
    }

    // Slurp spaces and tabs before <%_ and after _%>
    this.templateText = this.templateText.replace(/[ \t]*<%_/gm, '<%_').replace(/_%>[ \t]*/gm, '_%>');

    var self = this;
    var matches = this.parseTemplateText();
    var d = this.opts.delimiter;

    if (matches && matches.length) {
      matches.forEach(function (line, index) {
        var opening;
        var closing;
        var include;
        var includeOpts;
        var includeObj;
        var includeSrc;
        // If this is an opening tag, check for closing tags
        // FIXME: May end up with some false positives here
        // Better to store modes as k/v with '<' + delimiter as key
        // Then this can simply check against the map
        if (line.indexOf('<' + d) === 0 // If it is a tag
        && line.indexOf('<' + d + d) !== 0) {
          // and is not escaped
          closing = matches[index + 2];
          if (!(closing == d + '>' || closing == '-' + d + '>' || closing == '_' + d + '>')) {
            throw new Error('Could not find matching close tag for "' + line + '".');
          }
        }
        // HACK: backward-compat `include` preprocessor directives
        if (include = line.match(/^\s*include\s+(\S+)/)) {
          opening = matches[index - 1];
          // Must be in EVAL or RAW mode
          if (opening && (opening == '<' + d || opening == '<' + d + '-' || opening == '<' + d + '_')) {
            includeOpts = utils.shallowCopy({}, self.opts);
            includeObj = includeSource(include[1], includeOpts);
            if (self.opts.compileDebug) {
              includeSrc = '    ; (function(){' + '\n' + '      var __line = 1' + '\n' + '      , __lines = ' + JSON.stringify(includeObj.template) + '\n' + '      , __filename = ' + JSON.stringify(includeObj.filename) + ';' + '\n' + '      try {' + '\n' + includeObj.source + '      } catch (e) {' + '\n' + '        rethrow(e, __lines, __filename, __line);' + '\n' + '      }' + '\n' + '    ; }).call(this)' + '\n';
            } else {
              includeSrc = '    ; (function(){' + '\n' + includeObj.source + '    ; }).call(this)' + '\n';
            }
            self.source += includeSrc;
            self.dependencies.push(exports.resolveInclude(include[1], includeOpts.filename));
            return;
          }
        }
        self.scanLine(line);
      });
    }
  },

  parseTemplateText: function parseTemplateText() {
    var str = this.templateText;
    var pat = this.regex;
    var result = pat.exec(str);
    var arr = [];
    var firstPos;

    while (result) {
      firstPos = result.index;

      if (firstPos !== 0) {
        arr.push(str.substring(0, firstPos));
        str = str.slice(firstPos);
      }

      arr.push(result[0]);
      str = str.slice(result[0].length);
      result = pat.exec(str);
    }

    if (str) {
      arr.push(str);
    }

    return arr;
  },

  scanLine: function scanLine(line) {
    var self = this;
    var d = this.opts.delimiter;
    var newLineCount = 0;

    function _addOutput() {
      if (self.truncate) {
        // Only replace single leading linebreak in the line after
        // -%> tag -- this is the single, trailing linebreak
        // after the tag that the truncation mode replaces
        // Handle Win / Unix / old Mac linebreaks -- do the \r\n
        // combo first in the regex-or
        line = line.replace(/^(?:\r\n|\r|\n)/, '');
        self.truncate = false;
      } else if (self.opts.rmWhitespace) {
        // rmWhitespace has already removed trailing spaces, just need
        // to remove linebreaks
        line = line.replace(/^\n/, '');
      }
      if (!line) {
        return;
      }

      // Preserve literal slashes
      line = line.replace(/\\/g, '\\\\');

      // Convert linebreaks
      line = line.replace(/\n/g, '\\n');
      line = line.replace(/\r/g, '\\r');

      // Escape double-quotes
      // - this will be the delimiter during execution
      line = line.replace(/"/g, '\\"');
      self.source += '    ; __append("' + line + '")' + '\n';
    }

    newLineCount = line.split('\n').length - 1;

    switch (line) {
      case '<' + d:
      case '<' + d + '_':
        this.mode = Template.modes.EVAL;
        break;
      case '<' + d + '=':
        this.mode = Template.modes.ESCAPED;
        break;
      case '<' + d + '-':
        this.mode = Template.modes.RAW;
        break;
      case '<' + d + '#':
        this.mode = Template.modes.COMMENT;
        break;
      case '<' + d + d:
        this.mode = Template.modes.LITERAL;
        this.source += '    ; __append("' + line.replace('<' + d + d, '<' + d) + '")' + '\n';
        break;
      case d + d + '>':
        this.mode = Template.modes.LITERAL;
        this.source += '    ; __append("' + line.replace(d + d + '>', d + '>') + '")' + '\n';
        break;
      case d + '>':
      case '-' + d + '>':
      case '_' + d + '>':
        if (this.mode == Template.modes.LITERAL) {
          _addOutput();
        }

        this.mode = null;
        this.truncate = line.indexOf('-') === 0 || line.indexOf('_') === 0;
        break;
      default:
        // In script mode, depends on type of tag
        if (this.mode) {
          // If '//' is found without a line break, add a line break.
          switch (this.mode) {
            case Template.modes.EVAL:
            case Template.modes.ESCAPED:
            case Template.modes.RAW:
              if (line.lastIndexOf('//') > line.lastIndexOf('\n')) {
                line += '\n';
              }
          }
          switch (this.mode) {
            // Just executing code
            case Template.modes.EVAL:
              this.source += '    ; ' + line + '\n';
              break;
            // Exec, esc, and output
            case Template.modes.ESCAPED:
              this.source += '    ; __append(escapeFn(' + stripSemi(line) + '))' + '\n';
              break;
            // Exec and output
            case Template.modes.RAW:
              this.source += '    ; __append(' + stripSemi(line) + ')' + '\n';
              break;
            case Template.modes.COMMENT:
              // Do nothing
              break;
            // Literal <%% mode, append as raw output
            case Template.modes.LITERAL:
              _addOutput();
              break;
          }
        }
        // In string mode, just add the output
        else {
            _addOutput();
          }
    }

    if (self.opts.compileDebug && newLineCount) {
      this.currentLine += newLineCount;
      this.source += '    ; __line = ' + this.currentLine + '\n';
    }
  }
};

/**
 * Escape characters reserved in XML.
 *
 * This is simply an export of {@link module:utils.escapeXML}.
 *
 * If `markup` is `undefined` or `null`, the empty string is returned.
 *
 * @param {String} markup Input string
 * @return {String} Escaped string
 * @public
 * @func
 * */
exports.escapeXML = utils.escapeXML;

/**
 * Express.js support.
 *
 * This is an alias for {@link module:ejs.renderFile}, in order to support
 * Express.js out-of-the-box.
 *
 * @func
 */

exports.__express = exports.renderFile;

// Add require support
/* istanbul ignore else */
if ((void 0)) {
  (void 0)['.ejs'] = function (module, flnm) {
    var filename = flnm || /* istanbul ignore next */module.filename;
    var options = {
      filename: filename,
      client: true
    };
    var template = fileLoader(filename).toString();
    var fn = exports.compile(template, options);
    module._compile('module.exports = ' + fn.toString() + ';', filename);
  };
}

/**
 * Version of EJS.
 *
 * @readonly
 * @type {String}
 * @public
 */

exports.VERSION = _VERSION_STRING;

/**
 * Name for detection of EJS.
 *
 * @readonly
 * @type {String}
 * @public
 */

exports.name = _NAME;

/* istanbul ignore if */
if (typeof window != 'undefined') {
  window.ejs = exports;
}

/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
 * EJS Embedded JavaScript templates
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

/**
 * Private utility functions
 * @module utils
 * @private
 */



var regExpChars = /[|\\{}()[\]^$+*?.]/g;

/**
 * Escape characters reserved in regular expressions.
 *
 * If `string` is `undefined` or `null`, the empty string is returned.
 *
 * @param {String} string Input string
 * @return {String} Escaped string
 * @static
 * @private
 */
exports.escapeRegExpChars = function (string) {
  // istanbul ignore if
  if (!string) {
    return '';
  }
  return String(string).replace(regExpChars, '\\$&');
};

var _ENCODE_HTML_RULES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&#34;',
  "'": '&#39;'
};
var _MATCH_HTML = /[&<>\'"]/g;

function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
}

/**
 * Stringified version of constants used by {@link module:utils.escapeXML}.
 *
 * It is used in the process of generating {@link ClientFunction}s.
 *
 * @readonly
 * @type {String}
 */

var escapeFuncStr = 'var _ENCODE_HTML_RULES = {\n' + '      "&": "&amp;"\n' + '    , "<": "&lt;"\n' + '    , ">": "&gt;"\n' + '    , \'"\': "&#34;"\n' + '    , "\'": "&#39;"\n' + '    }\n' + '  , _MATCH_HTML = /[&<>\'"]/g;\n' + 'function encode_char(c) {\n' + '  return _ENCODE_HTML_RULES[c] || c;\n' + '};\n';

/**
 * Escape characters reserved in XML.
 *
 * If `markup` is `undefined` or `null`, the empty string is returned.
 *
 * @implements {EscapeCallback}
 * @param {String} markup Input string
 * @return {String} Escaped string
 * @static
 * @private
 */

exports.escapeXML = function (markup) {
  return markup == undefined ? '' : String(markup).replace(_MATCH_HTML, encode_char);
};
exports.escapeXML.toString = function () {
  return Function.prototype.toString.call(this) + ';\n' + escapeFuncStr;
};

/**
 * Naive copy of properties from one object to another.
 * Does not recurse into non-scalar properties
 * Does not check to see if the property has a value before copying
 *
 * @param  {Object} to   Destination object
 * @param  {Object} from Source object
 * @return {Object}      Destination object
 * @static
 * @private
 */
exports.shallowCopy = function (to, from) {
  from = from || {};
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
};

/**
 * Naive copy of a list of key names, from one object to another.
 * Only copies property if it is actually defined
 * Does not recurse into non-scalar properties
 *
 * @param  {Object} to   Destination object
 * @param  {Object} from Source object
 * @param  {Array} list List of properties to copy
 * @return {Object}      Destination object
 * @static
 * @private
 */
exports.shallowCopyFromList = function (to, from, list) {
  for (var i = 0; i < list.length; i++) {
    var p = list[i];
    if (typeof from[p] != 'undefined') {
      to[p] = from[p];
    }
  }
  return to;
};

/**
 * Simple in-process cache implementation. Does not implement limits of any
 * sort.
 *
 * @implements Cache
 * @static
 * @private
 */
exports.cache = {
  _data: {},
  set: function set(key, val) {
    this._data[key] = val;
  },
  get: function get(key) {
    return this._data[key];
  },
  reset: function reset() {
    this._data = {};
  }
};

/***/ }),
/* 52 */
/***/ (function(module, exports) {

module.exports = {
	"_from": "ejs@^2.5.6",
	"_id": "ejs@2.5.6",
	"_inBundle": false,
	"_integrity": "sha1-R5Y2v6P+Ox3r1SCH8KyyBLTxnIg=",
	"_location": "/ejs",
	"_phantomChildren": {},
	"_requested": {
		"type": "range",
		"registry": true,
		"raw": "ejs@^2.5.6",
		"name": "ejs",
		"escapedName": "ejs",
		"rawSpec": "^2.5.6",
		"saveSpec": null,
		"fetchSpec": "^2.5.6"
	},
	"_requiredBy": [
		"/"
	],
	"_resolved": "https://registry.npmjs.org/ejs/-/ejs-2.5.6.tgz",
	"_shasum": "479636bfa3fe3b1debd52087f0acb204b4f19c88",
	"_spec": "ejs@^2.5.6",
	"_where": "C:\\Users\\OlgaKozlova\\MyProjects\\react-redux-cli",
	"author": {
		"name": "Matthew Eernisse",
		"email": "mde@fleegix.org",
		"url": "http://fleegix.org"
	},
	"bugs": {
		"url": "https://github.com/mde/ejs/issues"
	},
	"bundleDependencies": false,
	"contributors": [
		{
			"name": "Timothy Gu",
			"email": "timothygu99@gmail.com",
			"url": "https://timothygu.github.io"
		}
	],
	"dependencies": {},
	"deprecated": false,
	"description": "Embedded JavaScript templates",
	"devDependencies": {
		"browserify": "^13.0.1",
		"eslint": "^3.0.0",
		"git-directory-deploy": "^1.5.1",
		"istanbul": "~0.4.3",
		"jake": "^8.0.0",
		"jsdoc": "^3.4.0",
		"lru-cache": "^4.0.1",
		"mocha": "^3.0.2",
		"uglify-js": "^2.6.2"
	},
	"engines": {
		"node": ">=0.10.0"
	},
	"homepage": "https://github.com/mde/ejs",
	"keywords": [
		"template",
		"engine",
		"ejs"
	],
	"license": "Apache-2.0",
	"main": "./lib/ejs.js",
	"name": "ejs",
	"repository": {
		"type": "git",
		"url": "git://github.com/mde/ejs.git"
	},
	"scripts": {
		"coverage": "istanbul cover node_modules/mocha/bin/_mocha",
		"devdoc": "jake doc[dev]",
		"doc": "jake doc",
		"lint": "eslint \"**/*.js\" Jakefile",
		"test": "mocha"
	},
	"version": "2.5.6"
};

/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.snakify = exports.camelize = exports.decapitalize = exports.capitalize = undefined;

var _humps = __webpack_require__(54);

var capitalize = exports.capitalize = function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

var decapitalize = exports.decapitalize = function decapitalize(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
};

var camelize = exports.camelize = function camelize(string) {
    return (0, _humps.camelize)(string);
};

var snakify = exports.snakify = function snakify(string) {
    return (0, _humps.depascalize)((0, _humps.pascalize)(string)).toUpperCase();
};

/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;

// =========
// = humps =
// =========
// Underscore-to-camelCase converter (and vice versa)
// for strings and object keys

// humps is copyright © 2012+ Dom Christie
// Released under the MIT license.


;(function (global) {

  var _processKeys = function _processKeys(convert, obj, options) {
    if (!_isObject(obj) || _isDate(obj) || _isRegExp(obj) || _isBoolean(obj) || _isFunction(obj)) {
      return obj;
    }

    var output,
        i = 0,
        l = 0;

    if (_isArray(obj)) {
      output = [];
      for (l = obj.length; i < l; i++) {
        output.push(_processKeys(convert, obj[i], options));
      }
    } else {
      output = {};
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          output[convert(key, options)] = _processKeys(convert, obj[key], options);
        }
      }
    }
    return output;
  };

  // String conversion methods

  var separateWords = function separateWords(string, options) {
    options = options || {};
    var separator = options.separator || '_';
    var split = options.split || /(?=[A-Z])/;

    return string.split(split).join(separator);
  };

  var camelize = function camelize(string) {
    if (_isNumerical(string)) {
      return string;
    }
    string = string.replace(/[\-_\s]+(.)?/g, function (match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
    // Ensure 1st char is always lowercase
    return string.substr(0, 1).toLowerCase() + string.substr(1);
  };

  var pascalize = function pascalize(string) {
    var camelized = camelize(string);
    // Ensure 1st char is always uppercase
    return camelized.substr(0, 1).toUpperCase() + camelized.substr(1);
  };

  var decamelize = function decamelize(string, options) {
    return separateWords(string, options).toLowerCase();
  };

  // Utilities
  // Taken from Underscore.js

  var toString = Object.prototype.toString;

  var _isFunction = function _isFunction(obj) {
    return typeof obj === 'function';
  };
  var _isObject = function _isObject(obj) {
    return obj === Object(obj);
  };
  var _isArray = function _isArray(obj) {
    return toString.call(obj) == '[object Array]';
  };
  var _isDate = function _isDate(obj) {
    return toString.call(obj) == '[object Date]';
  };
  var _isRegExp = function _isRegExp(obj) {
    return toString.call(obj) == '[object RegExp]';
  };
  var _isBoolean = function _isBoolean(obj) {
    return toString.call(obj) == '[object Boolean]';
  };

  // Performant way to determine if obj coerces to a number
  var _isNumerical = function _isNumerical(obj) {
    obj = obj - 0;
    return obj === obj;
  };

  // Sets up function which handles processing keys
  // allowing the convert function to be modified by a callback
  var _processor = function _processor(convert, options) {
    var callback = options && 'process' in options ? options.process : options;

    if (typeof callback !== 'function') {
      return convert;
    }

    return function (string, options) {
      return callback(string, convert, options);
    };
  };

  var humps = {
    camelize: camelize,
    decamelize: decamelize,
    pascalize: pascalize,
    depascalize: decamelize,
    camelizeKeys: function camelizeKeys(object, options) {
      return _processKeys(_processor(camelize, options), object);
    },
    decamelizeKeys: function decamelizeKeys(object, options) {
      return _processKeys(_processor(decamelize, options), object, options);
    },
    pascalizeKeys: function pascalizeKeys(object, options) {
      return _processKeys(_processor(pascalize, options), object);
    },
    depascalizeKeys: function depascalizeKeys() {
      return this.decamelizeKeys.apply(this, arguments);
    }
  };

  if (true) {
    !(__WEBPACK_AMD_DEFINE_FACTORY__ = (humps),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) :
				__WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = humps;
  } else {
    global.humps = humps;
  }
})(undefined);

/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (parameters, options, conf) {
    var errors = [checkMinParams.bind(null, parameters), checkMaxParams.bind(null, parameters), checkTemplatesExistency.bind(null, parameters, options, conf)].reduce(function (result, current) {
        return result.concat(current());
    }, []);

    if (errors.length > 0) {
        return getErrorResult(errors);
    }

    return getValidResult();
};

var _fsExtra = __webpack_require__(8);

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = __webpack_require__(0);

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getErrorResult = function getErrorResult(errors) {
    return {
        isValid: false,
        errors: errors
    };
};

var getValidResult = function getValidResult() {
    return {
        isValid: true,
        errors: []
    };
};

function checkMinParams(parameters) {
    return parameters.length > 2 ? ['Maximum 2 parameters expected'] : [];
}

function checkMaxParams(parameters) {
    return parameters.length < 1 ? ['Maximum 2 parameters expected'] : [];
}

function checkTemplatesExistency(parameters, options, conf) {
    var bundle = conf.bundles[parameters[0]];

    return Object.keys(bundle).filter(function (set) {
        return set.templateType === 'file' && (!_fsExtra2.default.pathExistsSync(_path2.default.join(conf.templates, set.template)) || !_fsExtra2.default.pathExistsSync(_path2.default.join(conf.defaultTemplates, set.template)));
    }).map(function (set) {
        return 'Invalid filepath found in configuration: ' + set.sourceFileName;
    });
}

/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _executor = __webpack_require__(57);

var _executor2 = _interopRequireDefault(_executor);

var _validator = __webpack_require__(58);

var _validator2 = _interopRequireDefault(_validator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
    executor: _executor2.default,
    validator: _validator2.default
};

/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  console.log('Not supported yet');
};

/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function () {
    return { isValid: true, error: null };
};

/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stateFulView = __webpack_require__(60);

var _stateFulView2 = _interopRequireDefault(_stateFulView);

var _stateFulViewInFolder = __webpack_require__(61);

var _stateFulViewInFolder2 = _interopRequireDefault(_stateFulViewInFolder);

var _stateLessView = __webpack_require__(62);

var _stateLessView2 = _interopRequireDefault(_stateLessView);

var _stateLessViewInFolder = __webpack_require__(63);

var _stateLessViewInFolder2 = _interopRequireDefault(_stateLessViewInFolder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
    stateFulViewInFolder: _stateFulViewInFolder2.default,
    stateFulView: _stateFulView2.default,
    stateLessViewInFolder: _stateLessViewInFolder2.default,
    stateLessView: _stateLessView2.default
};

/***/ }),
/* 60 */
/***/ (function(module, exports) {

module.exports = {
	"constants": {
		"templateType": "file",
		"template": "constants.ejs",
		"destination": "<%= root %>/constants/<%= t.capitalize(featureName) %>Constants.js",
		"action": "create"
	},
	"actions": {
		"templateType": "file",
		"template": "actions.ejs",
		"destination": "<%= root %>/actions/<%= t.capitalize(featureName) %>Actions.js",
		"action": "create"
	},
	"actionsIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %>Actions } from './<%= t.capitalize(featureName) %>Actions.js';\n",
		"destination": "<%= root %>/actions/index.js",
		"action": "appendBottom"
	},
	"initialState": {
		"templateType": "file",
		"template": "initial.ejs",
		"destination": "<%= root %>/initials/<%= t.capitalize(featureName) %>Initial.js",
		"action": "create"
	},
	"initialStateIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %>InitialState } from './<%= t.capitalize(featureName) %>Initial.js';\n",
		"destination": "<%= root %>/initials/index.js",
		"action": "appendBottom"
	},
	"reducer": {
		"templateType": "file",
		"template": "./src/templates/reducer.ejs",
		"destination": "<%= root %>/reducers/<%= t.capitalize(featureName) %>Reducer.js",
		"action": "create"
	},
	"reducerIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %>Reducer } from './<%= t.capitalize(featureName) %>Reducer.js';\n",
		"destination": "<%= root %>/reducers/index.js",
		"action": "appendBottom"
	},
	"selector": {
		"templateType": "file",
		"template": "selectors.ejs",
		"destination": "<%= root %>/selectors/<%= t.capitalize(featureName) %>Selectors.js",
		"action": "create"
	},
	"view": {
		"templateType": "file",
		"template": "view.ejs",
		"destination": "<%= root %>/views/<%= t.capitalize(featureName) %>.jsx",
		"action": "create"
	},
	"viewIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %> } from './<%= t.capitalize(featureName) %>.jsx';\n",
		"destination": "<%= root %>/views/index.js",
		"action": "appendBottom"
	}
};

/***/ }),
/* 61 */
/***/ (function(module, exports) {

module.exports = {
	"constants": {
		"templateType": "file",
		"template": "constants.ejs",
		"destination": "<%= root %>/<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>Constants.js",
		"action": "create"
	},
	"actions": {
		"templateType": "file",
		"template": "actionsInFolder.ejs",
		"destination": "<%= root %>/<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>Actions.js",
		"action": "create"
	},
	"actionsIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %>Actions } from './<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>Actions.js';\n",
		"destination": "<%= root %>/actions.js",
		"action": "appendBottom"
	},
	"initialState": {
		"templateType": "file",
		"template": "initial.ejs",
		"destination": "<%= root %>/<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>Initial.js",
		"action": "create"
	},
	"initialStateIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %>InitialState } from './<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>Initial.js';\n",
		"destination": "<%= root %>/initials.js",
		"action": "appendBottom"
	},
	"reducer": {
		"templateType": "file",
		"template": "reducerInFolder.ejs",
		"destination": "<%= root %>/<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>Reducer.js",
		"action": "create"
	},
	"reducerIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %>Reducer } from './<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>Reducer.js';\n",
		"destination": "<%= root %>/reducers.js",
		"action": "appendBottom"
	},
	"selector": {
		"templateType": "file",
		"template": "selectors.ejs",
		"destination": "<%= root %>/<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>Selectors.js",
		"action": "create"
	},
	"view": {
		"templateType": "file",
		"template": "viewInFolder.ejs",
		"destination": "<%= root %>/<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>.jsx",
		"action": "create"
	},
	"viewIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %> } from './<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>.jsx';\n",
		"destination": "<%= root %>/views.js",
		"action": "appendBottom"
	}
};

/***/ }),
/* 62 */
/***/ (function(module, exports) {

module.exports = {
	"constants": {
		"templateType": "file",
		"template": "constants.ejs",
		"destination": "<%= root %>/constants/<%= t.capitalize(featureName) %>Constants.js",
		"action": "create"
	},
	"actions": {
		"templateType": "file",
		"template": "actions.ejs",
		"destination": "<%= root %>/actions/<%= t.capitalize(featureName) %>Actions.js",
		"action": "create"
	},
	"actionsIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %>Actions } from './<%= t.capitalize(featureName) %>Actions.js';\n",
		"destination": "<%= root %>/actions/index.js",
		"action": "appendBottom"
	},
	"initialState": {
		"templateType": "file",
		"template": "initial.ejs",
		"destination": "<%= root %>/initials/<%= t.capitalize(featureName) %>Initial.js",
		"action": "create"
	},
	"initialStateIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %>InitialState } from './<%= t.capitalize(featureName) %>Initial.js';\n",
		"destination": "<%= root %>/initials/index.js",
		"action": "appendBottom"
	},
	"reducer": {
		"templateType": "file",
		"template": "reducer.ejs",
		"destination": "<%= root %>/reducers/<%= t.capitalize(featureName) %>Reducer.js",
		"action": "create"
	},
	"reducerIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %>Reducer } from './<%= t.capitalize(featureName) %>Reducer.js';\n",
		"destination": "<%= root %>/reducers/index.js",
		"action": "appendBottom"
	},
	"selector": {
		"templateType": "file",
		"template": "selectors.ejs",
		"destination": "<%= root %>/selectors/<%= t.capitalize(featureName) %>Selectors.js",
		"action": "create"
	},
	"view": {
		"templateType": "file",
		"template": "view.ejs",
		"destination": "<%= root %>/views/<%= t.capitalize(featureName) %>.jsx",
		"action": "create"
	},
	"viewIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %> } from './<%= t.capitalize(featureName) %>.jsx';\n",
		"destination": "<%= root %>/views/index.js",
		"action": "appendBottom"
	}
};

/***/ }),
/* 63 */
/***/ (function(module, exports) {

module.exports = {
	"constants": {
		"templateType": "file",
		"template": "constants.ejs",
		"destination": "<%= root %>/<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>Constants.js",
		"action": "create"
	},
	"actions": {
		"templateType": "file",
		"template": "actionsInFolder.ejs",
		"destination": "<%= root %>/<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>Actions.js",
		"action": "create"
	},
	"actionsIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %>Actions } from './<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>Actions.js';\n",
		"destination": "<%= root %>/actions.js",
		"action": "appendBottom"
	},
	"selector": {
		"templateType": "file",
		"template": "selectors.ejs",
		"destination": "<%= root %>/<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>Selectors.js",
		"action": "create"
	},
	"view": {
		"templateType": "file",
		"template": "viewInFolder.ejs",
		"destination": "<%= root %>/<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>.jsx",
		"action": "create"
	},
	"viewIndex": {
		"templateType": "string",
		"template": "export { <%= featureName %> } from './<%= t.capitalize(featureName) %>/<%= t.capitalize(featureName) %>.jsx';\n",
		"destination": "<%= root %>/views.js",
		"action": "appendBottom"
	}
};

/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var bundles = __webpack_require__(65).default;

module.exports = {
    root: './MyRoot',
    templates: './myTemplates',
    bundles: bundles
};

/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stateFulView = __webpack_require__(66);

var _stateFulView2 = _interopRequireDefault(_stateFulView);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
    view: _stateFulView2.default
};

/***/ }),
/* 66 */
/***/ (function(module, exports) {

module.exports = {
	"constants": {
		"templateType": "file",
		"template": "constants.ejs",
		"destination": "<%= root %>/constants/<%= t.capitalize(featureName) %>Constants.js",
		"action": "create"
	}
};

/***/ })
/******/ ]);