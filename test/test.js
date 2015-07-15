'use strict';

var lic = process.argv[2], file = process.argv[3];
var fs = require('fs');
var index = require('../index');
var str = fs.readFileSync(file).toString();
index.test(lic, str);
