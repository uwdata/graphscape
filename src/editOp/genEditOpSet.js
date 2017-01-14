const fs = require('fs');
function keys(obj) {
  var k = [], x;
  for (x in obj) {
    k.push(x);
  }
  return k;
};

// Generated from lp_yh01.m
var costs = JSON.parse(fs.readFileSync('costs.json','utf8'));
//Generated from lp_yh01.js
var map = JSON.parse(fs.readFileSync('idMap.json','utf8'));
var encodingCeiling = JSON.parse(fs.readFileSync('encodingCeiling.json','utf8'));


var maxEncodingCost = 0;
//Imports the lp result
var editOpNames = keys(map);
var editOpSet = {
                markEditOps: {},
                transformEditOps: {},
                encodingEditOps: {}
              };

for (var i = 0; i < editOpNames.length; i++) {
  if ( i <= 14 ) {
    editOpSet.markEditOps[editOpNames[i]] = { name: editOpNames[i], cost: costs[i] };
  }
  else if( i <= 21 ){
    editOpSet.transformEditOps[editOpNames[i]] = { name: editOpNames[i], cost: costs[i] };
  }
  else{
    if (maxEncodingCost < costs[i] ) {
      maxEncodingCost = costs[i];
    }
    editOpSet.encodingEditOps[editOpNames[i]] = { name: editOpNames[i], cost: costs[i] };
  }
};

editOpSet.encodingEditOps['ceiling'] = {
  cost: maxEncodingCost * encodingCeiling.depth,
  alternatingCost: maxEncodingCost * ( encodingCeiling.depth + 1 )
};
// for (var i = 0; i < encodingExceptions.length; i++) {
//   editOpSet.encodingEditOps[encodingExceptions[i].name] = encodingExceptions[i];
// };


fs.writeFileSync('editOpSet.js', 'exports.DEFAULT_EDIT_OPS = ' + JSON.stringify(editOpSet));

