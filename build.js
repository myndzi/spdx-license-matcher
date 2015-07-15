'use strict';

// http://spdx.org/spdx-license-list/matching-guidelines

var fs = require('fs'),
    PATH = require('path'),
    assert = require('assert'),
    format = require('util').format;

var normalize = require('./normalize');

var XLSX = require('xlsx');
var workbook = XLSX.readFile(PATH.join(__dirname, 'license-list', 'spdx_licenselist_v2.1.xls'));

var data = workbook.Sheets.licenses;

var licenses = { };
Object.keys(data).forEach(function (key) {
    var matches = key.match(/^([A-Z]+)([0-9]+)$/);
    if (!matches || !matches[2]) { return; }
    
    var row = matches[2],
        col = matches[1];
    
    licenses[row] = licenses[row] || { };
    licenses[row][col] = data[key];
});

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function makeArgs(str) {
    return str.split(';').reduce(function (acc, cur) {
        var matches = cur.match(/^([^=]+)(?:=(.*))?/);
        acc[matches[1]] = matches[2];
        return acc;
    }, { });
}

function makeMatcher(str, hasMarkup, licenseName) {
    if (licenseName) {
        var re = new RegExp('^\\s*'+escapeRegExp(normalize(licenseName))+'\\s*', 'i');
        str = str.replace(re, '');
    }
    if (hasMarkup) {
        str = str.split(/<<|>>/);
    } else {
        str = str.split(/(<(?:[a-z ]+|[A-Z ]+)>)/g);
    }
    
    var inBrackets = false, out = '';
    
    var args;
    
    while (str.length) {
        if (!inBrackets) {
            out += escapeRegExp(normalize(str.shift()));
            inBrackets = true;
        } else {
            args = makeArgs(str.shift());
            if (args.hasOwnProperty('beginOptional')) {
                out += format('(%s)?', escapeRegExp(normalize(str.shift())));
                assert('endOptional' === str.shift());
            } else if (args.hasOwnProperty('var')) {
                if (!args.hasOwnProperty('match')) {
                    throw new Error('Var block without "match" argument: ', args);
                }
                out += args.match;
            } else {
                //throw new Error('Unknown block: ', args);
                out += '.+';
            }
            inBrackets = false;
        }
    }

    return out;
}

var extraUrls = require('./urls');

var toLowerCase = Function.call.bind(String.prototype.toLowerCase);
licenses = Object.keys(licenses).map(function (key) {
    var row = licenses[key];
    if (key === '1') { return { }; }
    var obj = {
        name: row.A && row.A.v,
        identifier: row.B && row.B.v,
        url: row.C && row.C.v,
        header: (row.F && row.F.v) || '',
        template: row.G && row.G.v,
        hasMarkup: !!(row.K && row.K.v)
    };
    if (obj.url) {
        obj.url = obj.url.split(/\r\n|\r|\n/);
    } else {
        obj.url = [ ];
    }
    if (obj.identifier in extraUrls) {
        extraUrls[obj.identifier].forEach(function (url) {
            if (obj.url.indexOf(url) === -1) {
                obj.url.push(url);
            }
        });
    }
    obj.url = obj.url.map(toLowerCase);
    return obj;
}).filter(function (obj) {
    return !!obj.template;
}).reduce(function (acc, cur) {
    var arr = [cur], stat;

    try {
        stat = fs.statSync(PATH.join(__dirname, 'patched-licenses', cur.template));
    } catch (e) {
        if (e.code !== 'ENOENT') { throw e; }
    }
    if (stat) {
        cur.hasPatch = true;
        stat = null;
    }
    
    try {
        stat = fs.statSync(PATH.join(__dirname, 'short-licenses', cur.template));
    } catch (e) {
        if (e.code !== 'ENOENT') { throw e; }
    }
    
    if (stat && stat.isFile()) {
        arr.push({
            name: cur.name,
            identifier: cur.identifier + '-short',
            url: cur.url,
            header: cur.header,
            template: cur.template,
            hasMarkup: cur.hasMarkup,
            short: true
        });
    }
    
    return acc.concat(arr);
}, [ ]).map(function (obj) {
    var dir = 'license-list';
    if (obj.short) {
        dir = 'short-licenses';
    } else if (obj.hasPatch) {
        dir = 'patched-licenses';
        obj.hasMarkup = true;
    }
    
    var path = PATH.join(__dirname, dir, obj.template), content;
    
    console.log('>>', path);
    try {
        content = fs.readFileSync(path, 'utf8').toString();
    } catch (e) {
        if (e.code !== 'ENOENT') { throw e; }
    }
    if (!content) {
        // spreadsheet wrong, should include .txt
        try {
            content = fs.readFileSync(path+'.txt', 'utf8').toString();
        } catch (e) {
            if (e.code !== 'ENOENT') { throw e; }
        }
    }

    content = normalize.trimStartAndEnd(content);
    obj.template = makeMatcher(content, obj.hasMarkup, obj.name);
    return obj;
});




fs.writeFileSync('licenses.json', JSON.stringify(licenses));
