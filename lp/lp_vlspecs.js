var models = require('./../triplet\ generator/models');
var enumerater = require('./../triplet\ generator/enumerater_with_compass');
var fs = require('fs');

var marktypesAll = ['bar','point','line','area','tick','text'];
var channelsAll = ['x','y','shape','color','size'];
var aggregateAll = ['mean'];


var fieldsAll = [];
fieldsAll.push(new models.Field('quantitative','Acceleration'));
fieldsAll.push(new models.Field('quantitative','Horsepower'));
fieldsAll.push(new models.Field('ordinal','Origin'));
fieldsAll.push(new models.Field('ordinal','Cylinders'));



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
});

console.log("The number of specs : " + specs.length );
fs.writeFileSync('specs.json',JSON.stringify(specs));
