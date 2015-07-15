'use strict';

var fs = require('fs'),
    PATH = require('path'),
    getLicenses = require('./index');

var normalize = require('./normalize');

var startRE = /(#+)\s*licen[sc]e|copying\s*$/i;
function getMarkdownSection(str) {
    var start = str.match(startRE);
    if (!start) { return str; }
    
    str = str.slice(start.index).replace(startRE, '');
    
    var end = str.match(new RegExp('#{1,'+start[1].length+'}|$'));
    if (end) { str = str.slice(0, end.index); }
    
    return str;
}

module.exports = function search(searchDir) {
    var files = fs.readdirSync(searchDir);

    var licenseCandidates = files.filter(function (file) {
        return /\blicen[sc]e\b/i.test(file);
    });
    var copyingCandidates = files.filter(function (file) {
        return /\bcopying\b/i.test(file);
    });
    var readmeCandidates = files.filter(function (file) {
        return /\breadme\b/i.test(file);
    });

    var candidates = licenseCandidates
        .concat(copyingCandidates)
        .concat(readmeCandidates);
    
    candidates = candidates.map(function (file) {
        return PATH.resolve(searchDir, file);
    }).filter(function (path) {
        return fs.statSync(path).isFile();
    });

    return candidates.reduce(function (acc, file) {
        var contents = fs.readFileSync(PATH.resolve(searchDir, file)).toString();
        if (/\.md$/i.test(file)) {
            contents = getMarkdownSection(contents);
        }
        
        var licenses = getLicenses(contents).map(function (id) {
            return {
                source: PATH.resolve(searchDir, file),
                identifier: id
            };
        });

        return acc.concat(licenses);
    }, [ ]);
};
