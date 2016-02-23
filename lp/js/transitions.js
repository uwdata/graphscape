
function isEmpty( el ){
    return el.length === 0;
}
function draw(selector, spec, data){
  spec.data = { "values": data };
  var vgSpec = vl.compile(spec).spec;
  vg.parse.spec(vgSpec, function(chart) {
    chart({el: selector, renderer:"svg"}).update();
  });
}

$(document).on('ready page:load', function () {
  var n = specs.length;
  var width = $('#transitions').width();
  var height = width;
  var padding = { left:30, top: 30 };
  var boxSize = { w: 12, h:12 };
  var boxInterval = { x: 1, y:1 };
  var vis = d3.select('#transitions')
                .append("svg:svg");

  var matrix = vis.attr("width",width)
                 .attr("height",height)
                 .append("g");

  // var minCost = 999, maxCost = -1;
  // for (var i = 0; i < transitionSets.length; i++) {
  //   for (var j = 0; j < transitionSets[i].length; j++) {
  //     if (transitionSets[i][j].cost < minCost) {
  //       minCost = transitionSets[i][j].cost
  //     }
  //     if (transitionSets[i][j].cost > maxCost) {
  //       maxCost = transitionSets[i][j].cost
  //     }
  //   }
  // }

  var flattendCosts = transitionSets.reduce(function(prev,curr){
    for (var i = 0; i < curr.length; i++) {
      prev.push(curr[i].cost);
    };
    return prev;
  }, []);
  var uniqueCosts = d3.set(flattendCosts)
                      .values()
                      .map(function(val){ return Number(val); })
                      .sort(function(a,b){ return a-b;});

  var rank = d3.scale.ordinal()
    .domain(uniqueCosts)
    .rangePoints([uniqueCosts[0], uniqueCosts[uniqueCosts.length-1]]);

  var color = d3.scale.linear()
    .domain([uniqueCosts[0],uniqueCosts[uniqueCosts.length-1]])
    .range(["white","red"]);


  matrix.selectAll(".row")
      .data(transitionSets)
      .enter()
        .append("g")
        .attr("class","row")
        .selectAll("rect")
        .data(function(d){ return d; })
        .enter()
          .append("rect")
          .attr("class", "transitions")
          .attr("x",function(d,destination,start){ return destination * (boxSize.w + boxInterval.x) + padding.left; })
          .attr("y",function(d,destination,start){ return start * (boxSize.h + boxInterval.y) + padding.top; })
          .attr("width", boxSize.w)
          .attr("height", boxSize.h)
          .attr("fill", function(d,i,j){ return color(rank(d.cost)); })
          .on("mouseover", function(d,destination,start){
            draw("#visS", specs[start], visData);
            draw("#visD", specs[destination], visData);
            var transitionDetails = "Marktype : " + transDetails(d.marktype) + "<br>";
            transitionDetails += "Transform : " + transDetails(d.transform) + "<br>";
            transitionDetails += "Encoding : " + transDetails(d.encoding) + "<br>";
            transitionDetails += "Cost : " + d.cost + "<br>";
            $("#transitionsList").html(transitionDetails);
          });


  function transDetails(transitions){
    return transitions.map(function(trans){
              return trans.name;
           }).join(", ");
  }

});