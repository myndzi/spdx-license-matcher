'use strict';

var debug = require('debug')('spdx-license-matcher');

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
var bulletRE = /^\s*[^\s\w]?([a-zA-Z]|[MDCLXVImdclxvi]+|[0-9]+)?[^\s\w]\s/mg;
var aliasRE = new RegExp('('+Object.keys(aliases).join('|')+')', 'g');
var copyRE = /\s*(\u00A9|\(\s*c\s*\)|copyright)\s*/gi
var copyrightRE = /\s*copyright (\d+(-\d+)|<<.*?>>).*?(all rights reserved\.?|$)|all rights reserved\.?/gmi;

module.exports = function normalize(str) {
    return str.replace(bulletRE, function (a) {
            debug('removing bullet:', a);
            return ' ';
        })
        .replace(copyRE, ' copyright ')
        .replace(/(copyright\s+)+/g, ' copyright ')
        .replace(copyrightRE, function (a) {
            debug('removing copyright:', a);
            return '';
        })
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(hyphenRE, '-')
        .replace(quoteRE, '"')
        .replace(aliasRE, function (match) { return aliases[match]; })
        .trim();
};

function isPre(str) {
    str = str.replace(copyRE, ' copyright ')
        .replace(/(copyright\s+)+/g, ' copyright ');

    // remove any license header, such as the text "The Foo License:"
    if (/licen[cs]e:?\s*$|^\s*\(.*?licen[cs]e\)\s*$/i.test(str)) { return true; }
    // remove any copyright notices 
    if (/^\s*copyright\b/.test(str)) { return true; }
    // remove blank lines
    if (/^\s*$/.test(str)) { return true; }
    return false;
}
module.exports.trimStartAndEnd = function (str) {
    var parts = str.split(/\r\n|\r|\n/);
    while (parts.length && isPre(parts[0])) {
        debug('removing preface:', parts[0]);
        parts.shift();
    }
    str = parts.join('\n');
    
    // cut anything past the end of the license text
    var end = str.match(/^(.*the license terms end here.*|\s*end of terms and conditions\s*|_{10,})$/mi);
    if (end) {
        debug('removing end text:', str.slice(end.index));
        str = str.slice(0, end.index);
    }
    return str;
}
