var utils = require('./utils');
var fs = require('fs');
var models = require('./models');
var comparator = require('./comparator');



var sqlite3 = require("sqlite3").verbose();
var TransactionDatabase = require("sqlite3-transactions").TransactionDatabase;










function generateVLFWithCompass( options ){
  var cp = require('./bower_components/viscompass/compass');
  var dl = require('./bower_components/datalib/datalib');
  var genScales = require('./bower_components/viscompass/src/gen/scales').default;
  var channel_1 = require('./bower_components/vega-lite/src/channel');
  var mark_1 = require('./bower_components/vega-lite/src/mark');

  var fieldDefs = options.fieldList.map(function(field){
    return { "field": field.fieldName, "type": field.fieldType };
  });

  var stats = options.stats;
  if(!stats){
    stats =models.fakeStats(options.fieldList);
  }

  var fieldSets = cp.gen.projections(fieldDefs, stats, options.projections)
    .reduce(function(fieldSets, fieldSet) {
      return cp.gen.aggregates(fieldSets, fieldSet, stats, {});
    }, [])
    .reduce(function(fieldSets, fieldSet) {
      return genScales(fieldSets, fieldSet, options.scales);
    }, [])
    .reduce(function(fieldSets, fieldSet) {
      return cp.gen.specs(fieldSets, fieldSet, stats, options.compassSpecs);
    }, []);



  var vlfs = fieldSets.map(function(spec){
    return models.vl2vlf(spec);
  });

  //exclude the redundant vlf
  vlfs = vlfs.reduce(function(prevVlfs, curVlf){
    for (var i = 0; i < prevVlfs.length; i++) {
      if(prevVlfs[i].abstEqual(curVlf, options.compassSpecs.channelList, options.propertyList)){
        return prevVlfs
      }
    };

    prevVlfs.push(curVlf);
    return prevVlfs;
  },[]);


  vlfs = models.remap(vlfs, options.fieldList);

  return vlfs.map(function(vlf){
    if (options.db) {
      options.db.serialize(function(){
        var stmt = options.db.prepare("INSERT INTO "+ options.tables[0].name +" (" + options.tables[0].columns[1] + ") VALUES( ? )");
        stmt.run(JSON.stringify(vlf));
        stmt.finalize();
      });
    }
    return vlf;
  });
}


function generatingEdges(specs, options){
  var edges = [];
  for (var i = 0; i < specs.length; i++) {
    edges.push([]);
    for (var j = 0; j < specs.length; j++) {
      if (i===j)
        continue;

      var diffVarPoint = comparator.diffVarPoint(specs[i],specs[j]);
      var diffChPoint = comparator.diffChannelPoint(specs[i],specs[j]);
      var diffMpPoint = comparator.diffMappingPoint(specs[i],specs[j]);

      // if (i >= 260) {
      //   console.log(diffVarPoint + ',' + diffChPoint +',' + diffMpPoint);
      // };


      if( diffVarPoint <= 1.0 && diffChPoint <= 1.0 && diffMpPoint <= 1.0){

        edges[i].push(j);

        if (options) {
          options.db.serialize(function(){
            var stmt = options.db.prepare("INSERT INTO "+ options.tables[0].name +" (" + options.tables[0].columns[1] +", "+ options.tables[0].columns[2] + ") VALUES( ?, ? )");
            stmt.run(i+1,j+1);

            stmt.finalize();
          });
        }
      }
    };
  };
  return edges;
}


function enumAndCompNeighboredTriplets(specs, edges, options, start, end){
  var specTrplets = [];
  var buffer = '';
  console.log('start : ' + start + ', end : ' + end);
  start = ( start !== undefined ? parseInt(start) : 0 );
  end = ( end !== undefined ? parseInt(end) : specs.length );
  console.log('Enumerating neighbored triplets...');
  console.log('start : ' + start + ', end : ' + end);

  options.db.serialize(function(){
    options.db.run('BEGIN');

    for (var i = start; i < end; i++) {

      var neighbors = edges[i];
      for (var j = 0; j < neighbors.length; j++) {
        for (var k = j+1; k < neighbors.length; k++) {
          var comparedResult = comparator.specCompare(specs[i], specs[neighbors[j]], specs[i], specs[neighbors[k]]);
          var stmt = "INSERT INTO "+ options.tables[0].name +" ("
            + options.tables[0].columns[1] + ", "
            + options.tables[0].columns[2] + ", "
            + options.tables[0].columns[3] + ", "
            + options.tables[0].columns[4] + ", "
            + options.tables[0].columns[5] + ") VALUES( "+ (i+1)
            + "," + (neighbors[j]+1)
            + ", "+ (neighbors[k]+1)
            + ", " + comparedResult.result
            + ", '" + JSON.stringify(comparedResult.reason) +"'"
            + " )"

          // stmt.run(i, neighbors[j], neighbors[k], comparedResult.result, JSON.stringify(comparedResult.reason));
          // stmt.finalize();
          options.db.run(stmt);
        }
      }

    }
    options.db.run('COMMIT');

  });

  console.log('Done!');
}


function dbInit(dbPath, tables, skip){
  // var db = new sqlite3.Database(dbPath)
  var db = new TransactionDatabase(
    new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE)
  );
  if(!skip){
    db.serialize(function(){
      for (var i = 0; i < tables.length; i++) {

        db.run("DROP TABLE " + tables[i].name, function(err){
          if ( err ){
            console.log(err);
          }
        });

      var createTableSQL = "CREATE TABLE " + tables[i].name + " (";
      for (var j = 0; j < tables[i].columns.length; j++) {
        createTableSQL += tables[i].columns[j] + " " + tables[i].type[j] + ( j== tables[i].columns.length - 1 ? "\n" : ", \n" );
      };
      db.run(createTableSQL +" )" );
      };
    });
  }
  else
    console.log("Skipped creating tables.")

  return db;
}


module.exports = {
  generatingEdges: generatingEdges,
  enumAndCompNeighboredTriplets: enumAndCompNeighboredTriplets,
  generateVLFWithCompass : generateVLFWithCompass,
  dbInit : dbInit
};

