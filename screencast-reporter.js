(function (root, factory) {
  if(typeof define === 'function' && define.amd){
    // AMD
    define('ScreencastReporter', [], factory);
  }else if(typeof exports === 'object'){
    // CommonJS-like environments that support module.exports
    module.exports = factory();
  }else{
    // Browser globals
    root.ScreencastReporter = factory();
  }
}(this, function() {
  'use strict';

  function ScreencastReporter(runner){
    var root = document.getElementById('mocha'),
        runner = StatsAwareMixin(runner),
        progress = new ProgressBars(runner),
        runningTests = new RunningTests(runner),
        failedTests = new FailedTests(runner),
        statsWidget = new StatsWidget(runner);

    root.appendChild(progress.html);
    root.appendChild(runningTests.html);
    root.appendChild(failedTests.html);
    root.appendChild(statsWidget.html);
  }

  function StatsAwareMixin(runner){
    var stats = runner.stats = {
          suites: 0, tests: 0,
          passes: 0, pending: 0, failures: 0,
          running: 0, total: runner.total,
          reports: []
        };

    runner.on('start', function(){
      stats.start = new Date;
      runner.emit('stats changed');
    });

    runner.on('suite', function(suite){
      suite.root || stats.suites++;
      runner.emit('stats changed');
    });

    runner.on('test', function(test){
      stats.running++;
      runner.emit('stats changed');
    });

    runner.on('test end', function(test){
      stats.tests++;
      stats.running--;
      runner.emit('stats changed');
    });

    runner.on('pass', function(test){
      var medium = test.slow() / 2;
      test.speed = test.duration > test.slow()
        ? 'slow'
        : test.duration > medium
          ? 'medium'
          : 'fast';
      stats.passes++;
      runner.emit('stats changed');
    });

    runner.on('fail', function(test, err){
      stats.failures++;
      test.err = err;

      stats.reports.push({
        name: test.title,
        result: false,
        message: err.message,
        stack: err.stack,
        titles: getTitlesFromTest(test)
      });
      runner.emit('stats changed');
    });

    runner.on('end', function(){
      stats.end = new Date;
      stats.duration = stats.end - stats.start;
      runner.emit('stats changed');
    });

    runner.on('pending', function(){
      stats.pending++;
      runner.emit('stats changed');
    });

    return runner;
  }

  function FailedTests(runner){
    var that = this,
        testNodes = document.createElement('div'),
        header = document.createElement('h1');

    that.html = document.createElement('div');
    that.html.className = 'failed-tests';
    that.html.appendChild(header);
    that.html.appendChild(testNodes);

    that.repaint = function repaint(){
      var stats = that.runner.stats;
      setText(header, 'Failed Tests: ' + stats.failures + '/' + stats.total);
      that.html.className = 'failed-tests';
      if(stats.failures){
        that.html.className += ' failed-tests-alert';
      }
    }

    that.push = function push(test, err){
      var testNode = document.createElement('div'),
          header = document.createElement('h2'),
          message = document.createElement('div'),
          stack = document.createElement('pre');

      setText(header, test.fullTitle());
      setText(message, err.message);
      setText(stack, err.stack);

      testNode.appendChild(header);
      testNode.appendChild(message);
      testNode.appendChild(stack);

      testNodes.insertBefore(testNode, testNodes.firstChild);
    };

    that.setRunner = function setRunner(runner){
      if(that.runner){
        that.runner.removeListener('fail', that.push);
        that.runner.removeListener('stats changed', that.repaint);
      }
      that.runner = runner;
      if(that.runner){
        that.runner.on('fail', that.push);
        that.runner.on('stats changed', that.repaint);
      }
    }

    that.setRunner(runner);
  }

  function RunningTests(runner){
    var that = this,
        testNodes = document.createElement('div'),
        header = document.createElement('h1'),
        running = {};

    that.html = document.createElement('div'),
    that.html.className = 'running-tests';
    that.html.appendChild(header);
    that.html.appendChild(testNodes);

    that.repaint = function repaint(){
      var stats = that.runner.stats;
      setText(header, 'Running Tests: ' + stats.running + '/' + stats.total);
    }

    that.push = function push(test){
      var testNode = document.createElement('div');
      setText(testNode, test.fullTitle());
      running[test] = testNode;
      testNodes.insertBefore(testNode, testNodes.firstChild);
    };

    that.pop = function pop(test){
      testNodes.removeChild(running[test]);
      running[test] = undefined;
    };

    that.setRunner = function setRunner(runner){
      if(that.runner){
        that.runner.removeListener('test', that.push);
        that.runner.removeListener('test end', that.pop);
        that.runner.removeListener('stats changed', that.repaint);
      }
      that.runner = runner;
      if(that.runner){
        that.runner.on('test', that.push);
        that.runner.on('test end', that.pop);
        that.runner.on('stats changed', that.repaint);
      }
    }

    that.setRunner(runner);
  }

  function ProgressBars(runner){
    var that = this,
        progressPasses = document.createElement('div'),
        progressFailures = document.createElement('div'),
        clear  = document.createElement('div');

    that.html = document.createElement('div');
    that.html.className = 'progress';
    progressPasses.className = 'progress-passes progress-bar';
    progressFailures.className = 'progress-failures progress-bar';
    clear.style.clear = 'both';

    that.html.appendChild(progressPasses);
    that.html.appendChild(progressFailures);
    that.html.appendChild(clear);

    that.repaint = function repaint(){
      var passes = runner.stats.passes,
          failures = runner.stats.failures,
          total = runner.stats.total || (passes+failures);
      if(total){
        progressPasses.style.width = Math.round(passes/total * 100) + '%';
        progressFailures.style.width = Math.round(failures/total * 100) + '%';
      }else{
        // no tests
        progressPasses.style.width = '100%';
        progressFailures.style.width = '0%';
      }
    }

    that.setRunner = function setRunner(runner){
      if(that.runner){
        that.runner.removeListener('stats changed', that.repaint);
      }
      that.runner = runner;
      if(that.runner){
        that.runner.on('stats changed', that.repaint);
      }
    }

    that.setRunner(runner);
  }

  function StatsWidget(runner){
    var that = this,
        header = document.createElement('h1'),
        stats = document.createElement('div');

    that.html = document.createElement('div');
    that.html.className = 'statistics';

    that.html.appendChild(header);
    that.html.appendChild(stats);

    that.repaint = function repaint(){
      var statsArray = [],
          stat;

      for(stat in that.runner.stats){
        if(stat != 'reports'){
          statsArray.push(stat + ': ' + that.runner.stats[stat]);
        }
      }

      setText(header, 'Statistics:');
      setText(stats, statsArray.join(', '));
    }

    that.setRunner = function setRunner(runner){
      if(that.runner){
        that.runner.removeListener('end', that.repaint);
      }
      that.runner = runner;
      if(that.runner){
        that.runner.on('end', that.repaint);
      }
    }

    that.setRunner(runner);
  }

  function setText(el, str){
    if(el.textContent){
      el.textContent = str;
    }else if(el.innerText){
      el.innerText = str;
    }else{
      el.innerHTML = str;
    }
  }

  function getTitlesFromTest(test){
    var titles = [];
    while(test.parent.title){
      titles.unshift(test.parent.title);
      test = test.parent;
    }
    return titles;
  }

  return ScreencastReporter;
}));
