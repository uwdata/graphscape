$(document).on('ready page:load', function () {
  var ruleSets;  
  var results;

  $.ajax({
    url: "data/ruleSet.json",
    dataType: 'json',
    async: false,
    success: function(data){
      ruleSets = data;

    }
  })

  var worker = new Worker('js/sequence-worker.js');
  

  $('#toggle-show-all').on('click',function(e){
    if (!$(this).hasClass('active')) {
      $('#sorted-result .not.optimum').removeClass('hidden');  
      $(this).addClass('active');
      $(this).text('Show Optimum Only');
    } else {
      $('#sorted-result .not.optimum').addClass('hidden');
      $(this).removeClass('active');
      $(this).text('Show All');
    }
  });

  $('#toggle-pattern-score').on('click',function(e){
    if ($(this).hasClass('active')) {
      results = results.sort(function(a,b){
        if (a.distance > b.distance) {
          return 1;
        }
        if (a.distance < b.distance) {
          return -1;
        } else {
          return a.sequence.join(',') > b.sequence.join(',') ? 1 : -1; 
        }
        return 0;
      });
      var minDistance = results[0].distance;
      for (var i = 0; i < results.length; i++) {
        if(results[i].distance === minDistance){
          results[i].isOptimum = true;
        }
        else { 
          results[i].isOptimum = false; 
        }
      }
      listButtons(results)
      $(this).removeClass('active');
      $(this).text('On Pattern Score');
      
    } else {
      results = results.sort(function(a,b){
        if (a.distanceWithPattern > b.distanceWithPattern) {
          return 1;
        }
        if (a.distanceWithPattern < b.distanceWithPattern) {
          return -1;
        } else {
          return a.sequence.join(',') > b.sequence.join(',') ? 1 : -1; 
        }
        return 0;
      });
      var maxdistanceWithPattern = results[0].distanceWithPattern;
      for (var i = 0; i < results.length; i++) {
        if(results[i].distanceWithPattern === maxdistanceWithPattern){
          results[i].isOptimum = true;
        }
        else { 
          results[i].isOptimum = false;
        }
      }

      listButtons(results);
      $(this).addClass('active');
      $(this).text('Off Pattern Score');
    }
    
  });


  $('#sort').on('click', function(e){
    
    
    var specs = JSON.parse($('#specs').val());
    var fixFirst = $('#fixfirst').is(':checked');
    
    // Run 
    $('#current-status').show(500, function(){

      worker.onmessage = function(e) {
        setTimeout(function(){ 
          $('#current-status').hide(500);  
        }, 1);
        results = e.data;
        if (!$('#toggle-pattern-score').hasClass('active')) {
          $('#toggle-pattern-score').addClass('active');
          $('#toggle-pattern-score').text('Off Pattern Score');
        }
        if ($('#toggle-show-all').hasClass('active')) {
          $('#toggle-show-all').removeClass('active');
          $('#toggle-show-all').text('Show All');
        }
        listButtons(results, fixFirst);
        
      }
      worker.postMessage({specs: specs, ruleSets: ruleSets, options: {"fixFirst": fixFirst}}); // Start the worker.
    });
  
  })
  function listButtons(results, fixFirst){

    $('#sorted-result .optimum').children().remove();
    $('#sorted-result .not.optimum').children().remove();
    $('#control-result').removeClass("hidden");

    for (var i = 0; i < results.length; i++) {
      var  sequence = results[i].sequence;
      if (!fixFirst) {
        sequence = sequence.map(function(chart){ return chart - 1;}).splice(1);
      };

      var link = $('<button href="#" data-id="'+i+'"></button>')
                  .html(sequence.join(',') + ' | ' + Math.round(results[i].distanceWithPattern*100)/100 )
                  .addClass('result btn btn-xs')
                  .data('result', results[i]);
      
      if (results[i].isOptimum) { 
        link.addClass('btn-primary');
        $('#sorted-result .optimum').not('.not').append(link);
      }
      else {
        link.addClass('btn-default');
        $('#sorted-result .not.optimum').append(link);
      };
      
    };

    $('.result').on('click', function(){
      drawingByOrder(results[$(this).data('id')]);
      console.log(results[$(this).data('id')]);
    });
  }



  function drawingByOrder(result){
    var specs = result.specs;

    var metaInfo = "Sum of distances\t\t: " + result.distance + "<br/>"
                 + "Pattern  Score\t\t: " + result.patternScore + "<br/>"
                 + "Distance with Pattern Score\t\t: " + result.distanceWithPattern + "<br/>"
                 + "TieBreak Score\t\t: " + result.tiebreakScore + "<br/>"
                 + (Object.keys(result.tiebreakReasons).length > 0 ? "TieBreak Reasons    : " + JSON.stringify(result.tiebreakReasons) + "<br/>" : "" );

    $('#sequence-meta-info').html(metaInfo);


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
