#!/usr/bin/env node
/*jshint node: true, latedef: false */

    // builtin dependencies
var fs = require('fs'),
    path = require('path'),
    tty = require('tty'),

    // npm-provided dependencies
    program = require('commander'),
    minimatch = require('minimatch'),

    // package-provided dependency
    beautify = require('../lib/beautify');


program.version('0.2.0')
    .usage('[options] <file ...>|<stdin>')
        .option('-i, --indent-size <n>', 'Number of chars to indent [4]', parseInt, 4)
        .option('-c, --indent-char <s>', 'Character used to indent [space]', ' ')
        .option('-b, --brace-style [style]', 'Style for braces (collapse|expand|end-expand) [collapse]', 'collapse')
        .option('-a, --keep-array-indentation', 'Keep array indentation')
        .option('-N, --no-preserve-newlines', 'Do not preserve existing line breaks')
        .option('-m, --max-preserve-newlines [n]', 'Max newlines to preserve in one chunk', parseInt, 0)
        .option('-p, --jslint-happy', 'Enforce stricter JSLint mode')
        .option('-w, --write-in-place', 'Replace file contents in-place, instead of emitting to stdout');

program.on('--help', function () {
    console.log([
        "Examples:",
        "  beaut -w ./foo/bar/*.js",
        "  beaut -i 2 example.js",
        "  beaut < example.js",
        ""
    ].join( "\n" ));
});

program.parse(process.argv);


// Handle stdin, otherwise consume the rest of the CLI arguments (files)
if (!tty.isatty(process.stdin)) {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    var streamed = '';
    process.stdin.on('data', function (chunk) {
        streamed += chunk;
    });
    process.stdin.on('end', function () {
        finish(beautify(streamed, program));
    });
}
else {
    handleFiles(program.args);
}


/**
 * Iterate over file list with beautifier, handling multiple file parameters.
 *
 * @method handleFiles
 * @param {Array} files
 * @private
 */
function handleFiles(files) {
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

                    var beautified = beautify(data, program);

                    if (program.writeInPlace) {
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
    else {
        finish("You must specify at least one file to beautify.", 1);
    }
}

/**
 * Print output to stdout and exit process, working around bugs.
 *
 * @method finish
 * @param {String} output
 * @param {Mixed} [error] If truthy, process exits with error code (1)
 * @private
 */
function finish(output, error) {
    if (output.length) {
        process.stdout.write(output + '\n');
    }

    function exit() {
        process.exit(error || output.length < 1 ? 1 : 0);
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

