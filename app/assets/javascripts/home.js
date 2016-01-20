var temp;
var editor;
var editor2;
$(document).on('ready page:load', function () {
  var refSpecID ;

  function draw(selector, spec){
    var vgSpec = vl.compile(spec.vegalite(visData)).spec;
    vg.parse.spec(vgSpec, function(chart) {
      chart({el: selector}).update();
    });
  }
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
  function runComparing(specs, refSpecID){
    var comparingCode = editor.getValue();
    var compareResult;
    var specSimilarities = [];
    for (var i = 0; i < specs.length; i++) {
      specSimilarities.push({specID: 0, similarity: 0});
    };

    try {
      eval(comparingCode);
    } catch (e) {
      if (e instanceof SyntaxError) {
        alert(e.message);
      } else {
        throw( e );
      }
    }


    //try to compare all kinds of triplets with fixed reference.
    for (var i = 0; i < specs.length; i++) {
      specSimilarities[i].specID = i;

      if (i === refSpecID) {
        continue;
      }
      for (var j = i+1; j < specs.length; j++) {
        if (j === refSpecID) {
          continue;
        }

        compareResult = compare(specs[refSpecID], specs[i], specs[j]);
        if (compareResult === 1)
          specSimilarities[j].similarity += 1;
        else if (compareResult === -1)
          specSimilarities[i].similarity += 1;
      }
    }

    specSimilarities.sort(function(a,b) {
      return b.similarity - a.similarity;
    })

    return specSimilarities;
  }
  function setReferenceSpec(newRefSpecID){
    refSpecID = newRefSpecID;
    var specSimilarities = runComparing(specs,refSpecID);
    fillTable(specs, refSpecID, specSimilarities);
    $('#reference-ID').html("ref_id : " + refSpecID);
  }

  if( $('#spec-coordinates').length !== 0 ){
    var specCoordinates = $('#spec-coordinates').data('spec-coordinates');
    var specs = [];
    var specRaw;
    var specRaws =  $('#specs').data('specs');

    for (var i = 0; i < specRaws.length; i++) {
      specRaw = JSON.parse(specRaws[i].json);
      specs.push(new VegaLiteFeature(specRaw.marktype, specRaw.channels, specRaw.mapping, specRaw.fields, specRaw.channelProperties ));
    };




    console.log(specCoordinates);

    var w = $('#vis-map').width()
    var h = w;
    var c10 = d3.scale.category10();

    //Create SVG element
    var svg = d3.select("div#vis-map")
      .append("svg")
      .attr("width", w)
      .attr("height", h)
      .call(d3.behavior.zoom().on("zoom", function () {
        svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
        d3.selectAll("circle").attr("r", 7/d3.event.scale );
      }))
      .append("g");




    var container = svg
      .append("g");

    container.selectAll("circle")
      .data(specCoordinates)
      .enter()
      .append("circle")
      .attr("cx", function(d){ return d.x1*100+w/2; })
      .attr("cy", function(d){ return d.x2*100+h/2; })
      .attr("r", 10)
      .style("opacity", 0.4)
      .style("fill", function(d,i){

        return c10(specs[i].channels.length);
      })
      .on("mouseover",function(d,i){
        draw('#vis', specs[i]);
      });


    // svg.on("mousedown",function(event){
    //   d3.selectAll("circle")
    //     .attr("cx", function(d){ return d.x1*100+w/2; })
    //     .attr("cy", function(d){ return d.x2*100+h/2; });
    // });

  }

  if ($('#rule-making').length !== 0) {
    var specs = [];
    var specRaw;
    var specRaws =  $('#specs').data('specs');

    var spec;
    var compare;

    editor = ace.edit("compare-editor");
    editor.setTheme("ace/theme/clouds");
    editor.getSession().setMode("ace/mode/javascript");
    editor.getSession().setTabSize(2);

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
      var specSimilarities = runComparing(specs,refSpecID);
      console.log(specSimilarities);
      fillTable(specs,refSpecID, specSimilarities);
    })

    $('#reportBtn').on('click', function(){
      if (confirm("Save your code. It will jump to report page without remembering your code.")) {
        window.location = "/human_filters/"+ $(this).data('id');
      } else {
          // Do nothing!
      }

    });

    setReferenceSpec(0);

  };



});
