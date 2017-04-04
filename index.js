
var async = require('async'),
  ProgressBar = require('progress');

function Benchpress(options) {
  options = options || {};
  this.benchmarks = [];
  this.iterations = options.iterations || 500;
  this.concurrency = options.concurrency || 1;
  this._resetProfiler();
}

Benchpress.prototype._resetProfiler = function() {
  this.timeAccumulator = [0, 0];
};

Benchpress.prototype._startProfiler = function() {
  this.lastTiming = process.hrtime();
};

Benchpress.prototype._stopProfiler = function() {
  var diff = process.hrtime(this.lastTiming);

  var sumSecs = diff[0] + this.timeAccumulator[0];
  var sumNano = diff[1] + this.timeAccumulator[1];
  if(sumNano >= 1e9) {
    sumSecs++;
    sumNano -= 1e9;

    //precision problems?
    if(sumNano <= 0) {
      sumNano = 0;
    }
  }

  this.timeAccumulator = [sumSecs, sumNano];
};

Benchpress.prototype._getTimingMicroseconds = function() {
  return (this.timeAccumulator[1] / 1e3) + (this.timeAccumulator[0] * 1e6);
};

Benchpress.prototype.run = function(done) {
  var self = this;

  console.log("Starting suite.");
  async.eachSeries(this.benchmarks, function(bench, done) {
    bench.progress = new ProgressBar("Running '" + bench.name + "' [:bar] :percent :etas ", {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: bench.iterations,
      clear: true
    });

    self.runBenchmark(bench, function(err) {
      if(err) {
        console.log("There was an error: " + (err.stack || err));
      } else {
        var timing = self._getTimingMicroseconds();
        var opsSec = ((bench.iterations / timing) * 1e6).toFixed(3);
        var mean = timing / bench.iterations;
        if(mean > 1e6) {
          mean = (mean / 1e6).toFixed(3) + " seconds";
        } else if(mean > 1e3) {
          mean = (mean / 1000).toFixed(3) + " ms";
        } else {
          mean = (mean).toFixed(3) + " microseconds";
        }
        console.log(bench.name + ': ' + opsSec +
          " ops/sec ("+bench.iterations+" iterations, mean "+  mean + ")");
      }
      done();
    });
  }, function(err) {
    console.log("Run complete");
    if(done) {
      done(err);
    } else if(err){
      console.error(err.stack || err);
    }
  });
};

Benchpress.prototype._runSyncOrAsync = function(foo, done) {
  async.setImmediate(function() {
    if(!foo) return done();
    if(foo.length === 0) {
      foo();
      done();
    } else {
      foo(done);
    }
  });
};

Benchpress.prototype.runBenchmark = function(bench, done) {
  var self = this;
  self._resetProfiler();
  async.series([
    function(done){
      self._runSyncOrAsync(bench.beforeAll, done);
    },
    function(done){
      async.timesLimit(bench.iterations, self.concurrency, function(n, done) {
        async.series([
          function(done) {
            self._runSyncOrAsync(bench.beforeEach, done);
          },
          function(done) {
            async.setImmediate(function() {
              if(!bench.fn) return done("Must provide a function to benchmark for test '" + bench.name + "'");
              if(bench.fn.length === 0) {
                self._startProfiler();
                bench.fn();
                self._stopProfiler();
                done();
              } else {
                self._startProfiler();
                bench.fn(function(err) {
                  self._stopProfiler();
                  bench.progress.tick(1);
                  done(err);
                });
              }
            });
          },
          function(done) {
            self._runSyncOrAsync(bench.afterEach, done);
          }
        ], done);
      }, done);
    },
    function(done){
      self._runSyncOrAsync(bench.afterAll, done);
    }
  ], done);
};


Benchpress.prototype.add = function(name, bench) {
  bench.name = name;
  bench.iterations = bench.iterations || this.iterations;
  this.benchmarks.push(bench);
  return this;
};


module.exports = Benchpress;
