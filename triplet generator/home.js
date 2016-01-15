

$(document).on('ready page:load', function () {

  var width = $('body').width(),
      height = $('body').height();

  var color = d3.scale.category20();
  color.domain([1,2,3,4,5,6,7,8]);

  var force = d3.layout.force()
      .charge(-70)
      .linkDistance(50)
      .size([width, height]);

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);


  force
      .nodes(nodes)
      .links(edges)


  var link = svg.selectAll(".link")
      .data(edges)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return 1; });

  var node = svg.selectAll(".node")
      .data(nodes)
    .enter().append('g')
      .attr("class", "node")
      .append("circle")
      .attr("r", 7)
      .style("fill", function(d) { return color(d.groupNum()); })
      .call(force.drag);

  svg.selectAll(".node")
    .on("mouseover",function(d){
        $('#info').html(d.info());
        var d_node = d;
        //1. find edges
        var connectedLinks = nodeToEdges[d.nodeID];
        var neighbors = d_node.neighbors();
        neighbors.push(d_node.nodeID);

        //2. highlight them
        d3.selectAll(".link")
          .style("stroke-width",function(e_d){
            if( connectedLinks.indexOf(e_d.edgeID) >=0 )
              return 3;
            else
              return 1;
          })
          .style("stroke",function(e_d){
            if( connectedLinks.indexOf(e_d.edgeID) >=0 )
              return '#000';
            else
              return '#999';
          });

        d3.selectAll(".node circle")
          .style("opacity", function(n_d) {
            if( neighbors.indexOf(n_d.nodeID) >= 0 )
              return 1.0;
            else
              return 0.3;
          });

      })
    .on("mouseout",function(d){
        d3.selectAll(".link")
          .style("stroke-width",1)
          .style("stroke",'#999');
        d3.selectAll(".node circle")
          .style("opacity",1);
      });


  // node.append("title")
  //     .text(function(d) { return d.nodeID; });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  });

  force.start();
});