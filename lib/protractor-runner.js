/**
 *
 * (c) 2013-2015 Wishtack
 *
 * $Id: $
 */

var dejavu = require('dejavu');

var ProtractorRunner = dejavu.Class.declare({

    installAndRun: function installAndRun(args) {

        return function protractorInstallAndRunTask(done) {

            var async = require('async');

            async.series([
                this._installer(),
                this._runner(args)
            ], done);

        }.$bind(this);

    },

    _installer: function _installer() {

        return function protractorInstall(done) {

            require('child_process').spawn(this._protractorBinary('webdriver-manager'), ['update'], {
                stdio: 'inherit'
            }).once('close', done);

        }.$bind(this);

    },

    _instanceRunner: function _instanceRunner(args) {

        return function protractorRunInstance(done) {

            var child_process = require('child_process');
            var fs = require('fs');
            var temp = require('temp');

            var config = args.config;
            var summaryList = args.summaryList;
            var capabilities = config.capabilities || {};

            var summary = {
                browser: capabilities.browserName,
                browserVersion: capabilities.browser_version,
                device: capabilities.device,
                os: capabilities.os,
                osVersion: capabilities.os_version
            };

            temp.open('protractor.conf.js', function (err, info) {

                var command = null;

                if (err) {
                    throw err;
                }

                fs.writeSync(info.fd, 'exports.config = ' + JSON.stringify(config));
                fs.closeSync(info.fd);

                /* Pass configuration file to protractor command. */
                command = this._spawnProtractor([info.path]);

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

            }.$bind(this));

        }.$bind(this);

    },

    _log: function _log(args) {
        console.log(args.message);
    },

    _protractorBinary: function _protractorBinary(binaryName) {
        var path = require('path');
        var winExt = /^win/.test(process.platform) ? '.cmd' : '';
        var pkgPath = require.resolve('protractor');
        var protractorDir = path.resolve(path.join(path.dirname(pkgPath), '..', 'bin'));
        return path.join(protractorDir, '/' + binaryName + winExt);
    },

    _runner: function _runner(args) {

        return function protractorRun(done) {

            var _ = require('underscore');
            var async = require('async');
            var child_process = require('child_process');
            var fs = require('fs');
            var stringFormat = require('string-format');
            var temp = require('temp');

            var configList = args.configList;
            var summaryList = [];

            var argsList = _.map(configList, function (config) {
                return {
                    config: config,
                    summaryList: summaryList
                }
            });

            /* Remove files on process exit. */
            temp.track();

            var instanceRunnerList = _.map(argsList, this._instanceRunner.$bind(this));

            /* Run protractor on each instance sequentially. */
            async.series(instanceRunnerList, function () {

                var success = _.all(_.pluck(summaryList, 'result'));

                summaryList.forEach(function (summary) {

                    summary.result = summary.result ? 'SUCCESS' : 'FAILURE';

                    this._log({
                        message: stringFormat('os={os} {osVersion}, device={device}, browser={browser}{browserVersion}: {result} ({resultMessage}).', summary)
                    });

                }.$bind(this));

                done(success ? null : 'Protractor tests failed.');

            }.$bind(this));

        }.$bind(this);

    },

    _spawnProtractor: function _spawnProtractor(argv) {

        return require('child_process').spawn(this._protractorBinary('protractor'), argv, {
            stdio: [process.stdin, 'pipe', process.stderr]
        });

    }

});

module.exports = new ProtractorRunner();
