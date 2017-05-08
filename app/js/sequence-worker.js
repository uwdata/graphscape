self.onmessage = function(e) {
  importScripts('../js/graphscape.js');
  var result = graphscape.sequence(e.data.specs, e.data.options);
  self.postMessage(result);
};
