
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
  dataExtension();


  var transitionCostMatrix = new Matrix("rank");
  transitionCostMatrix.import(JSON.parse(JSON.stringify(transitionSets)));
  var sortedTransitionSetsByRank = BEA(transitionCostMatrix, { fixFirst: true }).rows;

  transitionCostMatrix = new Matrix("cost");
  transitionCostMatrix.import(JSON.parse(JSON.stringify(transitionSets)));
  var sortedTransitionSetsByCost = BEA(transitionCostMatrix, { fixFirst: true }).rows;



  $('#clustering-rank').on('click',function(){
    $('svg').remove();
    visualization(sortedTransitionSetsByRank,"rank");
  })
  $('#clustering-cost').on('click',function(){
    $('svg').remove();
    visualization(sortedTransitionSetsByCost,"cost");
  })
  $('#raw-rank').on('click',function(){
    $('svg').remove();
    visualization(transitionSets,"rank");
  })
  $('#raw-cost').on('click',function(){
    $('svg').remove();
    visualization(transitionSets,"cost");
  })

});

function visualization(transitionSets, valueAttr){
  var n = specs.length;
  var width = $('#transitions').width();

  var padding = { left:30, top: 30 };
  var boxSize = { w: 12, h:12 };
  var boxInterval = { x: 1, y:1 };
  var height = specs.length * (boxSize.w+boxInterval.x) + 50;
  var vis = d3.select('#transitions')
                .append("svg:svg");

  var matrixG = vis.attr("width",width)
                 .attr("height",height)
                 .append("g");


  var min = 999, max = -1;
  for (var i = 0; i < transitionSets.length; i++) {
    for (var j = 0; j < transitionSets[i].length; j++) {
      if (transitionSets[i][j][valueAttr] < min) {
        min = transitionSets[i][j][valueAttr]
      }
      if (transitionSets[i][j][valueAttr] > max) {
        max = transitionSets[i][j][valueAttr]
      }
    }
  }
  var color = d3.scale.linear()
    .domain([min,max])
    .range(["white","red"]);

  matrixG.selectAll(".row")
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
          .attr("fill", function(d,i,j){ return color(d[valueAttr]); })
          .on("mouseover", function(d){
            draw("#visS", specs[d.start], visData);
            draw("#visD", specs[d.destination], visData);
            var transitionDetails = "Marktype : " + transDetails(d.marktype) + "<br>";
            transitionDetails += "Transform : " + transDetails(d.transform) + "<br>";
            transitionDetails += "Encoding : " + transDetails(d.encoding) + "<br>";
            transitionDetails += valueAttr + " : " + d[valueAttr] + "<br>";
            $("#transitionsList").html(transitionDetails);
          });


  function transDetails(transitions){
    return transitions.map(function(trans){
              return trans.name;
           }).join(", ");
  }
}

function dataExtension(){

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
    .rangePoints([0,uniqueCosts.length]);

  for (var i = 0; i < transitionSets.length; i++) {
    for (var j = 0; j < transitionSets[i].length; j++) {
      transitionSets[i][j]["start"] = i;
      transitionSets[i][j]["destination"] = j;
      transitionSets[i][j]["rank"] = Math.floor(rank(transitionSets[i][j].cost));
    }
  }
}
