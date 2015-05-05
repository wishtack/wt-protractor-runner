# gulp-protractor-run

## What's that for?

This module is here to help you with two things:

* Run protractor from gulp with just one line of code.
* Run a bunch or protractor instances sequentially for local cross-browser testing or using cloud platforms like [Browserstack](https://www.browserstack.com).

## Run protractor

As you may know, there's already [gulp-protractor](https://github.com/mllrsohn/gulp-protractor) that allows you to use 
a gulp plugin in order to run protractor. It's readme also shows how to run protractor without a gulp plugin but it needs
some copy/pasting. [gulp-protractor-run](https://github.com/wishtack/gulp-protractor-run) will help you avoid this code
duplication and run your tests in few seconds.

Install [gulp-protractor-run](https://github.com/wishtack/gulp-protractor-run)

Gulpfile.js:

```javascript
 gulp.task('test-e2e', require('gulp-protractor-run')({
     configList: [
         {
             capabilites: {
                 browser: 'chrome'
             },
             specs: __dirname + '/test/e2e/*.js'
         }
     ]
 }));
```

Run:

```shell
 gulp test-e2e
```

## Run cross-browser tests with protractor.

Just do the same as above and give multiple configurations to protractor.

```javascript
 
 var protractorRun = require('gulp-protractor-run');
 var specPattern = __dirname + '/test/e2e/*.js';
 
 gulp.task('test-e2e', protractorRun({
     configList: [
         /* Chrome. */
         {
             capabilites: {
                 browser: 'chrome'
             },
             specs: specPattern
         },
         /* Safari on browserstack. */
         {
              capabilities: {
                  acceptSslCerts: true,
                  browserName: 'safari',
                  'browserstack.debug': true,
                  'browserstack.user': process.env.YOUR_BROWSERSTACK_USER_ENV_VAR,
                  'browserstack.key': process.env.YOUR_BROWSERSTACK_KEY_ENV_VAR,
                  os: 'OS X',
                  os_version: 'Yosemite'
              },
              seleniumAddress: 'http://hub.browserstack.com/wd/hub'
              specs: specPattern
         }
     ]
 }));
```

To make this more readable, you should use [wt-protractor-utils](https://github.com/wishtack/wt-protractor-utils).
