self.onmessage = function(e) {
  importScripts('../js/compass.js');
  importScripts('../js/serialize-web.js');
  serializer.serialize(e.data.specs, e.data.ruleSets, e.data.options, function(serializedSpecs){ 
    self.postMessage(serializedSpecs);
  });
  
};

// self.addEventListener('message', function(e) {
  
// }, false);
// console.log(serializer);