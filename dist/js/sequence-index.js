$(document).on('ready page:load', function () {
  var ruleSets;  
  $.ajax({
    url: "data/ruleSet.json",
    dataType: 'json',
    async: false,
    success: function(data){
      ruleSets = data;

    }
  })

  var worker = new Worker('js/sequence-worker.js');
  


  $('#sort').on('click', function(e){
    var results;
    
    var specs = JSON.parse($('#specs').val());
    var fixFirst = $('#fixfirst').is(':checked');
    
    // Run 
    $('#current-status').show(500, function(){

      worker.onmessage = function(e) {
        setTimeout(function(){ 
          $('#current-status').hide(500);  
        }, 1);
        
        results = e.data;
        $('#sorted-result').children().remove();
        for (var i = 0; i < results.length; i++) {
          var link = $('<button href="#" data-id="'+i+'"></button>')
                      .html(results[i].sequence.join(',') + ' | ' + Math.round(results[i].globalScore*100)/100 );
          link.addClass('result btn btn-default btn-xs');
          link.data('result', results[i]);
          
          $('#sorted-result').append(link);

          
        };

        $('.result').on('click', function(){
          drawingByOrder(results[$(this).data('id')]);
          console.log(results[$(this).data('id')]);
        });
      }
      worker.postMessage({specs: specs, ruleSets: ruleSets, options: {"fixFirst": fixFirst}}); // Start the worker.
    });
  
  })




  function drawingByOrder(result){
    var specs = result.specs;

    var metaInfo = "Sum of distances : " + result.distance + "<br/>"
                 + "Pattern Score    : " + result.patternScore + "<br/>"
                 + "Global  Score    : " + result.globalScore + "<br/>"
    $('#sequence-meta-info').html(metaInfo)


    var specsDiv  = $('#sequence');
    specsDiv.children().remove();
    if (!isEmpty(specsDiv)) {
      for (var i = 0; i < specs.length; i++) {
        var newRowDiv = $("<div class='row'></div>");
        var VLdiv  = $("<div id='vega-lite-" + i + "'></div>").attr("class","col-xs-6");
        newRowDiv.append(VLdiv);
        draw("#vega-lite-" + i, specs[i]);
        if (i>0) {
          var TRdiv = $("<div></div>").attr("class","col-xs-6");
          var TRinfo = "Distance : " + result.transitionSet[i-1].cost + "<br/>"
                      + "Marktype  Transitions : " + JSON.stringify(result.transitionSet[i-1].marktype) + "<br/>"
                      + "Encoding  Transitions : " + JSON.stringify(result.transitionSet[i-1].encoding) + "<br/>"
                      + "Transform Transitions : " + JSON.stringify(result.transitionSet[i-1].transform); 
          TRdiv.html(TRinfo);
          newRowDiv.append(TRdiv);
          
        };
        specsDiv.append(newRowDiv);  
      }
    }
  }
});
