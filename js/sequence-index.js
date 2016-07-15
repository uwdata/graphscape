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
          var link = $('<button href="#" data-id="'+i+'"></button>').html(results[i].sequence.join(',') + ' | ' + Math.round(results[i].distance*100)/100 );
          link.addClass('result btn btn-default btn-xs');
          $('#sorted-result').append(link);

          
        };

        $('.result').on('click', function(){
          drawingByOrder(results[$(this).data('id')].specs);
        });
      }
      worker.postMessage({specs: specs, ruleSets: ruleSets, options: {"fixFirst": fixFirst}}); // Start the worker.
    });
  
  })




  function drawingByOrder(specs){
    var specsDiv  = $('#detail');
    specsDiv.children().remove();
    if (!isEmpty(specsDiv)) {
      for (var i = 0; i < specs.length; i++) {
        var VLdiv  = $("<div id='vega-lite-" + i + "'></div>").attr("class","col-md-12 col-xs-12");

        VLdiv.remove("span");
        specsDiv.append(VLdiv);
        draw("#vega-lite-" + i, specs[i]);
        // var distSpan = $("<span></span>");
        // if (i>0) {
        //    distSpan.html( "cost from the upper to lower : " +  dist(order[i-1],order[i],'rank') );
        // }
        // VLdiv.append(distSpan);
      }
    }
  }
});
