var fieldsAll = [];

var marktypesAll = ['bar','point','line','area'];

var channelsAll = ['x','y','shape','color','size','row','column'];


var xScaleLog = { "channel": 'x', "properties": ["scale"], "propValues": [{"type":"log"}] };
var yScaleLog = { "channel": 'y', "properties": ["scale"], "propValues": [{"type":"log"}] };
var channelPropertiesAll = [[],
                            [ xScaleLog ],
                            [ yScaleLog ],
                            [ xScaleLog , yScaleLog ]];


function Field(fieldType, fieldName, cardinality){
  this.fieldType = fieldType;
  this.fieldName = fieldName;
  this.cardinality = (cardinality===undefined) ? 0 : cardinality;
}
fieldsAll.push(new Field('quantitative','Acceleration'));
fieldsAll.push(new Field('quantitative','Horsepower'));
// fieldsAll.push(new Field('quantitative','Displacement'));
// fieldsAll.push(new Field('nominal','Origin',3));
// fieldsAll.push(new Field('nominal','Cylinders',6));

function Mapping(channels, fields){
  var that = this;
  this.ch2f = {};
  this.f2ch = {};

  for (var i = 0; i < channelsAll.length; i++) {
    var index = channels.indexOf(channelsAll[i]);
    that.ch2f[channelsAll[i]] = ( index >=0 ) ? fields[index]: "";
  };

  for (var i = 0; i < fields.length; i++) {
    that.f2ch[fields[i].fieldName] = channels[i];
  };

  this.info = function(){
    var info="";
    for (var i = 0; i < channelsAll.length; i++) {
      var field = that.ch2f[channelsAll[i]];
      if (field === "")
        info = info + channelsAll[i] + " : " + "" + "&#09;";
      else
        info = info + channelsAll[i] + " : " + field.fieldName + "&#09;";

    };
    return info;
  }
}

function Spec (marktype, channels, mapping, fields, channelProperties) {
  this.marktype = marktype;
  this.channels = channels;
  this.mapping = mapping;
  this.fields = fields;
  this.channelProperties = channelProperties;

  var that = this;
  this.info = function(){
    var info = "";
    info = "marktype => " + that.marktype + "&#09;"
          + "mapping => " + that.mapping.info() + "&#09;";
    for (var i = 0; i < channelProperties.length; i++) {
      info += channelProperties[i].channel + " : " + channelProperties[i].properties.join(', ') + " ";
    };
    return info;
  }

  this.vegalite = function(boundData){
    var vlSpec = {};
    vlSpec["data"] = {"values": boundData};
    vlSpec["marktype"] = that.marktype;
    vlSpec["encoding"] = {};
    for (var i = 0; i < that.channels.length; i++) {
      var ch = that.channels[i];
      var field = mapping.ch2f[ch];

      vlSpec["encoding"][ch] = {"type": field.fieldType, "field": field.fieldName };
    };
    if (channelProperties.length > 0) {
      for (var i = 0; i < channelProperties.length; i++) {
        var ch = channelProperties[i].channel;
        var props = channelProperties[i].properties;
        var propVals = channelProperties[i].propValues;

        for (var j = 0; j < props.length; j++) {
          vlSpec["encoding"][ch][props[j]] =  propVals[j];
        };

      };
    };

    return vlSpec;
  }
}

fieldsAll.generateFieldsSets = function(){
  var totalFields = this.length;
  var totalSets = Math.pow(2,totalFields);
  var results = [];
  for (var i = 0; i < totalSets; i++) {
    var fieldsSet = [];
    for (var j = 0; j < totalFields; j++) {
      var index = Math.pow(2,j);
      if((i&index)===index){
        fieldsSet.push(this[j]);
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

  for (var i = 0; i < channelProperties.length; i++) {
    var chProp = channelProperties[i];
    if ( !(channels.indexOf(chProp.channel) >= 0 )) {
      return false;
    }
    else {
      if ( chProp.properties.indexOf('scale') >= 0) {
        if (mapping.ch2f[chProp.channel].fieldType !== 'quantitative') {
          return false;
        };
      };
    }
  };




  return true;


}

function generatingState(){
  var results =[];
  var fieldsSets = fieldsAll.generateFieldsSets();

  for (var i = 0; i < fieldsSets.length; i++) {
    var fields = fieldsSets[i];

    for (var j = 0; j < marktypesAll.length; j++) {
      var marktype = marktypesAll[j];
      var channelsSets = generateChannelsSets(channelsAll, fields.length);

      for (var k = 0; k < channelsSets.length; k++) {
        var channels = channelsSets[k];

        var mapping = new Mapping(channels, fields);

        for (var l = 0; l < channelPropertiesAll.length; l++) {

          if(checkConstraint(marktype, channels, mapping, channelPropertiesAll[l])){
            // console.log('pushing!');
            results.push(new Spec(marktype, channels, mapping, fields, channelPropertiesAll[l]));
          }
        };


      };
    };
  };

  return results;
}



function enumerateTriplets(specs){
  var specTrplets = [];
  for (var i = 0; i < specs.length; i++) {
    for (var j = 0; j < specs.length; j++) {
      if (i===j) {
        continue;
      };
      for (var k = j+1; k < specs.length; k++) {
        if (i===k) {
          continue;
        };
        specTrplets.push([specs[i], specs[j], specs[k]]);
      };
    };
  };
  return specTrplets;
}
