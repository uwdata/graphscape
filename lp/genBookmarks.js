var vl = require('./js/vega-lite');
var csv = require("fast-csv");
var fs = require('fs');
var bookmarks = [];
var pidWithSessions = [];

csv.fromPath("bookmarks.csv", {headers: true})
   .on("data", function(data){
     var id = data.pid + "_" + data.session;
     var action = data.action;
     var vlspec = "";
     if (action === "BOOKMARKS_CLEAR") {
       bookmarks[bookmarks.length-1].specs = [];
     }
     else {
       vlspec = vl.shorthand.parse(data.shorthand);
       vlspec.mark = vlspec.mark.toLowerCase();
       if (action === "BOOKMARK_ADD") {
         if ( pidWithSessions.indexOf(id) <0 ) {
           pidWithSessions.push(id);
           bookmarks.push({id: id, data: data.dataset, specs: [ vlspec ]});
         }
         else {
           bookmarks[bookmarks.length-1].specs.push(vlspec);
         }
       }
       else {

         bookmarks[bookmarks.length-1].specs = bookmarks[bookmarks.length-1].specs.filter(function(spec){
           return JSON.stringify(spec) !== JSON.stringify(vlspec);
         });

       }
     }
   })
   .on("end", function(){
     fs.writeFileSync("bookmarks.json", JSON.stringify(bookmarks));
    //  console.log(bookmarks);
   });
