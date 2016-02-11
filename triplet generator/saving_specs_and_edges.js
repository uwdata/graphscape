var utils = require('./utils');
var models = require('./models');
var enumerater = require('./enumerater_with_compass');
var fs = require('fs');


var tables = [
              { name: "specs",
                columns: ["id", "json"],
                type: ["INTEGER PRIMARY KEY", "TEXT" ]
              },
              { name: "edges",
                columns: ["id", "source_id", "target_id"],
                type: ["INTEGER PRIMARY KEY", "INTEGER", "INTEGER" ]
              }
            ];
var filePath = "./results/compass_universal/";
var db = enumerater.dbInit(filePath + "compass_universal.sqlite3",tables);
var data = JSON.parse(fs.readFileSync('./data/climate.json','utf8'));
/***** Enumerating Settings  *****/
var fieldsAll = [];
fieldsAll.push(new models.Field('quantitative','Q1'));
fieldsAll.push(new models.Field('quantitative','Q2'));
fieldsAll.push(new models.Field('nominal','N1'));
fieldsAll.push(new models.Field('nominal','N2'));
fieldsAll.push(new models.Field('temporal','T1','year'));

var compassSpecs = {
  markList: ['bar','point','line','area'],
  channelList: ['x','y','shape','color','size','row','column'],
  omitShapeWithTimeDimension: false
  };
// 1. eunumerating specs by Compass



var specs = enumerater.generateVLFWithCompass({
  db: db,
  tables: [ tables[0] ],
  fieldList: fieldsAll,
  propertyList: ["scale", "aggregate", "bin"],
  projections: { maxAdditionalVariables: 4 },
  scales: {rescaleQuantitative: [undefined, 'log']},
  compassSpecs: compassSpecs
  });
console.log("The number of specs : " + specs.length );

// 2. eunumerating edges

var edges = enumerater.generatingEdges(specs, {db: db, tables: [tables[1]] } );
var edgesN = 0;
for (var i = 0; i < edges.length; i++) {
  edgesN += edges[i].length;
};
console.log("The number of edges[row] : " + edges.length );
console.log("The number of edges : " + edgesN );


fs.writeFileSync(filePath + 'specs.json',JSON.stringify(specs));
fs.writeFileSync(filePath + 'edges.json',JSON.stringify(edges));
console.log("Saved!");



