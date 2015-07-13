// http://spdx.org/spdx-license-list/matching-guidelines

var fs = require('fs'),
    PATH = require('path'),
    assert = require('assert'),
    format = require('util').format;

var XLSX = require('xlsx');
var workbook = XLSX.readFile(PATH.join(__dirname, 'license-list', 'spdx_licenselist_v2.0.xls'));

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

// taken from the official unicode list for hyphen-equivalents
var hyphens = [
    '\u002D', '\u007E', '\u00AD', '\u058A', '\u05BE', '\u1400',
    '\u1806', '\u2010', '\u2011', '\u2012', '\u2013', '\u2014',
    '\u2015', '\u2053', '\u207B', '\u208B', '\u2212', '\u2E17',
    '\u2E3A', '\u2E3B', '\u301C', '\u3030', '\u30A0', '\uFE31',
    '\uFE32', '\uFE58', '\uFE63', '\uFF0D'
];
var quotes = [
    '\u0027\u0027', '\u0060\u0060',
    '\u0022', '\u0027', '\u00AB', '\u00BB', '\u2018', '\u2019',
    '\u201A', '\u201B', '\u201C', '\u201D', '\u201E', '\u201F',
    '\u2039', '\u203A', '\u300C', '\u300D', '\u300E', '\u300F',
    '\u301D', '\u301E', '\u301F', '\uFE41', '\uFE42', '\uFE43',
    '\uFE44', '\uFF02', '\uFF07', '\uFF62', '\uFF63'
];
var aliases = {
    'acknowledgment': 'acknowledgement',
    'analogue': 'analog',
    'analyse': 'analyze',
    'artefact': 'artifact',
    'authorisation': 'authorization',
    'authorised': 'authorized',
    'calibre': 'caliber',
    'cancelled': 'canceled',
    'capitalisations': 'capitalizations',
    'catalogue': 'catalog',
    'categorise': 'categorize',
    'centre': 'center',
    'emphasised': 'emphasized',
    'favour': 'favor',
    'favourite': 'favorite',
    'fulfil': 'fulfill',
    'fulfilment': 'fulfillment',
    'initialise': 'initialize',
    'judgment': 'judgement',
    'labelling': 'labeling',
    'labour': 'labor',
    'licence': 'license',
    'maximise': 'maximize',
    'modelled': 'modeled',
    'modelling': 'modeling',
    'offence': 'offense',
    'optimise': 'optimize',
    'organisation': 'organization',
    'organise': 'organize',
    'practise': 'practice',
    'programme': 'program',
    'realise': 'realize',
    'recognise': 'recognize',
    'signalling': 'signaling',
    'sub-license': 'sublicense',
    'sub license': 'sublicense',
    'utilisation': 'utilization',
    'whilst': 'while',
    'wilful': 'wilfull',
    'non-commercial': 'noncommercial',
    'per cent': 'percent',
    'copyright owner': 'copyright holder'
};
var hyphenRE = new RegExp('('+hyphens.join('|')+')', 'g');
var quoteRE = new RegExp('('+quotes.join('|')+')', 'g');
// this one's really hard programmatically, so I tried to be conservative
var bulletRE = /^\s*([a-z]{1,2}|[A-Z]{1,2}|[MDCLXVImdclxvi]+|[0-9]+)?[^\s\w]\s/mg;
var aliasRE = new RegExp('('+Object.keys(aliases).join('|')+')', 'g');
var copyrightRE = /\s*(\00A9|\(\s+c\s+\)|copyright)\s*/gi

function normalize(str) {
    return str.replace(bulletRE, ' ')
        .replace(copyrightRE, ' (c) ')
        .replace(/(\(c\)\s+)+/g, ' (c) ')
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(hyphenRE, '-')
        .replace(quoteRE, '"')
        .replace(aliasRE, function (match) { return aliases[match]; })
        .trim()
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

    return new RegExp(out);
}

licenses = Object.keys(licenses).map(function (key) {
    var row = licenses[key];
    if (key === '1') { return { }; }
    return {
        name: row.A && row.A.v,
        identifier: row.B && row.B.v,
        url: row.C && row.C.v,
        header: (row.F && row.F.v) || '',
        template: row.G && row.G.v,
        hasMarkup: !!(row.K && row.K.v)
    };
}).filter(function (obj) {
    return !!obj.template;
}).map(function (obj) {
    var path = PATH.join(__dirname, 'license-list', obj.template), content;
    
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
    obj.template = makeMatcher(content, obj.hasMarkup, obj.name);
    return obj;
});

module.exports = function (str) {
    var normalized = normalize(str);
    var ret = licenses.reduce(function (acc, cur) {
        if (cur.template.test(normalized)) {
            acc.push(cur.identifier);
        }
        return acc;
    }, [ ]);
    return ret;
};
