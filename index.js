/**
 *
 * (c) 2013-2014 Wishtack
 *
 * $Id: $
 */

var _getProtractorBinary = function _getProtractorBinary(binaryName) {
    var path = require('path');
    var winExt = /^win/.test(process.platform) ? '.cmd' : '';
    var pkgPath = require.resolve('protractor');
    var protractorDir = path.resolve(path.join(path.dirname(pkgPath), '..', 'bin'));
    return path.join(protractorDir, '/' + binaryName + winExt);
};

var _protractorInstall = function _protractorInstall(done) {

    var child_process = require('child_process');

    child_process.spawn(_getProtractorBinary('webdriver-manager'), ['update'], {
        stdio: 'inherit'
    }).once('close', done);

};

var _protractorRunFactory = function _protractorRunFactory(args) {

    var configList = args.configList;

    return function protractorRun(done) {

        var _ = require('underscore');
        var async = require('async');
        var child_process = require('child_process');
        var fs = require('fs');
        var stringFormat = require('string-format');
        var temp = require('temp');

        var summaryList = [];

        var _protractorRunner = function _protractorRunner(config) {

            return function protractorRunInstance(done) {

                var summary = {
                    browser: config.capabilities.browserName,
                    browserVersion: config.capabilities.browser_version,
                    device: config.capabilities.device,
                    os: config.capabilities.os,
                    osVersion: config.capabilities.os_version
                };

                temp.open('protractor.conf.js', function (err, info) {

                    /* Forward args to protractor. */
                    var argv = process.argv.slice(3);
                    var command = null;

                    if (err) {
                        throw err;
                    }

                    fs.writeSync(info.fd, 'exports.config = ' + JSON.stringify(config));
                    fs.closeSync(info.fd);

                    /* Add configuration file. */
                    argv.push(info.path);

                    command = child_process.spawn(_getProtractorBinary('protractor'), argv, {
                        stdio: [process.stdin, 'pipe', process.stderr]
                    });

                    command.stdout.on('data', function (data) {

                        var dataString = data.toString();
                        var match = dataString.match(/^.*?test.*?assertion.*?failure.*?$/m);

                        process.stdout.write(data);

                        if (match != null) {
                            summary.resultMessage = match[0] + '\033[0m';
                        }

                    });

                    command.once('close', function (statusCode) {

                        summary.result = (statusCode === 0);

                        done();

                    });

                    summaryList.push(summary);

                });

            };

        };

        /* Remove files on process exit. */
        temp.track();

        var protractorRunnerList = _.map(configList, _protractorRunner);

        /* Run protractor on each instance sequentially. */
        async.series(protractorRunnerList, function () {

            var success = _.all(_.pluck(summaryList, 'result'));

            summaryList.forEach(function (summary) {

                summary.result = summary.result ? 'SUCCESS' : 'FAILURE';

                console.log(stringFormat('os={os} {osVersion}, device={device}, browser={browser}{browserVersion}: {result} ({resultMessage}).', summary))

            });

            done(success ? null : 'Protractor tests failed.');

        });

    };

};

module.exports = function protractorRun(args) {

    return function (done) {

        var async = require('async');

        async.series([
            _protractorInstall,
            _protractorRunFactory(args)
        ], done);

    };

};
