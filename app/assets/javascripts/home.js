$(document).on('ready page:load', function () {
  var specs = [];
  var specRaw;
  var spec;
  var specRaws;
  var edges;
  if ($('#generated-specs').length !== 0){
    edges = $('#edges').data('edges');
    edges = edges.map(function(edge){
      edge["source"] = edge.source_id - 1;
      edge["target"] = edge.target_id - 1;;
      return edge
    });
    specRaws =  $('#specs').data('specs');
    for (var i = 0; i < specRaws.length; i++) {
      specRaw = JSON.parse(specRaws[i].json);
      spec = new VegaLiteFeature(specRaw.marktype, specRaw.channels, specRaw.mapping, specRaw.fields, specRaw.channelProperties );
      spec.id = i;
      specs.push(spec);

    };
    console.log(edges);
    var width = $('#vis-map').width(),
        height = 500;

    var color = d3.scale.category20();

    var force = d3.layout.force()
        .charge(-500)
        .gravity(1)
        .linkDistance(100)
        .size([width, height]);

    var svg = d3.select("#vis-map").append("svg")
        .attr("width", width)
        .attr("height", height);

    force.nodes(specs)
         .links(edges)
         .start();

    var link = svg.selectAll(".link")
        .data(edges)
      .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return 0.1; });

    var node = svg.selectAll(".node")
        .data(specs)
      .enter().append("circle")
        .attr("class", "node")
        .attr("r", 5)
        .style("fill", function(d) { return color(d.channels.length); })
        .on("mouseover",function(d,i){
          draw('#vis', specs[i]);
        })
        .on("click", function(d,i){
          var neighbors = edges.filter(function(edge){
                  return edge.source_id === (i+1) || edge.target_id === (i+1)
            })
            .map(function(edge){
              return (edge.source_id === (i+1) ) ? edge.target_id : edge.source_id;
            });

          svg.selectAll(".node")
             .style("fill", function(f,j){
              if (j===i) {
                return "red";
              }
              return (neighbors.indexOf(j+1) >=0) ? color(f.channels.length) : 'lightgrey' ;
            });

        })
        .call(force.drag);

    node.append("title")
        .text(function(d) { return d.name; });

    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    });



  };

});