var utils = require('./utils');


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
fieldsAll.push(new Field('nominal','Origin',3));
fieldsAll.push(new Field('nominal','Cylinders',6));

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

fieldsAll.generateFieldsSets = function(kindOfFields = [Q1, Q2, O1, O2]): FieldSet[] {
  //generate all kinds of combination of fields.
  //2^|field|

  return [[Q],[O], ..... [Q1, Q2, O1, O2]];
}

function generateChannelsSets(channels, n){
  //Return all kinds of channel sets.
  //|channels| permute n
}

function generateMapping() {
  
}

function checkConstraint(marktype, channels, mapping, channelProperties){

  //Return true if the combination of inputs is valid to create a visualizaiton.

}

function generatingState(){
  //Generating all kinds of specs.
}



function enumerateTriplets(specs){
  //Generating all kinds of triplets by the array of spec(specs)
}
