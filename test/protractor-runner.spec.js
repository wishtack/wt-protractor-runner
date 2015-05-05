/**
 *
 * (c) 2013-2014 Wishtack
 *
 * $Id: $
 */

describe('protractor-run', function () {

    var _createFakeChildProcess = function _createFakeChildProcess() {

        var EventEmitter = require('events').EventEmitter;

        var emitter = new EventEmitter();

        emitter.stdout = new EventEmitter();

        setTimeout(function () {
            emitter.emit('close', 0);
        });

        return emitter;

    };

    it('should run protractor with config', function (done) {

        var fs = require('fs');
        var protractorRunner = require('../lib/protractor-runner');

        /* Creating dummy configurations. */
        var dummyConfig1 = {capabilities: {os: 'OS X', browserName: 'safari'}, dummyField: 1};
        var dummyConfig2 = {capabilities: {os: 'Windows', browserName: 'internet explorer'}, dummyField: 2};

        /* Spying. */
        spyOn(protractorRunner, '_installer').and.returnValue(function (done) { done(); });
        spyOn(protractorRunner, '_log');
        spyOn(protractorRunner, '_spawnProtractor').and.callFake(_createFakeChildProcess);

        /* Call task. */
        protractorRunner.installAndRun({
            configList: [dummyConfig1, dummyConfig2]
        })(function () {

            /* Check that protractor was run twice. */
            expect(protractorRunner._spawnProtractor.calls.count()).toBe(2);

            /* Check protractor config. */
            expect(fs.readFileSync(protractorRunner._spawnProtractor.calls.all()[0].args[0][0], {encoding: 'utf-8'}))
                .toEqual('exports.config = {"capabilities":{"os":"OS X","browserName":"safari"},"dummyField":1}');
            expect(fs.readFileSync(protractorRunner._spawnProtractor.calls.all()[1].args[0][0], {encoding: 'utf-8'}))
                .toEqual('exports.config = {"capabilities":{"os":"Windows","browserName":"internet explorer"},"dummyField":2}');

            /* Check logs. */
            expect(protractorRunner._log.calls.count()).toBe(2);
            expect(protractorRunner._log.calls.all()[0].args[0].message)
                .toEqual('os=OS X , device=, browser=safari: SUCCESS ().');
            expect(protractorRunner._log.calls.all()[1].args[0].message)
                .toEqual('os=Windows , device=, browser=internet explorer: SUCCESS ().');

            done();

        });

    });

});
