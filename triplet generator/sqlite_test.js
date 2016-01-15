var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("./result05/result.db")

db.serialize(function(){

  db.each("SELECT * FROM triplets LIMIT 5", function(err,row){
    console.log(row);
  });

})
db.close();