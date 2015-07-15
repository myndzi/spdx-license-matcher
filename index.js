'use strict';

var licenses = require('./licenses.json');
var byID = { };
licenses.forEach(function (lic) {
    byID[lic.identifier.toLowerCase()] = lic;
    lic.template = new RegExp(lic.template);
});

var normalize = require('./normalize');

module.exports = function (str) {
    var normalized = normalize(str);
    
    if (normalized in byID) { return [byID[normalized].identifier]; }
    
    return licenses.reduce(function (acc, cur) {
        if (cur.template.test(normalized)) {
            acc.push(cur.identifier);
        }
        return acc;
    }, [ ]);
};

module.exports.test = function (id, str) {
    var normalized = normalize(str);
    var template = byID[id].template;
    console.log(template.test(normalized));
    console.log(template);
    console.log(normalized);
}
