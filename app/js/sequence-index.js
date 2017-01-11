$(document).on('ready page:load', function () {
  
  var results,uniqDP,uniqD, rankSequenceCost, rankTransitionCosts, rankSequenceCostTie, rankTransitionCostsTie;


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
        if (a.sumOfTransitionCosts > b.sumOfTransitionCosts) {
          return 1;
        }
        if (a.sumOfTransitionCosts < b.sumOfTransitionCosts) {
          return -1;
        } else {
          return a.sequence.join(',') > b.sequence.join(',') ? 1 : -1; 
        }
        return 0;
      });
      var minSumOfTransitionCosts = results[0].sumOfTransitionCosts;
      for (var i = 0; i < results.length; i++) {
        if(results[i].sumOfTransitionCosts === minSumOfTransitionCosts){
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
        if (a.sequenceCost > b.sequenceCost) {
          return 1;
        }
        if (a.sequenceCost < b.sequenceCost) {
          return -1;
        } else {
          return a.sequence.join(',') > b.sequence.join(',') ? 1 : -1; 
        }
        return 0;
      });
      var maxSequenceCost = results[0].sequenceCost;
      for (var i = 0; i < results.length; i++) {
        if(results[i].sequenceCost === maxSequenceCost){
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

        allDP = results.map(overallDP).sort(function(a,b){ return a-b;});
        uniqDP = d3.set(results.map(overallDP))
                      .values()
                      .map(function(val){ return Number(val); })
                      .sort(function(a,b){ return a-b;});
                      

        allD = results.map(overallD).sort(function(a,b){ return a-b;});
        uniqD = d3.set(results.map(overallD))
                      .values()
                      .map(function(val){ return Number(val); })
                      .sort(function(a,b){ return a-b;});
                      



        rankSequenceCost = d3.scale.ordinal()
          .domain(uniqDP)
          .rangePoints([1, uniqDP.length]);

        rankTransitionCosts = d3.scale.ordinal()
          .domain(uniqD)
          .rangePoints([1, uniqD.length]);


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
      worker.postMessage({specs: specs, options: {"fixFirst": fixFirst}}); // Start the worker.
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
                  .html(sequence.join(',') + ' | ' + Math.round(results[i].sequenceCost*100)/100 )
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
    var specs = result.charts;

    var metaInfo =  "Rank(Pattern) : " + rankSequenceCost(overallDP(result)) + "<br/>"
                 + "Rank(Simple Sum) : " + rankTransitionCosts(overallD(result)) + "<br/>"
                 + "Rank(Pattern inc. ties) : " + (allDP.indexOf(overallDP(result))+1) + "<br/>"
                 + "Rank(Simple Sum inc. ties) : " + (allD.indexOf(overallD(result))+1) + "<br/>"
                 + "Sequence Cost : " + result.sequenceCost + "<br/>"
                 + "Sum of Transition Costs : " + result.sumOfTransitionCosts + "<br/>"
                 + "Global Weighting Term : " + result.globalWeightingTerm + "<br/>"
                 + "Patterns : " + JSON.stringify(result.patterns) + "<br/>"
                 + "Filter Sequence Cost : " + result.filterSequenceCost + "<br/>"
                 + (Object.keys(result.filterSequenceCostReasons).length > 0 ? "Filter Sequence Cost Details    : " + JSON.stringify(result.filterSequenceCostReasons) + "<br/>" : "" );

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
          var TRinfo = "Distance : " + result.transitions[i-1].cost + "<br/>"
                      + "Marktype  Transitions : " + JSON.stringify(result.transitions[i-1].marktype) + "<br/>"
                      + "Encoding  Transitions : " + JSON.stringify(result.transitions[i-1].encoding) + "<br/>"
                      + "Transform Transitions : " + JSON.stringify(result.transitions[i-1].transform); 
          TRdiv.html(TRinfo);
          newRowDiv.append(TRdiv);
          
        };
        specsDiv.append(newRowDiv);  
      }
    }
  }
});

function overallDP(d){
  return d.sequenceCost;
}
function overallD(d){
  return d.sumOfTransitionCosts;
}
