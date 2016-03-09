'use strict';
var fs = require('fs');
var cpTrans = require('./bower_components/viscompass/src/trans/trans');

var bookmarks = JSON.parse(fs.readFileSync('bookmarks.json','utf8'));
var ruleSet = JSON.parse(fs.readFileSync('ruleSet.json','utf8'));
var transitionSets = [];
bookmarks = bookmarks.splice(1,1);

for (var k = 0; k < bookmarks.length; k++) {
  transitionSets = [];
  for (var i = 0; i < bookmarks[k].specs.length; i++) {
    transitionSets.push([]);
    for (var j = i; j < bookmarks[k].specs.length; j++) {
      console.log(i,j);
      transitionSets[i].push(cpTrans.transitionSet(bookmarks[k].specs[i], bookmarks[k].specs[j], ruleSet, { omitIncludeRawDomin: true }));
    }
  }
  bookmarks[k].transitionSets = transitionSets;
}

var getBookmarksFile = "var bookmarks = ";
fs.writeFileSync('./js/get-bookmarks.js',getBookmarksFile + JSON.stringify(bookmarks) + ";");
