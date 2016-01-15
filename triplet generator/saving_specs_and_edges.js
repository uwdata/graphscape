
var utils = require('./utils');
var models = require('./models');
var enumerater = require('./enumerater');
var comparator = require('./comparator');
var fs = require('fs');

// var cars = JSON.parse(fs.readFileSync('./data/cars.json','utf8'));


var tables = [
              { name: "triplets",
                columns: ["id", "ref_id", "left_id", "right_id", "compared_result", "reason"],
                type: ["INTEGER PRIMARY KEY", "INTEGER", "INTEGER", "INTEGER", "TEXT", "TEXT"]
              },
              { name: "specs",
                columns: ["id", "json"],
                type: ["INTEGER PRIMARY KEY", "TEXT" ]
              },
              { name: "edges",
                columns: ["id", "source_id", "target_id"],
                type: ["INTEGER PRIMARY KEY", "INTEGER", "INTEGER" ]
              }
            ];

var db = enumerater.dbInit("./results/temp/vlspecs.sqlite3",tables);


var specs = enumerater.generatingState( models, {db: db, tables: [tables[1]] } );
console.log("The number of specs : " + specs.length );

var edges = enumerater.generatingEdges(specs, {db: db, tables: [tables[2]] } );
// var edges = enumerater.generatingEdges(specs );
var edgesN = 0;
for (var i = 0; i < edges.length; i++) {
  edgesN += edges[i].length;
};
console.log("The number of edges[row] : " + edges.length );
console.log("The number of edges : " + edgesN );


fs.writeFileSync('./results/temp/specs.json',JSON.stringify(specs));
fs.writeFileSync('./results/temp/edges.json',JSON.stringify(edges));
console.log("Saved!");

// var specs = JSON.parse(fs.readFileSync('./result12/specs.json','utf8'));
// var edges = JSON.parse(fs.readFileSync('./result12/edges.json','utf8'));

