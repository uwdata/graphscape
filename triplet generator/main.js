var fs = require('fs');
var utils = require('./utils');
var enumerater = require('./enumerater');
var comparator = require('./comparator');


var tables = [
              { name: "triplets",
                columns: ["id", "ref_id", "left_id", "right_id", "compared_result", "reason"],
                type: ["INTEGER PRIMARY KEY", "INTEGER", "INTEGER", "INTEGER", "TEXT", "TEXT"]
              },
              // { name: "specs",
              //   columns: ["id", "json"],
              //   type: ["INTEGER PRIMARY KEY", "TEXT" ]
              // },
              // { name: "edges",
              //   columns: ["id", "source_id", "target_id"],
              //   type: ["INTEGER PRIMARY KEY", "INTEGER", "INTEGER" ]
              // }
            ];


var filePath = "./results/compass_small/";
var db = enumerater.dbInit(filePath + "vlspace_compass_small.sqlite3",tables);

var specs = JSON.parse(fs.readFileSync(filePath + 'specs.json','utf8'));
console.log("The number of specs : " + specs.length );

var edges = JSON.parse(fs.readFileSync(filePath + 'edges.json','utf8'));
var edgesN = 0;
for (var i = 0; i < edges.length; i++) {
  edgesN += edges[i].length;
};
console.log("The number of edges : " + edgesN );



enumerater.enumAndCompNeighboredTriplets(specs, edges, {db: db, tables: [tables[0]] }, Number(process.argv[3]), Number(process.argv[4]));
db.close();





// var compairedDistances = comparator.runTripletComparatingDB(optionsForDB);
// db.close();




// var tiedSpecs = [];
// var tiedCount = 0;
// var determinedCount = [0,0,0,0,0];
// var totalCount = compairedDistances.length;

// for (var i = 0; i < compairedDistances.length; i++) {
//   var d = compairedDistances[i];

//   if( d.result === 0 ){
//     tiedCount += 1;
//     tiedSpecs.push(specTriplets[i]);
//   }
//   else
//     determinedCount[d.reason - 1] += 1 ;
// };


// console.log("The number of the triplets having the same distance : " + tiedCount );
// console.log("The number of the triplets : " + totalCount );
// console.log("Each number of the triplets determined by rules respectively : " + determinedCount.toString() );
// console.log(tiedCount / totalCount);


// fs.writeFile('./result01/compairedDistances', JSON.stringify(compairedDistances), {flag:'w+'}, function (err, data) {
//   if (err) {
//     return console.log(err);
//   }
// });

// fs.writeFile('./result01/determinedCount', determinedCount,{flag:'w+'}, function (err, data) {
//   if (err) {
//     return console.log(err);
//   }
// });

