
// $(document).on('ready page:load', function () {

var marktypesAll = ['bar','point','line','area'];
// var marktypesAll = ['point'];
var channelsAll = ['x','y','shape','color','size','row','column'];
var fieldsAll = [];
var fieldTypeAll = ['O','Q'];
//Generate whole states(nodes) and edges
var nodes = [];
var edges = [];


nodes.has = function(node){
  var returnNode = false;

  for (var i = this.length - 1; i >= 0; i--) {

    var childNode = this[i];
    if ( (JSON.stringify(childNode.mappings) === JSON.stringify(node.mappings))
      && (childNode.marktype === node.marktype)){
        returnNode = childNode;
        break;
    };

  };

  return returnNode;
}




var Counters = (function (){
  var Count = -1;
  return [ function() {
    // console.log(Count);
    return Count += 1; },
    function() {
      // console.log(Count);
      return Count -= 1; }];
})();

var nodeIDCountUp = Counters[0];
var nodeIDCountDown = Counters[1];
var edgeIDCounter = (function (){
  var Count = -1;
  return function() {
    console.log(Count);
    return Count += 1; };
})();

//ex node = { 'marktype': 'points', channels: ['x','y'], 'mappings': {'x': 'Q' ,'y': 'Q' } };
function Node (marktype, channels, mappings) {

  this.nodeID = nodeIDCountUp();

  var that = this;
  this.marktype = marktype !== undefined ? JSON.parse(JSON.stringify(marktype)) : 'point' ; // default marktype is 'point'
  this.channels = channels !== undefined ? JSON.parse(JSON.stringify(channels)) : [];
  this.mappings = mappings !== undefined ? JSON.parse(JSON.stringify(mappings)) : { x: "", y: "",shape:"",color:"",size:"",row: "",column: "" };
  this.swappedChannels = { x: "", y: "",shape:"",color:"",size:"",row: "",column: "" };
  this.isSwapped = false;
  this.isSorted = false;
  this.sortedBy = [];
  this.isAxisScaled = false;
  this.axisScaledBy = [];

  this.info = function(){
    return "marktype : " + that.marktype
          + "<br/>mappings : " + JSON.stringify(that.mappings)
          + "<br/>swappedChannels : " + JSON.stringify(that.swappedChannels)
          + "<br/>sortedBy : " + JSON.stringify(that.sortedBy)
          + "<br/>groupNum : " + that.groupNum();
  }

  this.remainedChannels = function (){
    var unmappedChannels = [];
    channelsAll.forEach(function(channel){

      if (that.channels.indexOf(channel) < 0){
        unmappedChannels.push(channel);
      }
    });
    return unmappedChannels;
  };


  this.addMapping = function(newChannel, fieldType){
    that.mappings[newChannel] = fieldType;
    that.channels.push(newChannel);
  };

  this.checkConstraints = function(newMarktype, newChannel, newFieldType) {

    var possessingChannels = that.channels.slice(0);
    var possessingMappings = JSON.parse(JSON.stringify(that.mappings));
    var checkingMarktype = newMarktype === undefined ? that.marktype : newMarktype;
    if ( newChannel !== undefined && newFieldType !== undefined ){
      possessingChannels.push(newChannel);
      possessingMappings[newChannel] = newFieldType;
    }


    //constraitns about channels
    for (var i = 0; i < possessingChannels.length; i++) {
      var channel = possessingChannels[i];

      if (channel==='row' || channel==='column'|| channel==='shape' ) {
        if( possessingMappings[channel] === 'Q')
          return false;
      };

      if ( channel==='size' || channel === 'shape'){
        if (checkingMarktype==='bar' || checkingMarktype==='line' || checkingMarktype==='area' ) {
          return false;
        }
      };
    };

    //At least, either x:q or y:q should exists.
    if( possessingMappings['x']!== 'Q' && possessingMappings['y']!== 'Q'){
      if (!( possessingMappings['x'] === 'O' && possessingMappings['y'] === 'O'))
        return false;
    }


    //constraitns about marktype
    if ( checkingMarktype !== "point" ){
      if (!( (possessingChannels.indexOf('x') >= 0) && (possessingChannels.indexOf('y') >= 0)
          && (possessingChannels.indexOf('shape') < 0) && (possessingChannels.indexOf('size') < 0)))
        return false;
    }
    if (checkingMarktype === 'bar'){
      if( (possessingMappings["x"] !== "O") && (possessingMappings["y"] !== "O") ) {
        return false;
      };
    }

    return true;
  }



  this.neighbors = function(){
    var connectedEdges = nodeToEdges[that.nodeID];
    var returnNeighbors = [];
    connectedEdges.forEach(function(edge){
      if( edges[edge].source.nodeID !== that.nodeID)
        returnNeighbors.push(edges[edge].source.nodeID)
      else
        returnNeighbors.push(edges[edge].target.nodeID)
    })
    return returnNeighbors;
  }

  this.sortedNodes = function(){
    var returnSortedNodes = []

    that.channels.forEach(function(channel){
      var sortedNode;
      if(that.mappings[channel]==="O"){
        if(channel === "row" || channel === "col"){

          sortedNode = new Node(that.marktype, that.channels, that.mappings);
          sortedNode.isSorted = true;
          sortedNode.sortedBy.push(channel);
          returnSortedNodes.push(sortedNode);

        }
        if(channel === "x" || channel === "y"){
          if (marktype==="bar") {
            sortedNode = new Node(that.marktype, that.channels, that.mappings);
            sortedNode.isSorted = true;
            sortedNode.sortedBy.push(channel);
            returnSortedNodes.push(sortedNode);

          };
        }
      }
    });

    return returnSortedNodes;
  }

  this.axisScalable = function(){

    that.channels.forEach(function(channel){
      if(that.mappings[channel] === "Q"){
        if(channel === "x" || channel === "y"){
          return true;
        }
      }
    });

    return false;
  }

  this.swapping = function(){
    var results = [];

    for (var i = 0; i < that.channels.length; i++) {
      var channel_i = that.channels[i];
      var fieldType_i = that.mappings[channel_i];

      for (var j = i+1; j < that.channels.length; j++) {
        var channel_j = that.channels[j];
        var fieldType_j = that.mappings[channel_j];
        var validSwapping = false;
        var swappedNode = new Node(that.marktype, that.channels, that.mappings);
        swappedNode.mappings[channel_j] = fieldType_i;
        swappedNode.mappings[channel_i] = fieldType_j;

        if (fieldType_j===fieldType_i) {
          swappedNode.swappedChannels[channel_i] = fieldType_j;
          swappedNode.swappedChannels[channel_j] = fieldType_i;
          swappedNode.isSwapped = true;
          validSwapping = true;
        }
        else if (swappedNode.checkConstraints()) {
          swappedNode.swappedChannels[channel_i] = fieldType_j;
          swappedNode.swappedChannels[channel_j] = fieldType_i;

          validSwapping = true;
        }
        else
          nodeIDCountDown();

        if(validSwapping){
          var hasAlready = nodes.has(swappedNode);

          if( !hasAlready || swappedNode.isSwapped ){
            nodes.push(swappedNode);
            swappedNode.isSwapped = true;
            newChildrenNode.push(swappedNode);
            edges.push({ edgeID: edgeIDCounter(), source: that, target: swappedNode });
          }
          else if(!hasAlready.isSorted){
            nodeIDCountDown();
            edges.push({ edgeID: edgeIDCounter(), source: that, target: hasAlready });
          }
        }

      };

    };

    return results;

  }

  this.groupNum = function() {
    return 1 + (that.channels.length-1)*2 + (that.isSwapped || that.isSorted ? 1 : 0)  ;
  }
}

