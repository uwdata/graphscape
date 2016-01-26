var fs = require('fs');
var utils = require('./utils');
var models = require('./models');
var sqlite3 = require("sqlite3").verbose();

var filePath = "./results/compass_small/";

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database( filePath + "/vlspace_compass_small.sqlite3", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
var specs = JSON.parse(fs.readFileSync(filePath + 'specs.json','utf8'));

var data = [];
var header = true;
db.each('SELECT * FROM triplets;',function(err, row){
  var ref_vlf = new models.VegaLiteFeature(specs[row.ref_id-1].marktype, specs[row.ref_id-1].channels, specs[row.ref_id-1].mapping, specs[row.ref_id-1].fields, specs[row.ref_id-1].channelProperties);
  var left_vlf = new models.VegaLiteFeature(specs[row.left_id-1].marktype, specs[row.left_id-1].channels, specs[row.left_id-1].mapping, specs[row.left_id-1].fields, specs[row.left_id-1].channelProperties);
  var right_vlf = new models.VegaLiteFeature(specs[row.right_id-1].marktype, specs[row.right_id-1].channels, specs[row.right_id-1].mapping, specs[row.right_id-1].fields, specs[row.right_id-1].channelProperties);
  var human_answers = row.answer;

  var ref_flat = ref_vlf.flat();
  var left_flat = left_vlf.flat();
  var right_flat = right_vlf.flat();

  if (header) {
    data.push(["answer"]
      .concat(ref_flat.columns.map(function(col){
        return "ref_" + col;
      }))
      .concat(left_flat.columns.map(function(col){
        return "left_" + col;
      }))
      .concat(right_flat.columns.map(function(col){
        return "right_" + col;
      })));
    header = false;
  }

  data.push([human_answers].concat(ref_flat.values).concat(left_flat.values).concat(right_flat.values));

},function(){
  data = data.map(function(row){
    return row.join(",");
  }).join("\n");
  console.log(data);
  fs.writeFileSync(filePath + 'human_answers.csv',data);
});

