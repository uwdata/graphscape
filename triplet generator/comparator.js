var utils = require('./utils');
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

function runTripletComparating( specTriplets, options){
  options = options !== undefined ? options : {streaming: false};
  console.log('Comparating triplets...');

  var compairedDistances = [];
  var comparedResult = { "result" : 0, "reason": 0 };

  var buffer = '';
  if (options.streaming){
    wstream = options.fs.createWriteStream(options.filePath, options.streamOption );
    wstream.write('\[');
  }
  for (var i = 0; i < 1000; i++) {
    var range_i = Math.floor(specTriplets.length*i/1000);
    var range_f = Math.min(range_i+Math.floor(specTriplets.length/1000), specTriplets.length);
    console.log(range_i, range_f);

    for (var l = range_i; l < range_f; l++) {
      comparedResult = specCompare(specTriplets[l][0],specTriplets[l][1],specTriplets[l][0],specTriplets[l][2]);

      if ( options.streaming ){
        buffer += JSON.stringify(comparedResult) + ',\n';
      }
      else if( options.db ) {
        options.db.parallelize(function(){
          var stmt = options.db.prepare("UPDATE TABLE "+ options.tables[0].name + " SET " + options.tables[0].columns[2] + " = ? WHERE id = ?");
          stmt.run(JSON.stringify(comparedResult, l ));
          stmt.finalize();
        });
      }
      else{
        // compairedDistances.push(comparedResult);
      }

    };
    if (options.streaming){
      wstream.write(buffer);
      buffer = "";
      console.log(process.memoryUsage());
    }
  };
  if (options.streaming){
    wstream.write(']');
    wstream.end();
  }

  console.log('Done!');

  return compairedDistances;
}

function runTripletComparatingDB( options){
  options = options !== undefined ? options : {streaming: false};
  console.log('Comparating triplets...');

  var comparedResult = { "result" : 0, "reason": 0 };
  options.db.parallelize(function(){
    options.db.each("SELECT * FROM " + options.tables[0].name, function(err, row) {
      var triplet = JSON.parse(row.triplet);

      comparedResult = specCompare(triplet[0],triplet[1],triplet[0],triplet[2]);

      var stmt = options.db.prepare("UPDATE "+ options.tables[0].name + " SET " + options.tables[0].columns[2] + " = ? WHERE id = ?");
      stmt.run(JSON.stringify(comparedResult.result), row.id );
      stmt.finalize();
    });
  });


  console.log('Done!');

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

  return { "result" : comparedResult, "reason": [suedoDistanceL,suedoDistanceR] };
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
  var spec1Fields = spec1.fields.map(function(field){
    return field.fieldName;
  });
  var spec2Fields = spec2.fields.map(function(field){
    return field.fieldName;
  })

  var totalFields = utils.unique(spec1Fields.concat(spec2Fields));

  for (var i = 0; i < totalFields.length; i++) {
    // count # of the diff channels,
    var field = totalFields[i];
    if (spec1Fields.indexOf(field) < 0 || spec2Fields.indexOf(field) < 0 ) {
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
  var union = utils.unique(spec1.channels.concat(spec2.channels));
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
  var union = utils.unique(spec1.channels.concat(spec2.channels));
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
  var spec1Props = spec1.channelProperties.map(function(prop){
    return JSON.stringify(prop);
  });
  var spec2Props = spec2.channelProperties.map(function(prop){
    return JSON.stringify(prop);
  })

  var union = utils.unique(spec1Props.concat(spec2Props));

  for (var i = 0; i < union.length; i++) {
    if(spec1Props.indexOf(union[i]) < 0 || spec2Props.indexOf(union[i]) < 0){
        diffPoint += 1;
    }
  };

  return diffPoint;
}





module.exports = {
  runTripletComparating: runTripletComparating,
  runTripletComparatingDB: runTripletComparatingDB,
  diffVarPoint: diffVarPoint,
  diffChannelPoint: diffChannelPoint,
  diffMappingPoint: diffMappingPoint,
  specCompare: specCompare
};










