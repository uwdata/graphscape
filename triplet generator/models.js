
var fieldsAll = [];
var marktypesAll = ['bar','point','line','area'];
var channelsAll = ['x','y','shape','color','size','row','column'];
var aggregateAll = ['mean'];

var xScaleLog = { "channel": 'x', "property": "scale", "value": {"type":"log"} };
var yScaleLog = { "channel": 'y', "property": "scale", "value": {"type":"log"} };
var xAggregateMean = { "channel": 'x', "property": "aggregate", "value": "mean" };
var yAggregateMean = { "channel": 'y', "property": "aggregate", "value": "mean" };

var channelPropertiesAll = [xScaleLog, xAggregateMean, yAggregateMean, yScaleLog];


function Field(fieldType, fieldName, cardinality){
  this.fieldType = fieldType;
  this.fieldName = fieldName;
  this.cardinality = (cardinality===undefined) ? 0 : cardinality;
}
fieldsAll.push(new Field('quantitative','Acceleration'));
// fieldsAll.push(new Field('quantitative','Horsepower'));
// fieldsAll.push(new Field('quantitative','Displacement'));
fieldsAll.push(new Field('nominal','Origin',3));
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
      info += channelProperties[i].channel + " : " + channelProperties[i].property + " ";
    };
    return info;
  }

  this.vegalite = function(boundData){
    var vlSpec = {};
    vlSpec["data"] = {"values": boundData};
    vlSpec["mark"] = that.marktype;
    vlSpec["encoding"] = {};
    for (var i = 0; i < that.channels.length; i++) {
      var ch = that.channels[i];
      var field = mapping.ch2f[ch];

      vlSpec["encoding"][ch] = {"type": field.fieldType, "field": field.fieldName };

      // if (that.marktype === "bar" && field.fieldType === "quantitative"){
      //   vlSpec["encoding"][ch]["aggregate"] = "mean" ;
      // }

    };
    if (channelProperties.length > 0) {
      for (var i = 0; i < channelProperties.length; i++) {
        var ch = channelProperties[i].channel;
        var prop = channelProperties[i].property;
        var propVal = channelProperties[i].value;


        vlSpec["encoding"][ch][prop] =  propVal;


      };
    };

    return vlSpec;
  }

}

module.exports = {
  Spec: Spec,
  Mapping: Mapping,
  fieldsAll: fieldsAll,
  channelsAll: channelsAll,
  marktypesAll: marktypesAll,
  channelPropertiesAll: channelPropertiesAll,
};