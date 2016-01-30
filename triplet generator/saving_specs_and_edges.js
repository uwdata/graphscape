var utils = require('./utils');
var models = require('./models');
var enumerater = require('./enumerater');
var comparator = require('./comparator');
var fs = require('fs');
var cp = require('./bower_components/viscompass/compass');
var dl = require('./bower_components/datalib/datalib');
var genScales = require('./bower_components/viscompass/src/gen/scales').default;
var channel_1 = require('./bower_components/vega-lite/src/channel');
var mark_1 = require('./bower_components/vega-lite/src/mark');





var tables = [
              // { name: "triplets",
              //   columns: ["id", "ref_id", "left_id", "right_id", "compared_result", "reason"],
              //   type: ["INTEGER PRIMARY KEY", "INTEGER", "INTEGER", "INTEGER", "TEXT", "TEXT"]
              // },
              { name: "specs",
                columns: ["id", "json"],
                type: ["INTEGER PRIMARY KEY", "TEXT" ]
              },
              { name: "edges",
                columns: ["id", "source_id", "target_id"],
                type: ["INTEGER PRIMARY KEY", "INTEGER", "INTEGER" ]
              }
            ];
var filePath = "./results/compass_v4_compact/";
var db = enumerater.dbInit(filePath + "compass_v4_compact.sqlite3",tables);


// var specs = enumerater.generatingState( models, {db: db, tables: [tables[1]] } );
var specs = enumerater.generateVLFWithCompass( './data/cars.json', {db: db,
  tables: [tables[0]],
  projections: { maxAdditionalVariables: 4 },
  scales: {rescaleQuantitative: [undefined, 'log']},
  compassSpecs: {
        markList: models.marktypesAll,
        channelList: models.channelsAll
      }
  } );
console.log("The number of specs : " + specs.length );


var edges = enumerater.generatingEdges(specs, {db: db, tables: [tables[1]] } );
// var edges = enumerater.generatingEdges(specs );
var edgesN = 0;
for (var i = 0; i < edges.length; i++) {
  edgesN += edges[i].length;
};
console.log("The number of edges[row] : " + edges.length );
console.log("The number of edges : " + edgesN );


fs.writeFileSync(filePath + 'specs.json',JSON.stringify(specs));
fs.writeFileSync(filePath + 'edges.json',JSON.stringify(edges));
console.log("Saved!");

// var specs = JSON.parse(fs.readFileSync('./result12/specs.json','utf8'));
// var edges = JSON.parse(fs.readFileSync('./result12/edges.json','utf8'));

