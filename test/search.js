'use strict';

var search = require('../search');
var PATH = require('path');
console.log(search(PATH.resolve(__dirname, process.argv[2])));
