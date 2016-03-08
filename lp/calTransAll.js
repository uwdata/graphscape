var models = require('./../triplet\ generator/models');
var enumerater = require('./../triplet\ generator/enumerater_with_compass');
var fs = require('fs');
var marktypesAll = ['bar','point','line','area','tick','text'];
var channelsAll = ['x','y','shape','color','size'];
var aggregateAll = ['mean'];


var fieldsAll = [];
fieldsAll.push(new models.Field('quantitative','Q1'));
// fieldsAll.push(new models.Field('quantitative','Q2'));
fieldsAll.push(new models.Field('nominal','N1'));
// fieldsAll.push(new models.Field('ordinal','O1'));
// fieldsAll.push(new models.Field('temporal','T1'));



var compassSpecs = {
  markList: ['bar','point','line','area','tick'],
  // markList: ['point'],
  channelList: ['x','y','shape','color','size'],//,'row','column'],
  omitShapeWithTimeDimension: false,
  omitDotPlotWithExtraEncoding: true,
  omitDotPlotWithFacet: false,
  omitDotPlotWithOnlyCount: false, // TODO: revise if this should be true
  omitMultipleNonPositionalChannels: false, // TODO: revise if we penalize this in ranking
  omitNonTextAggrWithAllDimsOnFacets: false,
  omitRawWithXYBothDimension: true,
  omitShapeWithBin: false,
  omitShapeWithTimeDimension: true,
  omitSizeOnBar: true,
  omitLengthForLogScale: true,
  omitStackedAverage: true,
  omitTranspose: false,
  };


var specs = enumerater.generateVLFWithCompass({
  fieldList: fieldsAll,
  propertyList: ["scale", "aggregate", "bin"],
  projections: { maxAdditionalVariables: 2 },
  scales: {rescaleQuantitative: [undefined, 'log']},
  compassSpecs: compassSpecs
}).map(function(spec){
  var realFieldNames = { Q1:'Acceleration', Q2:'Horsepower', N1:'Origin', O1:'Cylinders', T1:'Year', "*":"*" }
  return spec.vegalite({}, realFieldNames);
}).map(function(spec){
  var channels = Object.keys(spec.encoding);
  for (var i = 0; i < channels.length; i++) {
    if (spec.encoding[channels[i]]["aggregate"] === "mean" ) {
      if(spec.encoding[channels[i]]["scale"]){
        spec.encoding[channels[i]]["scale"]["includeRawDomain"] = true;
      }
      else {
        spec.encoding[channels[i]]["scale"] = {"includeRawDomain":true};
      }
    }
  }
  return spec;
});

console.log("The number of specs : " + specs.length );
var specsFile = "var specs = ";
fs.writeFileSync('./js/get-specs.js',specsFile + JSON.stringify(specs) + ";");

//Calcualte Transitions
var ruleSet = JSON.parse(fs.readFileSync('ruleSet.json','utf8'));
var transitionSets = [];
var cpTrans = require('./bower_components/viscompass/src/trans/trans');
for (var i = 0; i < specs.length; i++) {

  transitionSets.push([]);
  for (var j = 0; j < specs.length; j++) {
    transitionSets[i].push(cpTrans.transitionSet(specs[i],specs[j],ruleSet));
  };

  if (i % Math.ceil(specs.length / 20) === 0 ) {
    process.stdout.write("#");
  };
};

var transitionSetsFile = "var transitionSets = ";
fs.writeFileSync('./js/get-transitionSets.js',transitionSetsFile + JSON.stringify(transitionSets) + ";");
