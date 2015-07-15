'use strict';

var fs = require('fs'),
    PATH = require('path');

var search = require('../search');

var baseDir = PATH.resolve(__dirname, 'node_modules');

var dirs = fs.readdirSync(baseDir);

dirs.filter(function (dir) {
    return !/^\./.test(dir);
}).forEach(function (dir) {
    var searchDir = PATH.resolve(baseDir, dir);
    var licenses = search(searchDir);
    /*getPackageJsonLicenses(searchDir)
        .concat(search(searchDir));*/
    
    if (!licenses.length) {
        console.log(searchDir);
    }
});

function getPackageJsonLicenses(searchDir) {
    var pjson = { }, licenses = [ ];
    var source = PATH.resolve(searchDir, 'package.json');
    try {
        pjson = require(source);
    } catch (e) {
    }
    
    if (pjson.license) {
        licenses = licenses.concat(getLicenses(pjson.license));
    }
    if (pjson.licenses) {
        licenses = licenses.concat(getLicenses(pjson.licenses));
    }
    return licenses.map(function (id) {
        return {
            source: source,
            identifier: id
        };
    });
}
function getLicenses(data) {
    if (!data) { return [ ]; }
    if (Array.isArray(data)) {
        return data.map(getLicenses);
    }
    if (typeof data === 'string') { return [data]; }
    if (data.type) { return [data.type]; }
    return [ ];
}
