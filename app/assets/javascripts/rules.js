var humanAnswers;
var rule;
$(document).on('ready page:load', function () {


  function fillComparingTableRow(columns, type){
    var result = "";
    if (type === "th") {
      result = '<th>' + columns.join('</th><th>') + '</th>';
    }
    else if (type === "td") {
      result += '<td>' + columns.join('</td><td>') + '</td>';
    }
    result = '<tr class="vis-table-row" data-id="'+ columns[0] +'">' + result.replace('\n', '<br>'); + '</tr>'
    return result;
  }
  function fillComparingTable(){
    var table = $('#comparing-table');
    table.html("");

    var columns = ["TripletID","Human Answer","Rule Answer"];
    var tableHead = fillComparingTableRow(columns, "th");
    var tableRows = "";
    var triplet;
    var comparedResultRaw = 0;
    var comparedResult = "IDK";
    var triplet_ids = "";


    for (var i = 0; i < humanAnswers.length; i++) {
      triplet = humanAnswers[i].triplet;
      comparedResultRaw = compare(specs[triplet.ref_id - 1], specs[triplet.left_id - 1 ], specs[triplet.right_id - 1]);

      if (comparedResultRaw === -1)
        comparedResult = "left"
      else if (comparedResultRaw === 1)
        comparedResult = "right"

      triplet_ids = "(" + triplet.ref_id + ", " + triplet.left_id + ", "+ triplet.right_id + ")";
      tableRows += tableRows = fillComparingTableRow([triplet_ids, humanAnswers[i].answer, comparedResult], "td");
    }

    table.html(tableHead + tableRows);

    $('.vis-table-row').on('mouseover',function(){

      var ids = $(this).data('id').replace('(',"").replace(')',"").split(',').map(function(item){ return parseInt(item); });
      draw('#query-ref-vis', specs[ids[0]-1] );
      draw('#query-left-vis', specs[ids[1]-1] );
      draw('#query-right-vis', specs[ids[2]-1] );


    });


  }

  var specs = [];
  var specRaw;
  var spec;
  if( $('#rule').length !== 0){
    var specRaws =  $('#specs').data('specs');
    humanAnswers = $('#human-answers').data('human-answers');

    for (var i = 0; i < specRaws.length; i++) {
      specRaw = JSON.parse(specRaws[i].json);
      spec = new VegaLiteFeature(specRaw.marktype, specRaw.channels, specRaw.mapping, specRaw.fields, specRaw.channelProperties );
      spec.id = i;
      specs.push(spec);
    };

    rule = $('#rule').data('rule');
    eval(rule.script);

    fillComparingTable();


  }



});
