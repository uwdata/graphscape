var models = require('./../triplet\ generator/models');
var enumerater = require('./../triplet\ generator/enumerater_with_compass');
var fs = require('fs');
var marktypesAll = ['bar','point','line','area','tick','text'];
var channelsAll = ['x','y','shape','color','size'];
var aggregateAll = ['mean'];


var fieldsAll = [];
fieldsAll.push(new models.Field('quantitative','Q1'));
fieldsAll.push(new models.Field('quantitative','Q2'));
// fieldsAll.push(new models.Field('nominal','N1'));
// fieldsAll.push(new models.Field('nominal','N2'));
// fieldsAll.push(new models.Field('temporal','T1'));



var compassSpecs = {
  markList: ['bar','point','line','area'],
  channelList: ['x','y','shape','color','size'],
  omitShapeWithTimeDimension: false
  };


var specs = enumerater.generateVLFWithCompass({
  fieldList: fieldsAll,
  propertyList: ["scale", "aggregate", "bin"],
  projections: { maxAdditionalVariables: 4 },
  scales: {rescaleQuantitative: [undefined, 'log']},
  compassSpecs: compassSpecs
}).map(function(spec){
  var realFieldNames = { Q1:'Acceleration', Q2:'Horsepower', N1:'Origin', N2:'Cylinders', T1:'Year', "*":"*" }
  return spec.vegalite({}, realFieldNames);
});

console.log("The number of specs : " + specs.length );
var specsFile = "var specs = ";
fs.writeFileSync('./js/get-specs.js',specsFile + JSON.stringify(specs) + ";");

//
var transitionSets = [];
var cpTrans = require('./bower_components/viscompass/src/trans/trans');
for (var i = 0; i < specs.length; i++) {
  
  transitionSets.push([]);
  for (var j = 0; j < specs.length; j++) {
    transitionSets[i].push(cpTrans.transitionSet(specs[i],specs[j]));
  };

  if (i % Math.ceil(specs.length / 20) === 0 ) {
    process.stdout.write("#");
  };
};

var transitionSetsFile = "var transitionSets = ";
fs.writeFileSync('./js/get-transitionSets.js',transitionSetsFile + JSON.stringify(transitionSets) + ";");
