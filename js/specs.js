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
