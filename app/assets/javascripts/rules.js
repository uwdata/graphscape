var humanAnswers;
var rule;

$(document).on('ready page:load', function () {

  function fillTableRow(columns, type, spec, similarity, option){
    var result = "";
    if (type === "th") {
      result = '<tr><th>' + columns.join('</th><th>') + '</th></tr>';
    }
    else if (type === "td") {
      for (var i = 0; i < columns.length; i++) {
        if (columns[i] === "similarity") {
          result += '<td>' + similarity + '</td>';
        }
        else if (columns[i] === "id") {
          result += '<td class="spec-id-col" >' + spec.id + '</td>';
        }
        else
          result += '<td>' + spec.display(columns[i]) + '</td>';
      }
      result =  '<tr class="vis-table-row '+ (option || "") + '" data-id="'+ spec.id +'"">' + result + '</tr>';
    }
    result.replace('\n', '<br>');
    return result;
  }
  function fillTable(specs, refSpecID, specSimilarities){
    var table = $('#interactive-table');
    table.html("");

    var columns = ["id","marktype","channels","fields","mapping","channelProperties","similarity"];
    var tableHead = fillTableRow(columns, "th");
    var tableRows = "";

    tableRows = fillTableRow(columns, "td", specs[refSpecID], '-', "info");

    for (var i = 0; i < specs.length; i++) {
      if(specSimilarities !== undefined ) {
        if (specSimilarities[i].specID === refSpecID)
          continue;

        tableRows += fillTableRow(columns, "td", specs[specSimilarities[i].specID], specSimilarities[i].similarity );
      }
      else{
        if (i === refSpecID)
          continue;

        tableRows += fillTableRow(columns, "td", specs[i], 0 );
      }
    }

    table.html(tableHead + tableRows);
    draw('#ref-vis', specs[refSpecID] );

    $('.vis-table-row').on('mouseover',function(){
      var id = parseInt($(this).data('id'));
      draw('#query-vis', specs[id] );
      editor2.getSession().setValue(JSON.stringify(specs[id], null, '\t'));
      $('#reportBtn').data('id', id);
    });

    $('.spec-id-col').on('click',function(){
      var id = parseInt($(this).html());
      setReferenceSpec(id);
    });

  }
  function fillScore(score){
    $('#score').html("Score : <mark><b>" + score + '%</mark></b>');
  }




  function runComparing(specs, refSpecID){
    var comparingCode = editor.getValue();
    var compareResult;
    var specSimilarities = [];
    for (var i = 0; i < specs.length; i++) {
      specSimilarities.push({specID: 0, similarity: 0});
    };

    //compile
    try {
      eval(comparingCode);
    } catch (e) {
      if (e instanceof SyntaxError) {
        alert("SyntaxError\n" + e.message);
      }
      else
        console.log(e);
    }


    //try to compare all kinds of triplets with fixed reference.
    var hasRuntimeError = false;
    var userCodeError = "";
    for (var i = 0; i < specs.length; i++) {
      specSimilarities[i].specID = i;

      if (i === refSpecID) {
        continue;
      }
      for (var j = i+1; j < specs.length; j++) {
        if (j === refSpecID) {
          continue;
        }

        compareResult = 0;

        try {
          compareResult = compare(specs[refSpecID], specs[i], specs[j]);
        } catch (e) {
          hasRuntimeError =  true;
          userCodeError = e;
          console.log(e.message);
        }

        if (compareResult === 1)
          specSimilarities[j].similarity += 1;
        else if (compareResult === -1)
          specSimilarities[i].similarity += 1;
      }
    }

    specSimilarities.sort(function(a,b) {
      return b.similarity - a.similarity;
    })
    if (hasRuntimeError)
      alert(userCodeError.message);

    var score = 0;

    for (var i = 0; i < humanAnswers.length; i++) {
      compareResult = compare(specs[humanAnswers[i].triplet.ref_id-1], specs[humanAnswers[i].triplet.left_id-1], specs[humanAnswers[i].triplet.right_id-1]);
      if (compareResult === 1 && humanAnswers[i].answer === "right")
        score += 1;
      if (compareResult === -1 && humanAnswers[i].answer === "left")
        score += 1;
    };

    if (humanAnswers.length !== 0)
      score = Math.round( score / humanAnswers.length * 100);
    else
      score = 0;

    $('#rule_score').val( score );




    return { "score": score, "specSimilarities": specSimilarities };
  }
  function setReferenceSpec(newRefSpecID){
    refSpecID = newRefSpecID;
    var comparedResult = runComparing(specs,refSpecID);
    fillTable(specs, refSpecID, comparedResult.specSimilarities);
    fillScore(comparedResult.score)
    $('#reference-ID').html("ref_id : " + refSpecID);
  }

  function fillComparingTableRow(columns, type){
    var result = "";
    if (type === "th") {
      result = '<th>' + columns.join('</th><th>') + '</th>';
      result = '<tr>' + result.replace('\n', '<br>') + '</tr>';
      return result;
    }

    result += '<td>' + columns.join('</td><td>') + '</td>';

    if (columns[1] !== columns[2])
      result = '<tr class="vis-table-row danger" data-id="'+ columns[0] +'">' + result.replace('\n', '<br>') + '</tr>';
    else
      result = '<tr class="vis-table-row" data-id="'+ columns[0] +'">' + result.replace('\n', '<br>') + '</tr>';

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
  var refSpecID ;
  var specCoordinates;
  var specRaws;
  var humanAnswers;
  var rules;

  if ($('#rule-making').length !== 0) {
    specs = [];
    specRaws =  $('#specs').data('specs');
    humanAnswers = $('#human-answers').data('human-answers');


    editor = ace.edit("compare-editor");
    editor.setTheme("ace/theme/clouds");
    editor.getSession().setMode("ace/mode/javascript");
    editor.getSession().setTabSize(2);

    if ( $('#rule_script').val() !== "" ) {
      editor.getSession().setValue($('#rule_script').val());
    };


    editor2 = ace.edit("spec-editor");
    editor2.setTheme("ace/theme/clouds");
    editor2.getSession().setMode("ace/mode/json");
    editor2.getSession().setTabSize(2);

    for (var i = 0; i < specRaws.length; i++) {
      specRaw = JSON.parse(specRaws[i].json);
      spec = new VegaLiteFeature(specRaw.marktype, specRaw.channels, specRaw.mapping, specRaw.fields, specRaw.channelProperties );
      spec.id = i;
      specs.push(spec);

    };

    $('#runBtn').on('click',function(){
      var comparedResult = runComparing(specs,refSpecID);
      fillTable(specs, refSpecID, comparedResult.specSimilarities);
      fillScore(comparedResult.score)
    })

    $('#saveBtn').on('click',function(){
      var userScript = editor.getSession().getValue();
      $('#rule_script').val(userScript);
      $('#rule_name').val('untitled');

      $('form').submit();


    })

    $('#reportBtn').on('click', function(){
      if (confirm("Save your code. It will jump to report page without remembering your code.")) {
        window.location = "/human_filters/"+ $(this).data('id');
      } else {
          // Do nothing!
      }

    });

    //default
    refSpecID = 0;
    fillTable(specs, 0);
    $('#reference-ID').html("ref_id : " + 0);
  };


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

  if ( $('#rules').length !== 0) {
    var specRaws =  $('#specs').data('specs');
    humanAnswers = $('#human-answers').data('human-answers');
    rules = $('.rule');
    humanAnswers = $('#human-answers').data('human-answers');

    for (var i = 0; i < specRaws.length; i++) {
      specRaw = JSON.parse(specRaws[i].json);
      spec = new VegaLiteFeature(specRaw.marktype, specRaw.channels, specRaw.mapping, specRaw.fields, specRaw.channelProperties );
      spec.id = i;
      specs.push(spec);
    };



    $('#refresh-score').on('click',function(){
      for (var i = 0; i < rules.length; i++) {
        var rule_id = parseInt($(rules[i]).data('id'));
        var rule_script = $(rules[i]).data('script');

        try {
          eval(rule_script);
        } catch (e) {
          if (e instanceof SyntaxError) {
            alert("SyntaxError\n" + e.message);
          }
          else
            console.log(e);
        }

        var score = 0;

        for (var j = 0; j < humanAnswers.length; j++) {
          compareResult = compare(specs[humanAnswers[j].triplet.ref_id-1], specs[humanAnswers[j].triplet.left_id-1], specs[humanAnswers[j].triplet.right_id-1]);
          if (compareResult === 1 && humanAnswers[j].answer === "right")
            score += 1;
          if (compareResult === -1 && humanAnswers[j].answer === "left")
            score += 1;
        };

        if (humanAnswers.length !== 0)
          score = Math.round( score / humanAnswers.length * 100);
        else
          score = 0;

        $("."+rule_id+'_score').html(score);

        //send ajax
        $.ajax({
          method: "POST",
          url: '/rules/' + rule_id + "/update_score",
          data: { "rule": { "id": rule_id, "score": score } }
        }).done(function(data){
          console.log(data);
        }).fail(function( jqXHR, textStatus ) {
          alert( "Request failed: " + textStatus );
        });
      };
    })


  };

});
