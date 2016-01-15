var enumerater = require('./enumerater');
var comparator = require('./comparator');
var cars = require('./data/cars.json');
var exec = require('child_process').exec;
var fs = require('fs');
// var vl = require('./node_modules')
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("./result06/result.db");


db.serialize(function(){

  db.each("SELECT * FROM triplets WHERE compared_result = 0 and id >= 115700;", function(err,row){

    var triplet = JSON.parse(row.triplet);

    // Spec (marktype, channels, mapping, fields, channelProperties)
    var specRef = new enumerater.Spec(triplet[0].marktype, triplet[0].channels, triplet[0].mapping, triplet[0].fields, triplet[0].channelProperties);
    var specLeft = new enumerater.Spec(triplet[1].marktype, triplet[1].channels, triplet[1].mapping, triplet[1].fields, triplet[1].channelProperties);
    var specRight = new enumerater.Spec(triplet[2].marktype, triplet[2].channels, triplet[2].mapping, triplet[2].fields, triplet[2].channelProperties);

    var vlRef = specRef.vegalite(cars);
    var vlLeft = specLeft.vegalite(cars);
    var vlRight = specRight.vegalite(cars);
    var cmd ='';
    fs.writeFile('vlRef'+ row.id + '.json', JSON.stringify(vlRef), 'utf8', function(){

      cmd = './bower_components/vega-lite/bin/vl2svg vlRef'+ row.id +'.json ./result06/tied_' + row.id + '_ref.svg';
      exec(cmd, function(error, stdout, stderr) {
        fs.unlinkSync('vlRef'+ row.id + '.json');
      });
    });
    fs.writeFile('vlLeft'+ row.id + '.json', JSON.stringify(vlLeft), 'utf8', function(){

      cmd = './bower_components/vega-lite/bin/vl2svg vlLeft'+ row.id +'.json ./result06/tied_' + row.id + '_left.svg';
      exec(cmd, function(error, stdout, stderr) {
        fs.unlinkSync('vlLeft'+ row.id + '.json');
      });
    });
    fs.writeFile('vlRight'+ row.id + '.json', JSON.stringify(vlRight), 'utf8', function(){

      cmd = './bower_components/vega-lite/bin/vl2svg vlRight'+ row.id +'.json ./result06/tied_' + row.id + '_right.svg';
      exec(cmd, function(error, stdout, stderr) {
        fs.unlinkSync('vlRight'+ row.id + '.json');
      });
    });








  });

});
db.close();