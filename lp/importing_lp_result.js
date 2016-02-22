function keys(obj) {
  var k = [], x;
  for (x in obj) {
    k.push(x);
  }
  return k;
};

//Generated from lp_yh01.m
var costs = [ 0.0300, 0.0200, 0.0400, 0.0800, 0.0400, 0.0400, 0.0200, 0.0700, 0.0200, 0.0300, 0.0600, 0.0300, 0.0500, 0.0100, 0.0500, 0.6000, 0.6100, 0.6200, 0.6300, 0.6400, 0.6500, 3.9200, 3.9200, 3.8600, 3.9000, 3.8800, 3.9100, 3.9100, 3.8500, 3.8900, 3.8700, 3.8300, 3.8300, 3.8100, 3.7700, 3.7900, 3.8400, 3.8400, 3.8200, 3.7800, 3.8000, 3.7800, 3.7800, 3.9500, 3.7800, 3.7800, 3.7700, 3.7700, 3.9400, 3.7700, 3.7700, 3.7600, 3.7600, 3.9300, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600, 3.7600]
//Generated from lp_yh01.js
var map = { AREA_BAR: 0,
  AREA_LINE: 1,
  AREA_POINT: 2,
  AREA_TEXT: 3,
  AREA_TICK: 4,
  BAR_LINE: 5,
  BAR_POINT: 6,
  BAR_TEXT: 7,
  BAR_TICK: 8,
  LINE_POINT: 9,
  LINE_TEXT: 10,
  LINE_TICK: 11,
  POINT_TEXT: 12,
  POINT_TICK: 13,
  TEXT_TICK: 14,
  SCALE: 15,
  SORT: 16,
  BIN: 17,
  AGGREGATE: 18,
  FILTER: 19,
  SETTYPE: 20,
  ADD_X: 21,
  ADD_Y: 22,
  ADD_COLOR: 23,
  ADD_SHAPE: 24,
  ADD_SIZE: 25,
  ADD_X_COUNT: 26,
  ADD_Y_COUNT: 27,
  ADD_COLOR_COUNT: 28,
  ADD_SHAPE_COUNT: 29,
  ADD_SIZE_COUNT: 30,
  REMOVE_X_COUNT: 31,
  REMOVE_Y_COUNT: 32,
  REMOVE_COLOR_COUNT: 33,
  REMOVE_SHAPE_COUNT: 34,
  REMOVE_SIZE_COUNT: 35,
  REMOVE_X: 36,
  REMOVE_Y: 37,
  REMOVE_COLOR: 38,
  REMOVE_SHAPE: 39,
  REMOVE_SIZE: 40,
  MODIFY_X: 41,
  MODIFY_Y: 42,
  MODIFY_COLOR: 43,
  MODIFY_SHAPE: 44,
  MODIFY_SIZE: 45,
  MODIFY_X_ADD_COUNT: 46,
  MODIFY_Y_ADD_COUNT: 47,
  MODIFY_COLOR_ADD_COUNT: 48,
  MODIFY_SHAPE_ADD_COUNT: 49,
  MODIFY_SIZE_ADD_COUNT: 50,
  MODIFY_X_REMOVE_COUNT: 51,
  MODIFY_Y_REMOVE_COUNT: 52,
  MODIFY_COLOR_REMOVE_COUNT: 53,
  MODIFY_SHAPE_REMOVE_COUNT: 54,
  MODIFY_SIZE_REMOVE_COUNT: 55,
  MOVE_X_SIZE: 56,
  MOVE_X_SHAPE: 57,
  MOVE_X_COLOR: 58,
  MOVE_X_Y: 59,
  MOVE_Y_SIZE: 60,
  MOVE_Y_SHAPE: 61,
  MOVE_Y_COLOR: 62,
  MOVE_Y_X: 63,
  MOVE_COLOR_SIZE: 64,
  MOVE_COLOR_SHAPE: 65,
  MOVE_COLOR_Y: 66,
  MOVE_COLOR_X: 67,
  MOVE_SHAPE_SIZE: 68,
  MOVE_SHAPE_COLOR: 69,
  MOVE_SHAPE_Y: 70,
  MOVE_SHAPE_X: 71,
  MOVE_SIZE_SHAPE: 72,
  MOVE_SIZE_COLOR: 73,
  MOVE_SIZE_Y: 74,
  MOVE_SIZE_X: 75,
  SWAP_X_Y: 76 };

//Imports the lp result
var ruleNames = keys(map);
var importedMarktypeTransitions = {};
var importedTransformTransitions = {};
var importedEncodingTransitions = {};
for (var i = 0; i < ruleNames.length; i++) {
  if ( i <= 14 ) {
    importedMarktypeTransitions[ruleNames[i]] = { name: ruleNames[i], cost: costs[i] };
  }
  else if( i <= 20 ){
    importedTransformTransitions[ruleNames[i]] = { name: ruleNames[i], cost: costs[i] };
  }
  else{
    importedEncodingTransitions[ruleNames[i]] = { name: ruleNames[i], cost: costs[i] };
  }
};
console.log("---MAKRTYPE_TRANSITIONS--------------------------");
console.log(importedMarktypeTransitions);
console.log("---TRANSFORM_TRANSITIONS-------------------------");
console.log(importedTransformTransitions);
console.log("---ENCODING_TRANSITIONS--------------------------");
console.log(importedEncodingTransitions);