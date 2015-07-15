'use strict';

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
var bulletRE = /^\s*(([a-z]{1,2}|[A-Z]{1,2}|[MDCLXVImdclxvi]+|[0-9]+)?[^\s\w]|\(([a-z]{1,2}|[A-Z]{1,2}|[MDCLXVImdclxvi]+|[0-9]+)\))\s/mg;
var aliasRE = new RegExp('('+Object.keys(aliases).join('|')+')', 'g');
var copyrightRE = /\s*(\00A9|\(\s+c\s+\)|copyright)\s*/gi

module.exports = function normalize(str) {
    return str.replace(bulletRE, ' ')
        .replace(copyrightRE, ' (c) ')
        .replace(/(\(c\)\s+)+/g, ' (c) ')
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(hyphenRE, '-')
        .replace(quoteRE, '"')
        .replace(aliasRE, function (match) { return aliases[match]; })
        .trim()
};
