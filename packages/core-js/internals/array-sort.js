'use strict';
var aFunction = require('../internals/a-function');
var toObject = require('../internals/to-object');
var toLength = require('../internals/to-length');
var fails = require('../internals/fails');
var arrayMethodIsStrict = require('../internals/array-method-is-strict');
var FF = require('../internals/engine-ff-version');
var IE_OR_EDGE = require('../internals/engine-is-ie-or-edge');
var V8 = require('../internals/engine-v8-version');
var WEBKIT = require('../internals/engine-webkit-version');

var test = [];
var nativeSort = test.sort;
var floor = Math.floor;

// IE8-
var FAILS_ON_UNDEFINED = fails(function () {
  test.sort(undefined);
});
// V8 bug
var FAILS_ON_NULL = fails(function () {
  test.sort(null);
});
// Old WebKit
var STRICT_METHOD = arrayMethodIsStrict('sort');

var STABLE_SORT = !fails(function () {
  // feature detection can be too slow, so check engines versions
  if (V8) return V8 < 70;
  if (FF && FF > 3) return;
  if (IE_OR_EDGE) return true;
  if (WEBKIT) return WEBKIT < 603;

  var result = '';
  var code, chr, value, index;

  // generate an array with more 512 elements (Chakra and old V8 fails only in this case)
  for (code = 65; code < 76; code++) {
    chr = String.fromCharCode(code);
    switch (code) {
      case 66: case 69: case 70: case 72: value = 3; break;
      case 68: case 71: value = 4; break;
      default: value = 2;
    }

    for (index = 0; index < 47; index++) {
      test.push({ k: chr + index, v: value });
    }
  }

  test.sort(function (a, b) { return b.v - a.v; });

  for (index = 0; index < test.length; index++) {
    chr = test[index].k.charAt(0);
    if (result.charAt(result.length - 1) !== chr) result += chr;
  }

  return result !== 'DGBEFHACIJK';
});

var FORCED = FAILS_ON_UNDEFINED || !FAILS_ON_NULL || !STRICT_METHOD || !STABLE_SORT;

var mergeSort = function (array, comparefn) {
  var length = array.length;
  var middle = floor(length / 2);
  return length < 8 ? insertionSort(array, comparefn) : merge(
    mergeSort(array.slice(0, middle), comparefn),
    mergeSort(array.slice(middle), comparefn),
    comparefn
  );
};

var insertionSort = function (array, comparefn) {
  var length = array.length;
  var i = 1;
  var element, j;

  while (i < length) {
    j = i;
    element = array[i];
    while (j && sortCompare(array[j - 1], element, comparefn) > 0) {
      array[j] = array[--j];
    }
    if (j !== i++) array[j] = element;
  } return array;
};

var merge = function (left, right, comparefn) {
  var llength = left.length;
  var rlength = right.length;
  var lindex = 0;
  var rindex = 0;
  var result = [];

  while (lindex < llength || rindex < rlength) {
    if (lindex < llength && rindex < rlength) {
      result.push(sortCompare(left[lindex], right[rindex], comparefn) <= 0 ? left[lindex++] : right[rindex++]);
    } else {
      result.push(lindex < llength ? left[lindex++] : right[rindex++]);
    }
  } return result;
};

var sortCompare = function (x, y, comparefn) {
  if (y === undefined) return -1;
  if (x === undefined) return 1;
  if (comparefn !== undefined) {
    return +comparefn(x, y) || 0;
  } return String(x) > String(y) ? 1 : -1;
};

// `Array.prototype.sort` method
// https://tc39.es/ecma262/#sec-array.prototype.sort
module.exports = FORCED ? function sort(comparefn) {
  if (comparefn !== undefined) aFunction(comparefn);

  var array = toObject(this);

  if (STABLE_SORT) return comparefn === undefined ? nativeSort.call(array) : nativeSort.call(array, comparefn);

  var items = [];
  var arrayLength = toLength(array.length);
  var itemsLength, index;

  for (index = 0; index < arrayLength; index++) {
    if (index in array) items.push(array[index]);
  }

  // TODO: use something more complex like timsort?
  items = mergeSort(items, comparefn);
  itemsLength = items.length;
  index = 0;

  while (index < itemsLength) array[index] = items[index++];
  while (index < arrayLength) delete array[index++];

  return array;
} : nativeSort;
