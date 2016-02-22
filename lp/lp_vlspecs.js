var models = require('./../triplet\ generator/models');
var enumerater = require('./../triplet\ generator/enumerater');
var fs = require('fs');
var cp = require('./bower_components/viscompass/compass');
var dl = require('./bower_components/datalib/datalib');
var genScales = require('./bower_components/viscompass/src/gen/scales').default;
var channel_1 = require('./bower_components/vega-lite/src/channel');
var mark_1 = require('./bower_components/vega-lite/src/mark');

var marktypesAll = ['bar','point','line','area','tick','text'];
var channelsAll = ['x','y','shape','color','size'];
var aggregateAll = ['mean'];


var fieldsAll = [];
fieldsAll.push(new models.Field('quantitative','Acceleration'));
fieldsAll.push(new models.Field('quantitative','Horsepower'));
fieldsAll.push(new models.Field('ordinal','Origin'));
fieldsAll.push(new models.Field('ordinal','Cylinders'));

var specs = enumerater.generateVLFWithCompass( './../data/cars.json', {
  fieldsAll : fieldsAll,
  projections: { maxAdditionalVariables: 4 },
  scales: {rescaleQuantitative: [undefined, 'log']},
  compassSpecs: {
        markList: marktypesAll,
        channelList: channelsAll
      }
  } ).map(function(spec){
    return spec.vegalite();
  });
console.log("The number of specs : " + specs.length );
fs.writeFileSync('specs.json',JSON.stringify(specs));

