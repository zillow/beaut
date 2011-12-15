#!/usr/bin/env node

var nopt = require('nopt'),

    options = {
        indent_size: Number,
        indent_char: String,
        brace_style: ['collapse', 'expand', 'end-expand'],
        keep_array_indentation: Boolean,
        preserve_newlines: Boolean,
        preserve_max_newlines: Number,
        jslint_happy: Boolean,
        usage: Boolean
    },
    shorthand = {
        i: ['--indent_size'],
        b: ['--brace_style', 'expand'],
        a: ['--keep_array_indentation'],
        n: ['--preserve_newlines'],
        p: ['--jslint_happy'],

        h: ['--usage'],
        help: ['--usage'],
        '?': ['--usage']
    },
    config = nopt(options, shorthand),

    beautify;

if (config.usage || !config.cooked) {
    // user passed -h or no args
    process.stdout.write([
        "Usage: beaut [options] [file || URL || STDIN]",
        "",
        "Reads from standard input if no file or URL is specified.",
        "",
        "Options:",
        "-i NUM\tIndent size (1 for TAB)",
        "-b\tPut braces on own line (Allman / ANSI style)",
        "-a\tIndent arrays",
        "-n\tPreserve newlines",
        "-p\tJSLint-pedantic mode, currently only adds space between \"function ()\"",
        "",
        "-h\tPrint this help",
        "",
        "Examples:",
        "  beaut -i 2 example.js",
        "  beaut -i 1 http://www.example.org/example.js",
        "  beaut < example.js",
        "\n"
    ].join( "\n" ));

    process.exit();
}

beautify = require('../lib/beautify');
