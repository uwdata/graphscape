
function Field(fieldType, fieldName, timeUnit){
  this.fieldType = fieldType;
  this.fieldName = fieldName;
  this.timeUnit = timeUnit;
}

function Mapping(channels, fields){
  var that = this;
  // this.channels = channels;
  this.ch2f = {};
  this.f2ch = {};
  for (var i = 0; i < channels.length; i++) {
    that.ch2f[channels[i]] = fields[i];

    that.f2ch[fields[i].fieldName] = channels[i];
  }

  that.info = function(){
    var info="";
    for (var i = 0; i < that.channels.length; i++) {
      var field = that.ch2f[that.channels[i]];
      if (field === "")
        info = info + that.channels[i] + " : " + "" + "&#09;";
      else
        info = info + that.channels[i] + " : " + field.fieldName + "&#09;";
    };
    return info;
  }
}

function VegaLiteFeature (marktype, channels, mapping, fields, channelProperties) {
  var that = this;
  this.marktype = marktype;

  this.channels = channels;
  this.mapping = mapping;
  this.fields = fields;
  this.channelProperties = channelProperties;

  this.display = function(column){
    var info="";

    if (column==="mapping") {
      for (var i = 0; i < that.channels.length; i++) {
        var field = that.mapping.ch2f[that.channels[i]];
          info += that.channels[i] + " : " + field.fieldName + "\n";
      };
    }
    else if (column === "fields") {
      for (var i = 0; i < that.fields.length; i++) {
        info += that.fields[i].fieldName + " : " + that.fields[i].fieldType + "\n";
      }
    }
    else if (column === "channelProperties") {
      for (var i = 0; i < that.channelProperties.length; i++) {
        info += that.channelProperties[i].channel + " : " + that.channelProperties[i].property + "\n";
      }
    }
    else if (column ==="channels") {
      info  = that[column].join("\n");
    }
    else
      info = JSON.stringify(that[column]);


    return info;
  }

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

  this.vegalite = function(boundData, realFieldNames){
    var vlSpec = {};
    vlSpec["data"] = boundData;
    vlSpec["mark"] = that.marktype;
    vlSpec["encoding"] = {};
    for (var i = 0; i < that.channels.length; i++) {
      var ch = that.channels[i];
      var field = mapping.ch2f[ch];


      vlSpec["encoding"][ch] = {"type": field.fieldType, "field": realFieldNames[field.fieldName]  };
      if (field.fieldType) {
        vlSpec["encoding"][ch]["timeUnit"] = field.timeUnit;
      };

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

  this.flat = function (channelsAll, propertiesAll ){
    var result ={};
    var columns = [];
    var values =[];

    result["mark"] = that.marktype;
    columns.push("mark");
    values.push(result["mark"]);

    for (var i = 0; i < channelsAll.length; i++) {

      result[channelsAll[i]] = "x";
      result[channelsAll[i] + "_Q"] = "x";
      result[channelsAll[i] + "_N"] = "x";

      var field = that.mapping.ch2f[channelsAll[i]];
      if ( that.channels.indexOf(channelsAll[i]) >= 0 ){
        result[channelsAll[i]] = "o";
        result[channelsAll[i] + "_Q"] = ( field.fieldType === "quantitative" ) ? "o" : "x";
        result[channelsAll[i] + "_N"] = ( field.fieldType === "nominal" ) ? "o" : "x";
        result[channelsAll[i] + "_O"] = ( field.fieldType === "ordinal" ) ? "o" : "x";
      }

      columns.push(channelsAll[i]);
      values.push(result[channelsAll[i]]);
      columns.push(channelsAll[i] + "_Q");
      values.push(result[channelsAll[i] + "_Q"]);
      columns.push(channelsAll[i] + "_N");
      values.push(result[channelsAll[i] + "_N"]);


      for (var j = 0; j < propertiesAll.length; j++) {
        result[channelsAll[i] + "_" + propertiesAll[j]] = "x";

        for (var k = 0; k < that.channelProperties.length; k++) {
          if (that.channelProperties[k]["channel"] === channelsAll[i] && that.channelProperties[k]["property"] === propertiesAll[j] )
            result[channelsAll[i] + "_" + propertiesAll[j]] = JSON.stringify(that.channelProperties[k]["value"]);
        }

        columns.push(channelsAll[i] + "_" + propertiesAll[j]);
        values.push(result[channelsAll[i] + "_" + propertiesAll[j]]);
      }
    }

    return {"result": result, "columns": columns, "values": values}
  }

  this.abstEqual = function(anotherVlf, channelsAll, propertiesAll){

    if (that.marktype !== anotherVlf.marktype ) { return false };
    if (that.channels.slice(0).sort().join("") !== anotherVlf.channels.slice(0).sort().join("") ) { return false };
    if (that.fields.slice(0).sort().join("") !== anotherVlf.fields.slice(0).sort().join("") ) { return false };
    if (that.channelProperties.slice(0).sort().join("") !== anotherVlf.channelProperties.slice(0).sort().join("") ) { return false };

    if (JSON.stringify(anotherVlf.flat(channelsAll, propertiesAll).values) === JSON.stringify(this.flat(channelsAll, propertiesAll).values)){
      return true;
    }
    else {
      return false;
    }

  }
}


function vl2vlf (vl) {

  var channelsAll = ['x','y','shape','color','size','row','column'];
  var chPropAll = ['scale', 'aggregate', 'bin'];
  var marktype = vl.mark;
  var mapping;
  var fields = [];
  var channels =[];
  var channelProperties = [];

  //convert 'encoding' to 'fields' and channelProperties'
  for (var i = 0; i < channelsAll.length; i++) {
    var channel = channelsAll[i];
    if (vl.encoding[channel] !== undefined) {

      channels.push(channel);

      //check field
      var field = new Field(vl.encoding[channel].type, vl.encoding[channel].field, vl.encoding[channel].timeUnit );
      fields.push(field);


      //check properties
      for (var j = 0; j < chPropAll.length; j++) {
        var property = chPropAll[j];

        if (vl.encoding[channel][property] !== undefined ) {
          channelProperties.push({  "channel": channel,
                                    "property": property,
                                    "value": vl.encoding[channel][property] });
        }

      }

    }
  }

  //convert to mapping
  mapping = new Mapping(channels, fields)
  return new VegaLiteFeature(marktype, channels, mapping, fields, channelProperties);
}


function remap(vlfs, fieldList){

  var fieldListPerType = ["quantitative","nominal","temporal","ordinal"].reduce(function(flpType, fieldType){

    flpType[fieldType] = fieldList.filter(function( field ){
      return field.fieldType === fieldType;
    });

    return flpType;

  },{});


  return vlfs.map(function(vlf){
    var newFields = [];
    var q = 0, n=0, t=0, o = 0;

    for (var i = 0; i < vlf.fields.length; i++) {
      if ( vlf.fields[i].fieldName !== "*" ) {

        if ( vlf.fields[i].fieldType === 'quantitative' ){
          newFields.push(fieldListPerType['quantitative'][q]);
          q += 1;
        }
        if ( vlf.fields[i].fieldType ==='nominal'){
          newFields.push(fieldListPerType['nominal'][n]);
          n += 1;
        }
        if ( vlf.fields[i].fieldType ==='temporal'){
          newFields.push(fieldListPerType['temporal'][t]);
          t += 1;
        }
        if ( vlf.fields[i].fieldType ==='ordinal'){
          newFields.push(fieldListPerType['ordinal'][o]);
          o += 1;
        }
      }
      else{
        newFields.push(vlf.fields[i]);
      }
    }
    vlf.fields = newFields;
    vlf.mapping = new Mapping(vlf.channels, vlf.fields);
    return vlf
  });
}

function fakeStats(fields){
  return fields.reduce(function(s, field){
    if (field.fieldType === "quantitative") {
      s[field.fieldName] = {
        type: "number",
        missing: 0,
        distinct: 100,
        min: 0,
        max: 24.8,
        mean: 15.51970443349754,
        stdev: 2.8,
        };
    }
    else if (field.fieldType === "nominal" || field.fieldType === "ordinal" ) {
      s[field.fieldName] = {
        type: "string",
        distinct: 5,
        max: 100,
        min: 0,
        missing: 0
        };
    }
    else if (field.fieldType === "temporal" ) {
      s[field.fieldName] = {
        type: "string",
        distinct: 1000,
        max: 999,
        min: 0,
        missing: 0
        };
    }
    return s;
  }, {
    '*': {
      max: 1000,
      min: 0
    }
  });
}

module.exports = {
  VegaLiteFeature: VegaLiteFeature,
  vl2vlf: vl2vlf,
  Field, Field,
  Mapping: Mapping,
  remap: remap,
  fakeStats : fakeStats
};