var fs = require('fs');
var models = require('./models');

function generateVLFWithCompass( options ){
  var cp = require('./../bower_components/viscompass/compass');
  var dl = require('./../bower_components/datalib/datalib');
  var genScales = require('./../bower_components/viscompass/src/gen/scales').default;

  var fieldDefs = options.fieldList.map(function(field){
    return { "field": field.fieldName, "type": field.fieldType };
  });

  var stats = options.stats;
  if(!stats){
    stats = models.fakeStats(options.fieldList);
  }

  var fieldSets = cp.gen.projections(fieldDefs, stats, options.projections)
    .reduce(function(fieldSets, fieldSet) {
      return cp.gen.aggregates(fieldSets, fieldSet, stats, {});
    }, [])
    .reduce(function(fieldSets, fieldSet) {
      return genScales(fieldSets, fieldSet, options.scales);
    }, [])
    .reduce(function(fieldSets, fieldSet) {
      return cp.gen.specs(fieldSets, fieldSet, stats, options.compassSpecs);
    }, []);



  var vlfs = fieldSets.map(function(spec){
    var vlf = models.vl2vlf(spec);
    return vlf;
  });
  console.log(vlfs.length);
  console.log("Now, prunning redundant VegaLiteFeatures based on abstract...");

  var filteredVlfs = [];
  for (var i = 0; i < vlfs.length; i++) {

    for (var j = 0; j < filteredVlfs.length; j++) {
      if (filteredVlfs[j].abstEqual(vlfs[i], options.compassSpecs.channelList, options.propertyList)) {
        break;
      };
    }
    if (j === filteredVlfs.length) {
      filteredVlfs.push(vlfs[i])
    };

    if (i % Math.ceil(vlfs.length / 10) === 0 ) {
      process.stdout.write("#");
    };

  }

  console.log("\nNow, remmaping...");
  vlfs = models.remap(filteredVlfs, options.fieldList);


  return vlfs.map(function(vlf){
    return vlf;
  });
}



module.exports = {
  generateVLFWithCompass : generateVLFWithCompass,
};
