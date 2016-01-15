function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

// usage example:
// var a = ['a', 1, 'a', 2, '1'];
// var unique = a.filter( onlyUnique ); // returns ['a', 1, 2, '1']
module.exports ={
  unique: function(array){
    return array.filter(onlyUnique);
  }
}