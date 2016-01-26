var temp;
var editor;
var editor2;
$(document).on('ready page:load', function () {
  var refSpecID ;
  var specCoordinates;
  var specs = [];
  var specRaw;
  var specRaws;
  var humanAnswers;



  if( $('#spec-coordinates').length !== 0 ){
    specCoordinates = $('#spec-coordinates').data('spec-coordinates');
    specs = [];
    specRaws =  $('#specs').data('specs');


    for (var i = 0; i < specRaws.length; i++) {
      specRaw = JSON.parse(specRaws[i].json);
      specs.push(new VegaLiteFeature(specRaw.marktype, specRaw.channels, specRaw.mapping, specRaw.fields, specRaw.channelProperties ));
    };




    console.log(specCoordinates);

    var w = $('#vis-map').width()
    var h = w;
    var c10 = d3.scale.category10();

    //Create SVG element
    var svg = d3.select("div#vis-map")
      .append("svg")
      .attr("width", w)
      .attr("height", h)
      .call(d3.behavior.zoom().on("zoom", function () {
        svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
        d3.selectAll("circle").attr("r", 7/d3.event.scale );
      }))
      .append("g");




    var container = svg
      .append("g");

    container.selectAll("circle")
      .data(specCoordinates)
      .enter()
      .append("circle")
      .attr("cx", function(d){ return d[0]*100+w/2; })
      .attr("cy", function(d){ return d[1]*100+h/2; })
      .attr("r", 10)
      .style("opacity", 0.4)
      .style("fill", function(d,i){

        return c10(specs[i].channels.length);
      })
      .on("mouseover",function(d,i){
        draw('#vis', specs[i]);
      });


    // svg.on("mousedown",function(event){
    //   d3.selectAll("circle")
    //     .attr("cx", function(d){ return d.x1*100+w/2; })
    //     .attr("cy", function(d){ return d.x2*100+h/2; });
    // });

  }



});
