'use strict';

var licenses = require('./licenses.json');
var byID = { }, byURL = { };
licenses.forEach(function (lic) {
    byID[lic.identifier.toLowerCase()] = lic;
    lic.url.forEach(function (url) {
        byURL[url] = byURL[url] || { };
        byURL[url][lic.identifier] = 1;
    });
    lic.template = new RegExp(lic.template);
});
Object.keys(byURL).forEach(function (key) {
    byURL[key] = Object.keys(byURL[key]);
});

var _normalize = require('./normalize');
function normalize(str) {
    str = _normalize.trimStartAndEnd(str);
    str = _normalize(str);
    return str;
}

module.exports = function (str) {
    var normalized = normalize(str);
    
    if (normalized in byID) { return [byID[normalized].identifier]; }
    
    var byContents = licenses.reduce(function (acc, cur) {
        if (cur.template.test(normalized)) {
            acc.push(cur.identifier);
        }
        return acc;
    }, [ ]);
    if (byContents.length) { return byContents; }

    var urls = Object.keys(byURL).reduce(function (acc, key) {
        if (normalized.indexOf(key) > 1) {
            byURL[key].forEach(function (lic) {
                acc[lic] = 1;
            });
        }
        return acc;
    }, { });
    return Object.keys(urls);
};

module.exports.test = function (id, str) {
    var normalized = normalize(str);
    var template = byID[id].template;
    console.log(template.test(normalized));
    console.log(template);
    console.log(normalized);
}