var newChildrenNode = [];

function branchingByPropertise(node){
  var swappedNodes = node.swapping();

  // for (var i = 0; i < swappedNodes.length; i++) {
  //   var swappedNode = swappedNodes[i]

  // };

  var sortedNodes = node.sortedNodes();

  for (var i = 0; i < sortedNodes.length; i++) {
    var sortedNode = sortedNodes[i];
    nodes.push(sortedNode);
    newChildrenNode.push(sortedNode);
    edges.push({ edgeID: edgeIDCounter(), source: node, target: sortedNode });
  };

}

function branching(node){
  node.remainedChannels().forEach(function(newChannel){
    fieldTypeAll.forEach(function(newFieldType){
      marktypesAll.forEach(function(newMarktype){

        if(node.checkConstraints(newMarktype, newChannel,newFieldType)){

          var newChildNode = new Node(newMarktype, node.channels, node.mappings);
          newChildNode.addMapping(newChannel, newFieldType);

          var hasAlready = nodes.has(newChildNode);

          if( !hasAlready ){
            nodes.push(newChildNode);
            newChildrenNode.push(newChildNode);
            edges.push({ edgeID: edgeIDCounter(), source: node, target: newChildNode });

            //branching by properties(sorting, scaling, swapping)
          }
          else{

            nodeIDCountDown();
            edges.push({ edgeID: edgeIDCounter(), source: node, target: hasAlready });
          }
        }
      });
    });
  });

}



var node1 = new Node();
var node2 = new Node();
node1.addMapping('x','Q');
node2.addMapping('y','Q');

nodes.push(node1)
nodes.push(node2)

var parentNodes =[node1, node2];
newChildrenNode = [];

parentNodes.forEach(function(parent){
  branching(parent);
});

parentNodes = newChildrenNode.slice(0);
newChildrenNode = [];

for (var i = 0; i < parentNodes.length; i++) {
  branchingByPropertise(parentNodes[i]);
};

// newChildrenNode = [];

// parentNodes.forEach(function(parent){
//   branching(parent);
// });

// parentNodes = newChildrenNode.slice(0);
// newChildrenNode = [];

// for (var i = 0; i < parentNodes.length; i++) {
//   branchingByPropertise(parentNodes[i]);
// };


// newChildrenNode = [];

// parentNodes.forEach(function(parent){
//   branching(parent);
// });

// parentNodes = newChildrenNode.slice(0);
// newChildrenNode = [];

// for (var i = 0; i < parentNodes.length; i++) {
//   branchingByPropertise(parentNodes[i]);
// };

var nodeToEdges = new Array(nodes.length)
  edges.forEach(function(edge){
  if (nodeToEdges[edge.source.nodeID]===undefined) {
    nodeToEdges[edge.source.nodeID] = [];
  };
  if (nodeToEdges[edge.target.nodeID]===undefined) {
    nodeToEdges[edge.target.nodeID] = [];
  };
  nodeToEdges[edge.source.nodeID].push(edge.edgeID);
  nodeToEdges[edge.target.nodeID].push(edge.edgeID);
})
// parentNodes = [].concat(newChildrenNode);
// childrenNode = [];
// parentNodes.forEach(function(parent){
//   branching(parent);
// });
// nodes = nodes.concat(newChildrenNode);
