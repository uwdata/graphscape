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
    ruleSet.encodingTransitions[ruleNames[i]] = { name: ruleNames[i], cost: costs[i] };
  }
};


fs.writeFileSync('ruleSet.json', JSON.stringify(ruleSet));
