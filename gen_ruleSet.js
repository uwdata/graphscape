const fs = require('fs');
function keys(obj) {
  var k = [], x;
  for (x in obj) {
    k.push(x);
  }
  return k;
};

// Generated from lp_yh01.m
var costs = JSON.parse(fs.readFileSync('temp/costs.json','utf8'));
//Generated from lp_yh01.js
var map = JSON.parse(fs.readFileSync('temp/idMap.json','utf8'));
var encodingCeiling = JSON.parse(fs.readFileSync('temp/encodingCeiling.json','utf8'));
var maxEncodingCost = 0;
//Imports the lp result
var ruleNames = keys(map);
var ruleSet = {
                marktypeTransitions: {},
                transformTransitions: {},
                encodingTransitions: {}
              };

for (var i = 0; i < ruleNames.length; i++) {
  if ( i <= 14 ) {
    ruleSet.marktypeTransitions[ruleNames[i]] = { name: ruleNames[i], cost: costs[i] };
  }
  else if( i <= 20 ){
    ruleSet.transformTransitions[ruleNames[i]] = { name: ruleNames[i], cost: costs[i] };
  }
  else{
    if (maxEncodingCost < costs[i] ) {
      maxEncodingCost = costs[i];
    }
    ruleSet.encodingTransitions[ruleNames[i]] = { name: ruleNames[i], cost: costs[i] };
  }
};

ruleSet.encodingTransitions['ceiling'] = {
  cost: maxEncodingCost * encodingCeiling.depth,
  alternatingCost: maxEncodingCost * ( encodingCeiling.depth + 1 )
};
fs.writeFileSync('ruleSet.json', JSON.stringify(ruleSet));
