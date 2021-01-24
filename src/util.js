"use strict";
exports.isArray = Array.isArray || function (obj) {
  return {}.toString.call(obj) === '[object Array]';
};
function isString(item) {
  return typeof item === 'string' || item instanceof String;
}
exports.isString = isString;
function isin(item, array) {
  return array.indexOf(item) !== -1;
}
exports.isin = isin;

function json(s, sp) {
  return JSON.stringify(s, null, sp);
}
exports.json = json;

function keys(obj) {
  var k = [], x;
  for (x in obj) {
    k.push(x);
  }
  return k;
}
exports.keys = keys;

function duplicate(obj) {
  if (obj === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(obj));
}
exports.duplicate = duplicate;
exports.copy = duplicate;

function forEach(obj, f, thisArg) {
  if (obj.forEach) {
    obj.forEach.call(thisArg, f);
  }
  else {
    for (var k in obj) {
      f.call(thisArg, obj[k], k, obj);
    }
  }
}
exports.forEach = forEach;

function any(arr, f) {
  var i = 0, k;
  for (k in arr) {
    if (f(arr[k], k, i++)) {
      return true;
    }
  }
  return false;
}
exports.any = any;

function nestedMap(collection, f, level, filter) {
  return level === 0 ?
    collection.map(f) :
    collection.map(function (v) {
      var r = nestedMap(v, f, level - 1);
      return filter ? r.filter(nonEmpty) : r;
    });
}
exports.nestedMap = nestedMap;

function nestedReduce(collection, f, level, filter) {
  return level === 0 ?
    collection.reduce(f, []) :
    collection.map(function (v) {
      var r = nestedReduce(v, f, level - 1);
      return filter ? r.filter(nonEmpty) : r;
    });
}
exports.nestedReduce = nestedReduce;

function nonEmpty(grp) {
  return !exports.isArray(grp) || grp.length > 0;
}
exports.nonEmpty = nonEmpty;

function traverse(node, arr) {
  if (node.value !== undefined) {
    arr.push(node.value);
  }
  else {
    if (node.left) {
      traverse(node.left, arr);
    }
    if (node.right) {
      traverse(node.right, arr);
    }
  }
  return arr;
}
exports.traverse = traverse;

function extend(obj, b) {
  var rest = [];
  for (var _i = 2; _i < arguments.length; _i++) {
    rest[_i - 2] = arguments[_i];
  }
  for (var x, name, i = 1, len = arguments.length; i < len; ++i) {
    x = arguments[i];
    for (name in x) {
      obj[name] = x[name];
    }
  }
  return obj;
}
exports.extend = extend;

function union(arr1, arr2, accessor = (d) => d) {
  let result = [...arr1];
  return result.concat(
      arr2.filter(x => !arr1.find(y => accessor(x) === accessor(y)))
    );
}
exports.union = union;

var gen;
(function (gen) {
  function getOpt(opt) {
    return (opt ? keys(opt) : []).reduce(function (c, k) {
      c[k] = opt[k];
      return c;
    }, Object.create({}));
  }
  gen.getOpt = getOpt;
  ;
})(gen = exports.gen || (exports.gen = {}));
function powerset(list) {
  var ps = [
    []
  ];
  for (var i = 0; i < list.length; i++) {
    for (var j = 0, len = ps.length; j < len; j++) {
      ps.push(ps[j].concat(list[i]));
    }
  }
  return ps;
}
exports.powerset = powerset;

function chooseKorLess(list, k) {
  var subset = [[]];
  for (var i = 0; i < list.length; i++) {
    for (var j = 0, len = subset.length; j < len; j++) {
      var sub = subset[j].concat(list[i]);
      if (sub.length <= k) {
        subset.push(sub);
      }
    }
  }
  return subset;
}
exports.chooseKorLess = chooseKorLess;

function chooseK(list, k) {
  var subset = [[]];
  var kArray = [];
  for (var i = 0; i < list.length; i++) {
    for (var j = 0, len = subset.length; j < len; j++) {
      var sub = subset[j].concat(list[i]);
      if (sub.length < k) {
        subset.push(sub);
      }
      else if (sub.length === k) {
        kArray.push(sub);
      }
    }
  }
  return kArray;
}
exports.chooseK = chooseK;

function cross(a, b) {
  var x = [];
  for (var i = 0; i < a.length; i++) {
    for (var j = 0; j < b.length; j++) {
      x.push(a[i].concat(b[j]));
    }
  }
  return x;
}
exports.cross = cross;

function find(array, f, obj) {
  for (var i = 0; i < array.length; i += 1) {
    if (f(obj) === f(array[i])) {
      return i;
    }
  }
  return -1;
}
exports.find = find;
function rawEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
exports.rawEqual = rawEqual;
function arrayDiff(a, b, f) {
  return a.filter(function (x) {
    if (!f) {
      return b.findIndex(y => deepEqual(x,y)) < 0;
    }
    else
      return find(b, f, x) < 0;
  });
}
exports.arrayDiff = arrayDiff;
function unionObjectArray(a, b, f) {
  return arrayDiff(a, b, f).concat(b);
}
exports.unionObjectArray = unionObjectArray;

function deepEqual(obj1, obj2) {
  if (obj1 === obj2) {
    return true;
  }
  if (isDate(obj1) && isDate(obj2)) {
    return Number(obj1) === Number(obj2);
  }
  if (
    typeof obj1 === "object" &&
    obj1 !== undefined &&
    typeof obj2 === "object" &&
    obj2 !== undefined
  ) {
    const props1 = Object.keys(obj1);
    const props2 = Object.keys(obj2);
    if (props1.length !== props2.length) {
      return false;
    }

    for (let i = 0; i < props1.length; i++) {
      const prop = props1[i];

      if (!Object.prototype.hasOwnProperty.call(obj2, prop) || !deepEqual(obj1[prop], obj2[prop])) {
        return false;
      }
    }
    return true;
  }
  return false;
}
exports.deepEqual = deepEqual;


function isDate(o) {
  return o !== undefined && typeof o.getMonth === "function";
}

// partitioning the array into N_p arrays
function partition(arr, N_p) {
  if (arr.length === N_p) {
    return [arr.map(item => [item])]
  } else if (N_p === 1) {
    return [[arr]]
  } else if (N_p > arr.length) {
    throw new Error(`Cannot partition the array of ${arr.length} into ${N_p}.`);
  } else if (arr.length === 0) {
    return;
  }
  let item = [arr[0]];
  let newArr = arr.slice(1);
  let results =  partition(newArr, N_p - 1).map(pt => {
    let newPt = duplicate(pt);
    newPt.push(item)
    return newPt
  });
  return partition(newArr, N_p).reduce((results, currPt) => {

    return results.concat(currPt.map((p, i, currPt) => {
      let newPt = duplicate(currPt);
      let newP = duplicate(p);
      newP.push(item[0]);
      newPt[i] = newP;
      return newPt;
    }));
  }, results)
}
exports.partition = partition;

function permutate(arr) {
  if (arr.length === 2) {
    return [arr, [arr[1], arr[0]]];
  }
  return arr.reduce((acc, anchor, i) => {
    const workingArr = duplicate(arr);
    workingArr.splice(i, 1);

    acc = acc.concat(
      permutate(workingArr).map(newArr => {
        return [anchor].concat(newArr);
      })
    );
    return acc;
  }, []);
}
exports.permutate = permutate;

function intersection(arr1, arr2, accessor = (d) => d) {
  return arr2.filter(x => arr1.find(y => accessor(x) === accessor(y)))
}
exports.intersection = intersection



//# sourceMappingURL=util.js.map