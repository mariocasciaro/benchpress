var expect = require('chai').expect,
  Benchpress = require('./');

describe('fn', function() {
  it('should be executed the specified number of times', function(done) {
    var b = new Benchpress({iterations: 10});
    var times = 0;
    b
      .add('test', {
        fn: function() {
          times++;
        }
      })
      .run(function() {
        expect(times).to.be.equal(10);
        done();
      });
  });

  it('should be executed the specified number of times (async)', function(done) {
    var b = new Benchpress({iterations: 10});
    var times = 0;
    b
      .add('test', {
        fn: function(done) {
          times++;
          done();
        }
      })
      .run(function() {
        expect(times).to.be.equal(10);
        done();
      });
  });
});


describe('beforeAll/afterAll/beforeEach/afterEach', function() {
  it('should be executed in the right order and right number of times', function(done) {
    var b = new Benchpress({iterations: 3});
    var times = {
      beforeAll: 0,
      beforeEach: 0,
      fn: 0,
      afterEach: 0,
      afterAll: 0
    };
    
    var lastExecuted  = "none";
    b
      .add('test', {
        beforeAll: function() {
          expect(lastExecuted).equal('none');
          lastExecuted = "beforeAll";
          times.beforeAll++;
        },
        beforeEach: function() {
          if(times.fn === 0) {
            expect(lastExecuted).equal("beforeAll");
          } else {
            expect(lastExecuted).equal('afterEach');
          }
          lastExecuted = "beforeEach";
          times.beforeEach++;
        },
        fn: function() {
          expect(lastExecuted).equal("beforeEach");
          lastExecuted = "fn";
          times.fn++;
        },
        afterEach: function() {
          expect(lastExecuted).equal("fn");
          lastExecuted = "afterEach";
          times.afterEach++;
        },
        afterAll: function() {
          expect(lastExecuted).equal("afterEach");
          lastExecuted = "afterAll";
          times.afterAll++;
        }
      })
      .run(function() {
        expect(times.beforeAll).to.be.equal(1);
        expect(times.beforeEach).to.be.equal(3);
        expect(times.fn).to.be.equal(3);
        expect(times.afterEach).to.be.equal(3);
        expect(times.afterAll).to.be.equal(1);
        expect(lastExecuted).to.be.equal("afterAll");
        done();
      });
  });
});