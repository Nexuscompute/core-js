const { create } = Object;

QUnit.test('AsyncIterator#@@asyncDispose', assert => {
  assert.expect(7);

  const asyncDispose = AsyncIterator.prototype[Symbol.asyncDispose];
  assert.isFunction(asyncDispose);
  assert.arity(asyncDispose, 0);
  assert.looksNative(asyncDispose);

  create(AsyncIterator.prototype)[Symbol.asyncDispose]().then(result => {
    assert.same(result, undefined);
  });

  let called = false;
  const iterator2 = create(AsyncIterator.prototype);
  iterator2.return = function () {
    called = true;
    assert.same(this, iterator2);
    return 7;
  };
  iterator2[Symbol.asyncDispose]().then(result => {
    assert.same(result, undefined);
    assert.true(called);
  });
});
