self.onmessage = function(e) {
  importScripts('../js/graphscape.js');
  graphscape.sequence.serialize(e.data.specs, null, e.data.options, function(serializedSpecs){ 
    self.postMessage(serializedSpecs);
  });
};
