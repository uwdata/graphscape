var BookmarksMode = false;

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

  if(BookmarksMode){
    specs = bookmarks[0].specs;
    visData = (bookmarks[0].data === "Birdstrikes") ? birdstrikesData : moviesData;
    transitionSets = bookmarks[0].transitionSets;
  }

  dataExtension();

  var transitionCostMatrix = new Matrix("rank");
  transitionCostMatrix.import(JSON.parse(JSON.stringify(transitionSets)));
  var sortedTransitionSetsByRank = BEA(transitionCostMatrix).rows;

  transitionCostMatrix = new Matrix("cost");
  transitionCostMatrix.import(JSON.parse(JSON.stringify(transitionSets)));
  var sortedTransitionSetsByCost = BEA(transitionCostMatrix).rows;



  var i = -1;
  var defaultOrder = specs.map(function(item){
    return i+=1;
  });

  if (!BookmarksMode) {
    defaultOrder = sortedTransitionSetsByRank[0].map(function(jtem){ return jtem.destination});
  }

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
        var VLdiv = VLdiv = $("<div id='vega-lite-" + i + "'></div>").attr("class","col-md-2 col-xs-12");
        if(BookmarksMode){
          VLdiv = $("<div id='vega-lite-" + i + "'></div>").attr("class","row ");
        }
        VLdiv.remove("span");
        specsDiv.append(VLdiv);
        draw("#vega-lite-" + i, specs[order[i]], visData);
        var distSpan = $("<span></span>");
        if (i>0) {
           distSpan.html( dist(order[i-1],order[i],'rank') );
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
