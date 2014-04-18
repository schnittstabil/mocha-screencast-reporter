mocha-screencast-reporter
=========================

Mocha test reporter for the browser, optimized for screencast environments.

The Problem: Mochas built-in HTML reporter floods the browser window with spec reports of successfully passed tests, so failed tests might be drowned at the non-visible bottom part of the document - awkward in an automated testing environment.

Features
--------

* Small progressbar on top
* Only displays detailed information about failed tests
* Failed tests are insert at the top, so recording of the failure becomes more likely
* Output stacktraces (if possible)

Screenshots
-----------

[![screenshot-running](http://schnittstabil.github.io/mocha-screencast-reporter/screenshot-running-thumb.png)](http://schnittstabil.github.io/mocha-screencast-reporter/screenshot-running.png)
[![screenshot-done](http://schnittstabil.github.io/mocha-screencast-reporter/screenshot-done-thumb.png)](http://schnittstabil.github.io/mocha-screencast-reporter/screenshot-done.png)


Installation
------------

### Npm

```sh
npm install mocha-screencast-reporter --save
```

### Bower

```sh
bower install mocha-screencast-reporter --save
```

Usage
-----

You have to include the `screencast-reporter.css` and `screencast-reporter.js` files in your Html.

```JavaScript
// using global window.ScreencastReporter:
mocha.reporter(ScreencastReporter);

// or during setup:
mocha.setup({ ui: 'bdd', reporter: ScreencastReporter });
```

### AMD

`screencast-reporter.js` will use an existing AMD loader, but only if one is present - so you have to **include your loader first**.

```JavaScript
require(['ScreencastReporter'], function(ScreencastReporter){
  //mocha.checkLeaks();
  mocha.reporter(ScreencastReporter);
  mocha.run();
});
```

### [Sauce Labs](https://saucelabs.com/) support

The `ScreencastReporter` configure its mocha runner to provide appropriate `stats.reports` for the [Mocha Sauce Labs Test Environment](https://saucelabs.com/docs/javascript-unit-testing-tutorial), so the [failedTests-workaround](https://saucelabs.com/docs/javascript-unit-testing-tutorial) is not necessary, instead do:

```JavaScript
//mocha.checkLeaks();
var runner = mocha.run();

function exposeMochaResults(){
  window.mochaResults = runner.stats;
}

runner.on('end', exposeMochaResults);
// test if already ended:
if(runner.stats.end){
  exposeMochaResults();
}
```

Examples
--------

See [here](example).

License
-------

Copyright (c) 2014 Michael Mayer

Licensed under the [MIT license](LICENSE).
