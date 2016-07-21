self.onmessage = function(e) {
  importScripts('../js/compass.min.js');
  importScripts('../js/serialize-web.js');
  serializer.serialize(e.data.specs, e.data.ruleSets, e.data.options, function(serializedSpecs){ 
    self.postMessage(serializedSpecs.all);
  });
  
};

// self.addEventListener('message', function(e) {
  
// }, false);
// console.log(serializer);