var utils = require('./utils');
var fs = require('fs');
var models = require('./models');
var comparator = require('./comparator');



var sqlite3 = require("sqlite3").verbose();
var TransactionDatabase = require("sqlite3-transactions").TransactionDatabase;


function generateVLFWithCompass(dataPath, options ){
  var cp = require('./bower_components/viscompass/compass');
  var dl = require('./bower_components/datalib/datalib');
  var genScales = require('./bower_components/viscompass/src/gen/scales').default;
  var channel_1 = require('./bower_components/vega-lite/src/channel');
  var mark_1 = require('./bower_components/vega-lite/src/mark');

  var data = JSON.parse(fs.readFileSync(dataPath,'utf8'));
  var fieldDefs = models.fieldsAll.map(function(field){
    return {'field': field.fieldName, 'type': field.fieldType }
  });

  // fieldDefs = List of fieldDef object {field:..., type: ...}
  const stats = dl.summary(data).reduce(function(s, profile) {
    s[profile.field] = profile;
    return s;
  }, {
    '*': {
      max: data.length,
      min: 0
    }
  });

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
      if(prevVlfs[i].abstEqual(curVlf)){
        return prevVlfs
      }

    };

    prevVlfs.push(curVlf);
    return prevVlfs;
  },[]);

  vlfs = models.remap(vlfs);

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

function generatePropertiesSets(propertiesAll){
  var totalProps = propertiesAll.length;
  var totalSets = Math.pow(2,totalProps);
  var results = [];
  for (var i = 0; i < totalSets; i++) {
    var propSet = [];
    for (var j = 0; j < totalProps; j++) {
      var index = Math.pow(2,j);
      if((i&index)===index){
        propSet.push(propertiesAll[j]);
      };
    };
    results.push(propSet);


  };
  return results;
}

function generateFieldsSets(fieldsAll){
  var totalFields = fieldsAll.length;
  var totalSets = Math.pow(2,totalFields);
  var results = [];
  for (var i = 0; i < totalSets; i++) {
    var fieldsSet = [];
    for (var j = 0; j < totalFields; j++) {
      var index = Math.pow(2,j);
      if((i&index)===index){
        fieldsSet.push(fieldsAll[j]);
      };
    };
    results.push(fieldsSet);


  };
  return results;
}

function generateChannelsSets(channels, n){
  var results = [];
  if (n===1) {
    for (var i = 0; i < channels.length; i++) {
      results.push([channels[i]]);
    };

  }
  else {
    for (var i = 0; i < channels.length; i++) {
      var subChannels = channels.slice(0);
      subChannels.splice(i,1);
      var subChannelsSets = generateChannelsSets(subChannels,n-1);
      for (var j = 0; j < subChannelsSets.length; j++) {
        results.push([channels[i]].concat(subChannelsSets[j]));

      };

    };
  }
  return results;
}
function checkConstraint(marktype, channels, mapping, channelProperties){

  //constraitns about channels
  for (var i = 0; i < channels.length; i++) {
    var channel = channels[i];

    if (channel==='row' || channel==='column'|| channel==='shape' ) {
      if( mapping.ch2f[channel].fieldType === 'quantitative')
        return false;
    };

    if ( channel==='size' || channel === 'shape'){
      if (marktype==='bar' || marktype==='line' || marktype==='area' ) {
        return false;
      }
    };
  };

  //At least, either x:q or y:q should exists.
  if( mapping.ch2f['x'].fieldType !== 'quantitative' && mapping.ch2f['y'].fieldType !== 'quantitative'){
    if (!( mapping.ch2f['x'].fieldType === 'nominal' && mapping.ch2f['y'].fieldType === 'nominal'))
      return false;
  }


  //constraitns about marktype
  if ( marktype !== "point" ){
    if (!( (channels.indexOf('x') >= 0)
          && (channels.indexOf('y') >= 0)
          && (channels.indexOf('shape') < 0)
          && (channels.indexOf('size') < 0)))
      return false;
  }
  if (marktype === 'bar'){
    if( (mapping.ch2f["x"].fieldType !== 'nominal') && (mapping.ch2f["y"].fieldType !== 'nominal') ) {
      return false;
    };
  }

  var hasAggregate = false;
  var ch2prop = {};
  for (var i = 0; i < channelProperties.length; i++) {
    var prop = channelProperties[i];


    if ( !(channels.indexOf(prop.channel) >= 0 )) {
      return false;
    }
    else {
      ch2prop[prop.channel] = prop.property;

      if ( prop.property === 'aggregate') {
        hasAggregate = true;
      }

      if ( prop.property === 'scale') {
        if (mapping.ch2f[prop.channel].fieldType !== 'quantitative') {
          return false;
        };
      };
    }
  };
//"data": { "url": "data/cars.json"},
  if ( hasAggregate ) {
    //~1. should have at least one nominal field
    //2. all quantitative fields should have aggregate propertise
    var hasNominal = false;
    if (mapping.ch2f['x'] && mapping.ch2f['y'] && ( marktype === "line" || marktype === "area")) {
      if (mapping.ch2f['x'].fieldType==="quantitative" && mapping.ch2f['y'].fieldType ==="quantitative"){
        if (ch2prop['x'] === 'aggregate' && ch2prop['y'] === 'aggregate') {
          return false;
        };
      }
    };

    for (var i = 0; i < channels.length; i++) {
      if ( mapping.ch2f[channels[i]].fieldType ==='nominal' )
        hasNominal = true;

      // if (mapping.ch2f[channels[i]].fieldType === 'quantitative' && ch2prop[channels[i]] !== 'aggregate') {
      //   return false;
      // };


      if (mapping.ch2f[channels[i]].fieldType !== 'quantitative' && ch2prop[channels[i]] === 'aggregate') {
        return false;
      };

    };

    if (!hasNominal) {
      return false;
    };
  };



  return true;


}

function generatingState( models, options){
  var results =[];
  var fieldsSets = generateFieldsSets(models.fieldsAll);
  var propertiesSets = generatePropertiesSets(models.channelPropertiesAll);

  for (var i = 0; i < fieldsSets.length; i++) {
    var fields = fieldsSets[i];

    for (var j = 0; j < models.marktypesAll.length; j++) {
      var marktype = models.marktypesAll[j];
      var channelsSets = generateChannelsSets(models.channelsAll, fields.length);

      for (var k = 0; k < channelsSets.length; k++) {
        var channels = channelsSets[k];

        var mapping = new models.Mapping(channels, fields);

        for (var l = 0; l < propertiesSets.length; l++) {

          if(checkConstraint(marktype, channels, mapping, propertiesSets[l])){
            // console.log('pushing!');
            var spec = new models.VegaLiteFeature(marktype, channels, mapping, fields, propertiesSets[l]);
            results.push(spec);

            if (options) {
              options.db.serialize(function(){
                var stmt = options.db.prepare("INSERT INTO "+ options.tables[0].name +" (" + options.tables[0].columns[1] + ") VALUES( ? )");
                stmt.run(JSON.stringify(spec));
                stmt.finalize();
              });
            }

          }
        }
      }
    }
  }

  return results;
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
  generatingState: generatingState,
  generatingEdges: generatingEdges,
  enumAndCompNeighboredTriplets: enumAndCompNeighboredTriplets,
  generateVLFWithCompass : generateVLFWithCompass,
  dbInit : dbInit

};

