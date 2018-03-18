const test = require('tape');
const reject = require('./readme');

const isEven = x => x % 2 === 0;
const TYPE = {
  FUNCTION: 'function',
  UNDEFINED: 'undefined',
  NUMBER: 'number'
};

test('it filters a pullable source', function (t) {
  t.plan(26);
  const upwardsExpected = [
    [0, TYPE.FUNCTION],
    [1, TYPE.UNDEFINED],
    [1, TYPE.UNDEFINED],
    [1, TYPE.UNDEFINED],
    [1, TYPE.UNDEFINED],
  ];
  const downwardsExpectedType = [
    [0, TYPE.FUNCTION],
    [1, TYPE.NUMBER],
    [1, TYPE.NUMBER],
    [2, TYPE.UNDEFINED],
  ];
  const downwardsExpected = [1, 3];

  function makeSource() {
    let sink;
    let sent = 0;
    return function source(type, data) {
      t.true(upwardsExpected.length > 0, 'source can be pulled');
      const e = upwardsExpected.shift();
      t.equals(type, e[0], 'upwards type is expected: ' + e[0]);
      t.equals(typeof data, e[1], 'upwards data is expected: ' + e[1]);

      if (type === 0) {
        sink = data;
        sink(0, source);
        return;
      }
      if (sent === 3) {
        sink(2);
        return;
      }
      if (sent === 0) {
        sent++;
        sink(1, 1);
        return;
      }
      if (sent === 1) {
        sent++;
        sink(1, 2);
        return;
      }
      if (sent === 2) {
        sent++;
        sink(1, 3);
        return;
      }
    };
  }

  function makeSink() {
    let ask;
    return function (type, data) {
      const et = downwardsExpectedType.shift();
      t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
      t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
      if (type === 0) {
        ask = data;
        ask(1);
        return;
      }
      if (type === 1) {
        const e = downwardsExpected.shift();
        t.equals(data, e, 'downwards data is expected: ' + e);
        return ask(1);
      }
    };
  }

  reject(isEven)(makeSource())(0, makeSink());

  setTimeout(function () {
    t.pass('nothing else happens');
    t.end();
  }, 300);
});

test('it filters an async finite listenable source', function (t) {
  t.plan(15);
  const upwardsExpected = [
    [0, TYPE.FUNCTION],
    [1, TYPE.UNDEFINED]
  ];
  const downwardsExpectedType = [
    [0, TYPE.FUNCTION],
    [1, TYPE.NUMBER],
    [1, TYPE.NUMBER],
    [2, TYPE.UNDEFINED],
  ];
  const downwardsExpected = [1, 3];

  function makeSource() {
    let sent = 0;
    return function source(type, data) {
      const e = upwardsExpected.shift();
      t.equals(type, e[0], 'upwards type is expected: ' + e[0]);
      t.equals(typeof data, e[1], 'upwards data is expected: ' + e[1]);
      if (type === 0) {
        const sink = data;
        const id = setInterval(function () {
          if (sent === 0) {
            sent++;
            sink(1, 1);
            return;
          }
          if (sent === 1) {
            sent++;
            sink(1, 2);
            return;
          }
          if (sent === 2) {
            sent++;
            sink(1, 3);
            return;
          }
          if (sent === 3) {
            sink(2);
            clearInterval(id);
            return;
          }
        }, 100);
        sink(0, source);
      }
    };
  }

  function sink(type, data) {
    const et = downwardsExpectedType.shift();
    t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
    if (type === 1) {
      const e = downwardsExpected.shift();
      t.equals(data, e, 'downwards data is expected: ' + e);
    }
  }

  reject(isEven)(makeSource())(0, sink);

  setTimeout(function () {
    t.pass('nothing else happens');
    t.end();
  }, 700);
});

test('it returns a source that disposes upon upwards END (2)', function (t) {
  t.plan(15);
  const upwardsExpected = [
    [0, TYPE.FUNCTION],
    [1, TYPE.UNDEFINED],
    [2, TYPE.UNDEFINED]
  ];
  const downwardsExpectedType = [
    [0, TYPE.FUNCTION],
    [1, TYPE.NUMBER],
    [1, TYPE.NUMBER],
    [1, TYPE.NUMBER]
  ];
  const downwardsExpected = [1, 3];

  function makeSource() {
    let sent = 0;
    let id;
    return function source(type, data) {
      const e = upwardsExpected.shift();
      t.equals(type, e[0], 'upwards type is expected: ' + e[0]);
      t.equals(typeof data, e[1], 'upwards data is expected: ' + e[1]);
      if (type === 0) {
        const sink = data;
        id = setInterval(function () {
          sink(1, ++sent);
        }, 100);
        sink(0, source);
      } else if (type === 2) {
        clearInterval(id);
      }
    };
  }

  function makeSink(type, data) {
    let ask;
    return function (type, data) {
      const et = downwardsExpectedType.shift();
      t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
      t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
      if (type === 0) {
        ask = data;
      }
      if (type === 1) {
        const e = downwardsExpected.shift();
        t.equals(data, e, 'downwards data is expected: ' + e);
      }
      if (downwardsExpected.length === 0) {
        ask(2);
      }
    };
  }

  reject(isEven)(makeSource())(0, makeSink());

  setTimeout(function () {
    t.pass('nothing else happens');
    t.end();
  }, 700);
});
