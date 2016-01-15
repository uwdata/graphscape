
// //To apply GNMD later, we have to collect quardraples
function enumerateSpecPairs(specs){
  var specPairs = [];
  for (var i = 0; i < specs.length; i++) {
    for (var j = i+1; j < specs.length; j++) {
      specPairs.push([specs[i], specs[j]]);
    };
  };
  return specPairs;
}

function runTripletComparating(specTriplets){

  var compairedDistances = [];
  var comparedResult = 0;


  for (var l = 0; l < specTriplets.length; l++) {
    comparedResult = specCompare(specTriplets[l][0],specTriplets[l][1],specTriplets[l][0],specTriplets[l][2]);


      // compairedDistances.push(comparedResult);

  };



  return compairedDistances;
}



function runComparating(specPairs){

  var compairedDistances = [];
  var compairedDistances_l = [];
  var comparedResult = 0;

  for (var l = 0; l < specPairs.length; l++) {
    compairedDistances_l = [];

    for (var r = l+1; r < specPairs.length; r++) {

      comparedResult = specCompare(specPairs[l][0],specPairs[l][1],specPairs[r][0],specPairs[r][1]);
      compairedDistances_l.push(comparedResult);
    };
    compairedDistances.push(compairedDistances_l);
  };

  return compairedDistances;
}

function specCompare(specL1, specL2, specR1, specR2) {
  var compareResult = 0;
  var ruleNum = 0;

  if (compareResult = rule1(specL1, specL2, specR1, specR2)) {
    ruleNum = 1;
  }
  else if (compareResult = rule2(specL1, specL2, specR1, specR2)) {
    ruleNum = 2;
  }
  else if (compareResult = rule3(specL1, specL2, specR1, specR2)) {
    ruleNum = 3;
  }
  else if (compareResult = rule4(specL1, specL2, specR1, specR2)) {
    ruleNum = 4;
  }
  else if (compareResult = rule5(specL1, specL2, specR1, specR2)) {
    ruleNum = 5;
  };

  return { "result" : compareResult, "reason": ruleNum };
}

//#1 rule
//When the number of different variables in mapping.
//+/- : 1, diff mapping :0.5
function rule1 (specL1, specL2, specR1, specR2) {

  var diffVarL = diffVarPoint(specL1,specL2);
  var diffVarR = diffVarPoint(specR1,specR2);

  if ( diffVarL < diffVarR)
    return 1;
  else if (diffVarL === diffVarR)
    return 0;
  else
    return -1;
}

function diffVarPoint(spec1, spec2){
  var point = 0;

  var totalFields = $.unique(spec1.fields.concat(spec2.fields));

  for (var i = 0; i < totalFields.length; i++) {
    // count # of the diff channels,
    var field = totalFields[i];
    if (spec1.fields.indexOf(field) < 0 || spec2.fields.indexOf(field) < 0 ) {
      point += 1.0;
    }
    // else if (spec1.mapping.f2ch[field.fieldName] !== spec2.mapping.f2ch[field.fieldName]) {
    //   point += 0.5;
    // };
  };
  return point;
}

//#2 rule
//When the pairs of specs have different marktypes
function rule2 (specL1, specL2, specR1, specR2) {


  var diffL = diffMarktypePoint(specL1,specL2);
  var diffR = diffMarktypePoint(specR1,specR2);

  if ( diffL < diffR)
    return 1;
  else if (diffL === diffR)
    return 0;
  else
    return -1;
}

function diffMarktypePoint (spec1, spec2){

  var marktypes;
  if (spec1.marktype === spec2.marktype)
    return 0;
  else {
    marktypes = [spec1.marktype, spec2.marktype];
    if( marktypes.indexOf('area') >= 0 ){
      if ( marktypes.indexOf('line') >= 0 )
        return 3;
      else if (marktypes.indexOf('bar') >= 0)
        return 6;
      else if (marktypes.indexOf('point') >= 0)
        return 10;
    }
    else if (marktypes.indexOf('bar') >= 0) {
      if (marktypes.indexOf('line') >= 0)
        return 8;
      else if (marktypes.indexOf('point') >= 0)
        return 8;
    }
    else if (marktypes.indexOf('line') >= 0){
      if (marktypes.indexOf('point') >= 0)
        return 5;
    }
  }

}

//#3 Channel
//When the pairs of specs have different channels
function rule3 (specL1, specL2, specR1, specR2) {


  var diffL = diffChannelPoint(specL1,specL2);
  var diffR = diffChannelPoint(specR1,specR2);

  if ( diffL < diffR)
    return 1;
  else if (diffL === diffR)
    return 0;
  else
    return -1;
}

function diffChannelPoint (spec1, spec2){
  var diffPoint = 0;
  var union = $.unique(spec1.channels.concat(spec2.channels));
  for (var i = 0; i < union.length; i++) {
    if(spec1.channels.indexOf(union[i]) < 0 || spec2.channels.indexOf(union[i]) < 0){
      diffPoint += 1;
    }

  };
  return diffPoint;
}



//#4 Swap
//When the pairs of specs have the same channels but different mappings.
function rule4 (specL1, specL2, specR1, specR2) {


  var diffL = diffMappingPoint(specL1,specL2);
  var diffR = diffMappingPoint(specR1,specR2);

  if ( diffL < diffR)
    return 1;
  else if (diffL === diffR)
    return 0;
  else
    return -1;
}

function diffMappingPoint (spec1, spec2){
  var diffPoint = 0;
  var union = $.unique(spec1.channels.concat(spec2.channels));
  for (var i = 0; i < union.length; i++) {
    if(spec1.channels.indexOf(union[i]) >= 0 && spec2.channels.indexOf(union[i]) >= 0){
      if (spec1.mapping.ch2f[union[i]] !== spec2.mapping.ch2f[union[i]]) {
        diffPoint += 1;
      };
    }

  };
  return diffPoint;
}

//#5 Properties
//When the pairs of specs have the different properties
function rule5 (specL1, specL2, specR1, specR2) {


  var diffL = diffPropPoint(specL1,specL2);
  var diffR = diffPropPoint(specR1,specR2);

  if ( diffL < diffR)
    return 1;
  else if (diffL === diffR)
    return 0;
  else
    return -1;
}

function diffPropPoint (spec1, spec2){
  var diffPoint = 0;
  var union = $.unique(spec1.channelProperties.concat(spec2.channelProperties));

  for (var i = 0; i < union.length; i++) {
    if(spec1.channelProperties.indexOf(union[i]) < 0 || spec2.channelProperties.indexOf(union[i]) < 0){
        diffPoint += 1;
    }
  };

  return diffPoint;
}



