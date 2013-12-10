
var async = require('async'),
  ProgressBar = require('progress');

function Benchpress(options) {
  options = options || {};
  this.benchmarks = [];
  this.iterations = options.iterations || 500;
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
        var opsSec = Math.round((bench.iterations / timing) * 1e6);
        var mean = timing / bench.iterations;
        if(mean > 1e6) {
          mean = Math.round(mean / 1e6) + " seconds";
        } else if(mean > 1e3) {
          mean = Math.round(mean / 1000) + " ms";
        } else {
          mean = Math.round(mean) + " microseconds";
        }
        console.log(bench.name + ': ' + opsSec + 
          " ops/sec ("+bench.iterations+" iterations, mean "+  mean + ")");
      }
      done();
    });
  }, function(err) {
    console.log("Run complete");
    done(err);
  });
};


Benchpress.prototype.runBenchmark = function(bench, done) {
  var self = this;
  self._resetProfiler();
  
  async.series([
    function(done){
      if(!bench.beforeAll) return done();
      if(bench.beforeAll.length === 0) {
        bench.beforeAll();
        done();
      } else {
        bench.beforeAll(done);
      }
    },
    function(done){
      async.timesSeries(bench.iterations, function(n, done) {
        async.setImmediate(function() {
          async.series([
            function(done) {
              if(!bench.beforeEach) return done();
              if(bench.beforeEach.length === 0) {
                bench.beforeEach();
                done();
              } else {
                bench.beforeEach(done);
              }
            },
            function(done) {
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
            },
            function(done) {
              if(!bench.afterEach) return done();
              if(bench.afterEach.length === 0) {
                bench.afterEach();
                done();
              } else {
                bench.afterEach(done);
              }
            }
          ], done);
        });
      }, done);
    },
    function(done){
      if(!bench.afterAll) return done();
      if(bench.afterAll.length === 0) {
        bench.afterAll();
        done();
      } else {
        bench.afterAll(done);
      }
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