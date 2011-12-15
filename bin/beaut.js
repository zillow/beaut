#!/usr/bin/env node
/*jshint node: true, latedef: false */

    // builtin dependencies
var fs = require('fs'),
    path = require('path'),

    // npm-provided dependencies
    nopt = require('nopt'),
    minimatch = require('minimatch'),

    // package-provided dependency
    beautify = require('../lib/beautify'),

    // parsing cli arguments with nopt
    options = {
        // beautify-specific
        indent_size: Number,
        indent_char: String,
        brace_style: ['collapse', 'expand', 'end-expand'],
        keep_array_indentation: Boolean,
        preserve_newlines: Boolean,
        preserve_max_newlines: Number,
        jslint_happy: Boolean,
        // custom
        write_in_place: Boolean,
        usage: Boolean
    },
    shorthand = {
        // beautify-specific
        i: ['--indent_size'],
        b: ['--brace_style', 'expand'],
        a: ['--keep_array_indentation'],
        n: ['--preserve_newlines'],
        p: ['--jslint_happy'],

        // custom
        w: ['--write_in_place'],
        o: ['--jslint_happy', '--write_in_place', '--keep_array_indentation', '--brace_style', 'end-expand'],
        h: ['--usage'],
        help: ['--usage'],
        '?': ['--usage']
    },
    config = nopt(options, shorthand);

// console.log(config);

if (config.usage) {
    printUsage();
}
else if (!require('tty').isatty(process.stdin)) {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    var streamed = '';
    process.stdin.on('data', function (chunk) {
        streamed += chunk;
    });
    process.stdin.on('end', function () {
        finish(beautify(streamed));
    });
}
else if (config.argv.original.length === 0) {
    console.warn("You must specify at least one file to beautify.\n");
    printUsage(1);
}
else {
    main(config.argv.remain, config);
}


/**
 * Iterate over file list with beautifier, handling multiple file parameters.
 *
 * @method main
 * @param {Array} files
 * @private
 */
function main(files) {
    var output = [],
        jsPattern = "**.js",
        jsFiles = minimatch.match(files, jsPattern),
        filesRemaining = (jsFiles[0] !== jsPattern) && jsFiles.length;

    if (filesRemaining) {
        jsFiles.forEach(function (file, i) {
            fs.realpath(path.resolve(file), function (err, absolutePath) {
                if (err) { throw err; }

                fs.readFile(absolutePath, 'utf8', function (err, data) {
                    if (err) { throw err; }

                    var beautified = beautify(data, config);

                    if (config.write_in_place) {
                        // replace file contents in-place
                        fs.writeFile(absolutePath, beautified, 'utf8', function (err) {
                            if (err) { throw err; }

                            console.log("Beautified " + path.basename(absolutePath));

                            filesRemaining -= 1;
                            if (filesRemaining === 0) {
                                finish("\nBeautification complete!");
                            }
                        }); // fs.writeFile
                    }
                    else {
                        // echo to stdout (when everything is done)
                        output[i] = beautified;

                        filesRemaining -= 1;
                        if (filesRemaining === 0) {
                            finish(output.join('\n\n'));
                        }
                    }
                }); // fs.readFile
            }); // fs.realpath
        }); // forEach
    } // filesRemaining
}

/**
 * Print results to stdout and exit process, working around bugs.
 *
 * @method finish
 * @param {String} results
 * @private
 */
function finish(results) {
    process.stdout.write(results + '\n');

    function exit() {
        process.exit(results.length > 0 ? 1 : 0);
    }

    // avoid stdout cutoff in node 0.4.x, also supports 0.5.x
    // see https://github.com/joyent/node/issues/1669
    try {
        if (!process.stdout.flush()) {
            process.stdout.once("drain", exit);
        } else {
            exit();
        }
    } catch (e) {
        exit();
    }
}

/**
 * Print usage to stdout, then exit process with optional exitCode.
 *
 * @method printUsage
 * @param {Number} [exitCode] defaults to 0 ("success")
 * @private
 */
function printUsage(exitCode) {
    process.stdout.write([
        "Usage: beaut [options] [file [...] || STDIN]",
        "",
        "Reads from standard input if no file[s] specified.",
        "",
        "Options:",
        "-i NUM\tIndent size (default 4)",
        "-b\tPut braces on own line (Allman / ANSI style)",
        "-a\tIndent arrays",
        "-n\tPreserve newlines",
        "-p\tJSLint-pedantic mode, currently only adds space between \"function ()\"",
        "",
        "-w\tBeautify files in place, instead of outputting to stdout",
        "-o\tOpinionated defaults",
        "-h\tPrint this help",
        "",
        "Examples:",
        "  beaut -w ./foo/bar/*.js",
        "  beaut -i 2 example.js",
        "  beaut < example.js",
        ""
    ].join( "\n" ));

    process.exit(exitCode || 0);
}

