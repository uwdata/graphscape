function Matrix(valueAttr, rowN, colN){
  var that = this;
  var data;
  if (arguments[1] !== undefined && arguments[2] !== undefined) {
    data = new Array(rowN);
    for (var i = 0; i < data.length; i++) {
      data[i] = new Array(colN);
      for (var j = 0; j < data[i].length; j++) {
        data[i][j] = {};
        data[i][j][valueAttr] = Math.floor(Math.random()*100)%2;
      }
    }
  }
  else {
    data =[];
  }
  this.valueAttr = valueAttr;
  this.import = function(doubleArray){
    data = doubleArray;
    that.rows = data;
  }
  this.col = function(j){
    return data.map(function(row){
      return row[j];
    });
  }
  this.colN = function(j){
    return data[0].length;
  }
  this.rows = data;
  this.row = function(i){
    return data[i];
  }
  this.rowN = function(){
    return data.length;
  }
  this.display = function(){
    for (var i = 0; i < data.length; i++) {
      var line = [];
      for (var j = 0; j < data[i].length; j++) {
        line.push(data[i][j][valueAttr]);
      }
      console.log(line.join(" "));
    }
    return this
  }
  this.pushRow = function(row){
    data.push(row);
  }
  this.transpose = function(){
    var newData = [];
    for (var j = 0; j < that.colN(); j++) {
      newData.push(that.col(j))
    }
    data = JSON.parse(JSON.stringify(newData));
    that.rows = data;
    return this;
  }
}


function BEA(M, options){
  function bondEnergy(v1, v2, valueAttr){
    var BE = 0;
    for (var i = 0; i < v1.length; i++) {
      BE += Math.pow(v1[i][valueAttr] - v2[i][valueAttr],2);
    }
    return BE
  }
  function BEArow(RM,options){
    var CM = new Matrix(RM.valueAttr);
    var fixedFirst;
    if (options.fixFirst) {
      fixedFirst = RM.rows.splice(0,1);
    }

    var selectedRow = RM.rows.splice(0,1);
    CM.pushRow(selectedRow[0]);

    var minBE = 0, minBE_CM_i = 0, minRemained_i = 0;

    while ( RM.rowN() > 0) {
      minBE = Infinity;
      minBE_CM_i = 0;
      minRemained_i = 0;

      for (var remained_i = 0; remained_i < RM.rowN(); remained_i++) {
        var remainedRow = RM.row(remained_i);
        for (var CM_i = 0; CM_i <= CM.rowN(); CM_i++) {
          var BE = 0;

          if (CM_i === 0) {
            BE = bondEnergy(CM.row(CM_i), remainedRow, RM.valueAttr);

            if (options.fixFirst) {
              BE += bondEnergy(fixedFirst, remainedRow, RM.valueAttr);
            }
          }
          else if( CM_i === CM.rowN()) {
            BE = bondEnergy(CM.row(CM_i-1), remainedRow, RM.valueAttr);
          }
          else {
            BE = bondEnergy(CM.row(CM_i-1), remainedRow, RM.valueAttr) + bondEnergy(CM.row(CM_i), remainedRow, RM.valueAttr) - bondEnergy(CM.row(CM_i), CM.row(CM_i-1), RM.valueAttr)
          }

          if (minBE > BE) {
            minBE = BE;
            minBE_CM_i = CM_i;
            minRemained_i = remained_i;
          }
        }
      }

      CM.rows.splice(minBE_CM_i, 0, RM.rows.splice(minRemained_i,1)[0]);
    }
    if(options.fixFirst){
      CM.rows.splice(0,0,fixedFirst[0]);
    }
    return CM;
  }
  var CM1 = BEArow(M, options);
  return BEArow(CM1.transpose(), options).transpose();
}


module.exports = {
  Matrix: Matrix,
  BEA: BEA
};
