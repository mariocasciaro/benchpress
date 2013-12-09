
var async = require('async'),
  microtime = require('microtime');

function Benchpress(options) {
  options = options || {};
  this.benchmarks = [];
  this.iterations = options.iterations || 500;
  this._resetProfiler();
}

Benchpress.prototype.log = function(message) {
  process.stdout.write(message);
};

Benchpress.prototype.logln = function(message) {
  console.log(message);
};

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
  self.logln("Starting suite.");
  async.eachSeries(this.benchmarks, function(bench, done) {
    self.log("Benchmark '" + bench.name + "': ");
    async.nextTick(function() {
      self.runBenchpress(bench, function(err) {
        if(err) {
          self.logln("There was an error: " + (err.stack || err));
        } else {
          self.logln(Math.round(bench.iterations / self.timeAccumulator)  + " ops/sec ("+bench.iterations+" iterations)");
        }
        done();
      });
    });
  }, function(err) {
    self.log("Run complete");
    done(err);
  });
};


Benchpress.prototype.runBenchpress = function(bench, done) {
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
    },
  ], done);
};


Benchpress.prototype.add = function(name, bench) {
  bench.name = name;
  bench.iterations = bench.iterations || this.iterations;
  this.benchmarks.push(bench);
  return this;
};


module.exports = Benchpress;