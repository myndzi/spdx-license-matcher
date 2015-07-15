'use strict';

var file = process.argv[2];
var fs = require('fs');
var normalize = require('../normalize');
var str = fs.readFileSync(file).toString();
str = normalize.trimStartAndEnd(str);
str = normalize(str);
//console.log(str);
