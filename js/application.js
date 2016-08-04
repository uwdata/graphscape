function draw(selector, spec, specAdjustment, callback){
  if(specAdjustment){
    for (var i = 0; i < specAdjustment.length; i++) {
      spec[specAdjustment[i].key] = specAdjustment[i].value
    }
  }
  if (spec.mark === "null") {
    $(selector).append("<svg></svg id='null-vis'>");
    return;
  };
  var vgSpec = vl.compile(spec).spec;
  vgSpec.description = spec.description
  
  if (spec.encoding.x && spec.encoding.x.axis  && spec.encoding.x.axis.labelAngle) {
    vgSpec.marks[0].axes[0].properties.labels.align = "left";
  };

  vg.parse.spec(vgSpec, function(chart) {
    chart({el: selector, renderer:"svg"}).update();

    if (vgSpec.description) {
      var yOffset = 30;
      var yOffsetText = 15;
      
      if(spec.encoding.column && !(typeof(spec.encoding.column.axis) !== "undefined" &&  spec.encoding.column.axis.labels === false)){
        yOffset = 30;
        yOffsetText = -20;
      }

      var svg = d3.select(selector+" svg");
      svg.attr("height", Number(svg.attr("height")) + yOffset)
         .select("g")
           .append("text")
           .text(vgSpec.description)
           .attr("y", yOffsetText)
           .attr("x",-40)
           .style("font-size","14px")
           .style("font-weight","bold")
           .style("font-family", "sans-serif")
           .style("fill", 'rgb(0, 0, 0)');

      svg.select("g.mark-group")
           .attr("transform","translate(0," + yOffset + ")");
    }

    if(callback){
      callback(selector, spec, specAdjustment);
    }
  });
}

function isEmpty( el ){
    return el.length === 0;
}