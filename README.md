
Synopsis
===========

No fuss benchmarking for Node.js.

[![NPM](https://nodei.co/npm/benchpress.png?downloads=true)](https://nodei.co/npm/benchpress/)

[![Build Status](https://travis-ci.org/mariocasciaro/benchpress.png)](https://travis-ci.org/mariocasciaro/benchpress)
[![Dependency Status](https://david-dm.org/mariocasciaro/benchpress.png)](https://david-dm.org/mariocasciaro/benchpress) 


## Usage

```javascript
var Benchpress = require('benchpress');

var suite = new Benchpress({
  // iterations: 1000   <--- 1000 by default
});


suite
  .add('Benchmark name', {
    beforeAll: function() {
      // Run before the benchmark is started
    },
    beforeEach: function() {
      // Run before each iteration
    },
    fn: function() {
      // The code to profile
    },
    afterEach: function() {
      // Run after each iteration
    },
    afterAll: function() {
      // Run after the benchmark finishes
    }
  })
  .add('Async benchmark', function() {
    beforeAll: function(done) {
      // Run code asynchronously before the benchmark starts
      done();
    },
    fn: function(done) {
      // Profile async code too
      done();
    },
    afterEach: function(done) {
      // any function can be asynchronous...
      done();
    },
    //specify iterations per benchmark
    iterations: 300
  })
  //don't dorget to run the suite!!!
  .run();

```

The code above will print in the console something like this:
```
Starting suite.
Benchmark 'Benchmark name': 374812 ops/sec (1000 iterations)
Benchpress 'Async benchmark': 126432 ops/sec (300 iterations)
Run complete.
```

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/mariocasciaro/benchpress/trend.png)](https://bitdeli.com/free "Bitdeli Badge")