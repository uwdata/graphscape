function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function unique(array){
  return array.filter(onlyUnique);
}


function specCompare(specL1, specL2, specR1, specR2) {
  var comparedResult = 0;
  var suedoDistanceL = [];
  var suedoDistanceR = [];
  var weights = [10000,1000,100,10,1];
  var totalDistanceL = 0, totalDistanceR =0;

  suedoDistanceL.push(diffVarPoint(specL1,specL2));
  suedoDistanceL.push(diffMarktypePoint(specL1,specL2));
  suedoDistanceL.push(diffChannelPoint(specL1,specL2));
  suedoDistanceL.push(diffMappingPoint(specL1,specL2));
  suedoDistanceL.push(diffPropPoint(specL1,specL2));

  suedoDistanceR.push(diffVarPoint(specR1,specR2));
  suedoDistanceR.push(diffMarktypePoint(specR1,specR2));
  suedoDistanceR.push(diffChannelPoint(specR1,specR2));
  suedoDistanceR.push(diffMappingPoint(specR1,specR2));
  suedoDistanceR.push(diffPropPoint(specR1,specR2));

  for (var i = 0; i < weights.length; i++) {
    totalDistanceL += weights[i] * suedoDistanceL[i];
    totalDistanceR += weights[i] * suedoDistanceR[i];
  };

  if(totalDistanceL < totalDistanceR)
    comparedResult = 1;
  else if (totalDistanceL > totalDistanceR )
    comparedResult = -1;
  else
    comparedResult = 0;

  return comparedResult;
}



function diffVarPoint(spec1, spec2){
  var point = 0;

  var totalFields = unique(spec1.fields.concat(spec2.fields));

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



function diffMarktypePoint (spec1, spec2){

  var marktypes;
  if (spec1.marktype === spec2.marktype)
    return 0;
  else {
    marktypes = [spec1.marktype, spec2.marktype];
    if( marktypes.indexOf('area') >= 0 ){
      if ( marktypes.indexOf('line') >= 0 )
        return 1;
      else if (marktypes.indexOf('bar') >= 0)
        return 3;
      else if (marktypes.indexOf('point') >= 0)
        return 5;
    }
    else if (marktypes.indexOf('bar') >= 0) {
      if (marktypes.indexOf('line') >= 0)
        return 4;
      else if (marktypes.indexOf('point') >= 0)
        return 4;
    }
    else if (marktypes.indexOf('line') >= 0){
      if (marktypes.indexOf('point') >= 0)
        return 2;
    }
  }

}


function diffChannelPoint (spec1, spec2){
  var diffPoint = 0;
  var union = unique(spec1.channels.concat(spec2.channels));
  for (var i = 0; i < union.length; i++) {
    if(spec1.channels.indexOf(union[i]) < 0 || spec2.channels.indexOf(union[i]) < 0){
      diffPoint += 1;
    }

  };
  return diffPoint;
}




function diffMappingPoint (spec1, spec2){
  var diffPoint = 0;
  var union = unique(spec1.channels.concat(spec2.channels));
  for (var i = 0; i < union.length; i++) {
    if(spec1.channels.indexOf(union[i]) >= 0 && spec2.channels.indexOf(union[i]) >= 0){
      if (spec1.mapping.ch2f[union[i]] !== spec2.mapping.ch2f[union[i]]) {
        if (spec1.mapping.f2ch[spec2.mapping.ch2f[union[i]]] === spec2.mapping.f2ch[spec1.mapping.ch2f[union[i]]])
          diffPoint += 0.5;
        else
          diffPoint += 1.0;

      }
    }

  }
  return diffPoint;
}


function diffPropPoint (spec1, spec2){
  var diffPoint = 0;
  var union = unique(spec1.channelProperties.concat(spec2.channelProperties));

  for (var i = 0; i < union.length; i++) {
    if(spec1.channelProperties.indexOf(union[i]) < 0 || spec2.channelProperties.indexOf(union[i]) < 0){
        diffPoint += 1;
    }
  };

  return diffPoint;
}



function compare(ref, left, right){
  return specCompare(ref,left,ref,right);
}