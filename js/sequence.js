$(document).on('ready page:load', function () {

  var transitionSets, specs, TSPresult;
  $.ajax({
    url: "result/transitionSets.json",
    dataType: 'json',
    async: false,
    success: function(data){
      transitionSets = data;
      dataExtension();
    }
  });
  $.ajax({
    url: "result/specs.json",
    dataType: 'json',
    async: false,
    success: function(data){
      specs = data;
    }
  })
  $.ajax({
    url: "result/TSPresult.json",
    dataType: 'json',
    async: false,
    success: function(data){
      TSPresult = data;
      TSPresult.map(function(bestSequence){
        $('#best-sequences').append('<span>'+bestSequence.sequence.join(',')+'</span>').append(" / ");
      })
    }
  })

  var defaultOrder = TSPresult[0].sequence;
  $('#order').val(defaultOrder.join(','));
  drawingByOrder(defaultOrder);
  $('#score').html(totalDist(defaultOrder,"rank"));
  $('#submit').on('click',function(e){
    var newOrder = $('#order').val()
                              .trim()
                              .split(',')
                              .map(function(item){ return Number(item); });

    drawingByOrder(newOrder);
    $('#score').html(totalDist(newOrder,"rank"));
  })
  $('#random').on('click',function(e){
    var newOrder = $('#order').val()
                              .trim()
                              .split(',')
                              .map(function(item){ return Number(item); });
    newOrder = shuffle(newOrder);
    $('#order').val(newOrder);
    drawingByOrder(newOrder);
    $('#score').html(totalDist(newOrder,"rank"));
  })

  function dist(i,j,valueAttr){
    return transitionSets[i][j][valueAttr];
  }

  function totalDist(order, valueAttr) {
    var sum = order.reduce(function(prev,curr,i){

      if (i === 0) {

        return 0;
      }

      var currSpecIndex = curr;
      var prevSpecIndex = order[i-1];

      console.log(prev,prevSpecIndex,currSpecIndex);
      return prev += dist(prevSpecIndex,currSpecIndex, valueAttr);

    },0);
    console.log(order,sum);
    return sum;
  }

  function drawingByOrder(order){
    var specsDiv  = $('#specs');
    specsDiv.children().remove();
    if (!isEmpty(specsDiv)) {
      for (var i = 0; i < specs.length; i++) {
        var VLdiv  = $("<div id='vega-lite-" + i + "'></div>").attr("class","col-md-12 col-xs-12");

        VLdiv.remove("span");
        specsDiv.append(VLdiv);
        draw("#vega-lite-" + i, specs[order[i]]);
        var distSpan = $("<span></span>");
        if (i>0) {
           distSpan.html( "cost from the upper to lower : " +  dist(order[i-1],order[i],'rank') );
        }
        VLdiv.append(distSpan);
      }
    }
  }


  function shuffle(array) {
    var copy = [], n = array.length, i;
    while (n) {
      i = Math.floor(Math.random() * n--);
      copy.push(array.splice(i, 1)[0]);
    }
    return copy;
  }

  function dataExtension(){

    var flattendCosts = transitionSets.reduce(function(prev,curr){
      for (var i = 0; i < curr.length; i++) {
        prev.push(curr[i].cost);
      };
      return prev;
    }, []);
    var uniqueCosts = d3.set(flattendCosts)
                        .values()
                        .map(function(val){ return Number(val); })
                        .sort(function(a,b){ return a-b;});

    var rank = d3.scale.ordinal()
      .domain(uniqueCosts)
      .rangePoints([0,uniqueCosts.length]);

    for (var i = 0; i < transitionSets.length; i++) {
      for (var j = 0; j < transitionSets[i].length; j++) {
        transitionSets[i][j]["start"] = i;
        transitionSets[i][j]["destination"] = j;
        transitionSets[i][j]["rank"] = Math.floor(rank(transitionSets[i][j].cost));
      }
    }
  }
});
