
var async = require('async'),
  ProgressBar = require('progress'),
  microtime = require('microtime');

function Benchpress(options) {
  options = options || {};
  this.benchmarks = [];
  this.iterations = options.iterations || 500;
  this._resetProfiler();
}

Benchpress.prototype._resetProfiler = function() {
  this.timeAccumulator = 0;
};

Benchpress.prototype._startProfiler = function() {
  this.lastTiming = microtime.nowDouble();
};

Benchpress.prototype._stopProfiler = function() {
  var now = microtime.nowDouble();
  this.timeAccumulator += (now - this.lastTiming);
};

Benchpress.prototype.run = function(done) {
  var self = this;
  
  console.log("Starting suite.");
  async.eachSeries(this.benchmarks, function(bench, done) {
    var bar = new ProgressBar("Running '" + bench.name + "' [:bar] :percent :etas ", {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: bench.iterations,
      clear: true
    });
    bench.progress = bar;
    self.runBenchmark(bench, function(err) {
      if(err) {
        console.log("There was an error: " + (err.stack || err));
      } else {
        console.log(bench.name + ': ' + Math.round(bench.iterations / self.timeAccumulator)  + 
          " ops/sec ("+bench.iterations+" iterations)");
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
              self._resetProfiler();
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