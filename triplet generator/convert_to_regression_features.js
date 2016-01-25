//read triplets
//read specs
//build convert ref
//build convert left
//build convert right
//concat them
//save in csv or sqlite

var fs = require('fs');
var utils = require('./utils');
var models = require('./models');

var filePath = "./results/compass_small/";
var specs = JSON.parse(fs.readFileSync(filePath + 'specs.json','utf8'));
var spec = specs[1];
var vlf = new models.VegaLiteFeature(spec.marktype, spec.channels, spec.mapping, spec.fields, spec.channelProperties);


console.log(vlf);
console.log("--------");
console.log(vlf.flat());