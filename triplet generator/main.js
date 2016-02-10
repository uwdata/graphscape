var fs = require('fs');
var utils = require('./utils');
var enumerater = require('./enumerater_with_compass');
var comparator = require('./comparator');


var tables = [
              { name: "triplets",
                columns: ["id", "ref_id", "left_id", "right_id", "compared_result", "reason"],
                type: ["INTEGER PRIMARY KEY", "INTEGER", "INTEGER", "INTEGER", "TEXT", "TEXT"]
              }
            ];


var filePath = "./results/compass_v4_abst/";
var db = enumerater.dbInit(filePath + "compass_v4_abst.sqlite3",tables);

var specs = JSON.parse(fs.readFileSync(filePath + 'specs.json','utf8'));
console.log("The number of specs : " + specs.length );

var edges = JSON.parse(fs.readFileSync(filePath + 'edges.json','utf8'));
var edgesN = 0;
for (var i = 0; i < edges.length; i++) {
  edgesN += edges[i].length;
};
console.log("The number of edges : " + edgesN );


enumerater.enumAndCompNeighboredTriplets(specs, edges, {db: db, tables: [tables[0]] }, process.argv[3], process.argv[4]);
db.close();


