/**
 * callbag-reject
 * -----------
 *
 * Callbag operator that rejects all source items that satisfy a predicate function.
 * Works on either pullable or listenable sources.
 *
 * `npm install callbag-reject`
 *
 * Example:
 *
 *     const forEach = require('callbag-for-each');
 *     const fromIter = require('callbag-from-iter');
 *     const pipe = require('callbag-pipe');
 *     const reject = require('callbag-reject'); 
 * 
 *     const isEven = n => n % 2 === 0;
 *
 *     pipe(
 *       fromIter([1, 2, 3, 4]),
 *       reject(isEven),
 *       forEach(console.log) // 1, 3
 *     );
 */

const reject = r => source => (start, sink) => {
  let ask;
  start === 0 && source(start, (t, d) => {
    if (t === start) {
      ask = d;
    }
    if (t === 1) {
      try {
        r(d) ? ask(t) : sink(t, d);
      } catch (e) {
        sink(2, e);
      }
      return;
    }
    sink(t, d);
  });
};

module.exports = reject;
