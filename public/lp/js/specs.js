
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

  var specsDiv  = $('#specs');
  if (!isEmpty(specsDiv)) {
    for (var i = 0; i < specs.length; i++) {
      var VLdiv = $("<div id='vega-lite-" + i + "'></div>").attr("class","col-xs-12 col-md-3");
      specsDiv.append(VLdiv);
      draw("#vega-lite-" + i, specs[i], visData);

    }
  }




});