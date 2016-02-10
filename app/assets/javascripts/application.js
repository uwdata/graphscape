// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require bootstrap-sprockets
//= require_tree ./ace/
//= require_tree .

function isEmpty( el ){
    return el.length === 0;
}
function draw(selector, spec){
  var realFieldNames = { Q1:'Acceleration', Q2:'Horsepower', N1:'Origin', N2:'Cylinders' }
  var vgSpec = vl.compile(spec.vegalite(visData, realFieldNames)).spec;
  vg.parse.spec(vgSpec, function(chart) {
    chart({el: selector}).update();
  });
}

$(document).on('ready page:load', function () {


  if( $('#triplet').length !== 0 ){
    var ref = ($('#triplet').data('ref-json'));
    var left = ($('#triplet').data('left-json'));
    var right = ($('#triplet').data('right-json'));
    var comparedResult = Number($('#triplet').data('compared-result'));
    var reason = ($('#triplet').data('reason'));
    var toggled = true;

    var specRef = new VegaLiteFeature(ref.marktype, ref.channels, ref.mapping, ref.fields, ref.channelProperties);
    var specLeft = new VegaLiteFeature(left.marktype, left.channels, left.mapping, left.fields, left.channelProperties);
    var specRight = new VegaLiteFeature(right.marktype, right.channels, right.mapping, right.fields, right.channelProperties);


    draw("#vis-reference", specRef);
    draw("#vis-left", specLeft);
    draw("#vis-right", specRight);


    $( document ).on("keyup",function( event ) {
      //37 left
      //39 right

      if (event.which === 37 && toggled)  {
        $('#human_answer_answer_left').prop("checked", true);
        $('#human_answer_answer_right').prop("checked", false);
        $('#human_answer_answer_hard').prop("checked", false);
      }
      else if (event.which === 39 && toggled) {
        $('#human_answer_answer_right').prop("checked",true);
        $('#human_answer_answer_left').prop("checked", false);
        $('#human_answer_answer_hard').prop("checked", false);
      }
      else if (event.which === 40 && toggled) {
        $('#human_answer_answer_right').prop("checked",false);
        $('#human_answer_answer_left').prop("checked", false);
        $('#human_answer_answer_hard').prop("checked", true);
      }
      else if (event.which === 32){
        if ( $('#human_answer_answer_right').prop("checked") || $('#human_answer_answer_left').prop("checked") || $('#human_answer_answer_hard').prop("checked") ) {
          $('#new_human_answer').submit();
        }
        else
          alert("Choice first");
      }

    });

    $('#hard-to-answer').on('click',function(){
      location.reload();
    });

  }



  var triplets = $('.triplet');
  if (!isEmpty(triplets)) {
    for (var i = 0; i < triplets.length; i++) {
      var ref = ($(triplets[i]).data('ref-json'));
      var left = ($(triplets[i]).data('left-json'));
      var right = ($(triplets[i]).data('right-json'));

      var specRef = new VegaLiteFeature(ref.marktype, ref.channels, ref.mapping, ref.fields, ref.channelProperties);
      var specLeft = new VegaLiteFeature(left.marktype, left.channels, left.mapping, left.fields, left.channelProperties);
      var specRight = new VegaLiteFeature(right.marktype, right.channels, right.mapping, right.fields, right.channelProperties);

      // var vgSpecRef = vl.compile(specRef.vegalite(visData)).spec;
      draw("#vis-ref" + i, specRef);

      // var vgSpecLeft = vl.compile(specLeft.vegalite(visData)).spec;
      draw("#vis-left" + i, specLeft);

      // var vgSpecRight = vl.compile(specRight.vegalite(visData)).spec;
      draw("#vis-right" + i, specRight);

    }
  }

  var specs  = $('.specs');
  if (!isEmpty(specs)) {
    for (var i = 0; i < specs.length; i++) {
      var spec_json = $(specs[i]).data('json');

      var spec = new VegaLiteFeature(spec_json.marktype, spec_json.channels, spec_json.mapping, spec_json.fields, spec_json.channelProperties);


      draw("#vis" + i, spec);

    }
  }

  var JQspec  = $('#spec');
  if (!isEmpty(JQspec)) {

    var spec_json = JQspec.data('json');
    var spec = new VegaLiteFeature(spec_json.marktype, spec_json.channels, spec_json.mapping, spec_json.fields, spec_json.channelProperties);

    draw("#vis", spec);

    $( document ).on("keyup",function( event ) {
      //37 left
      //38 up
      //39 right
      if (event.which === 37) {
        $('#human_filter_answer_never').prop("checked", true);
        $('#human_filter_answer_idk').prop("checked", false);
        $('#human_filter_answer_good').prop("checked", false);
      }
      else if (event.which === 38) {
        $('#human_filter_answer_idk').prop("checked", true);
        $('#human_filter_answer_never').prop("checked", false);
        $('#human_filter_answer_good').prop("checked", false);
      }
      else if (event.which === 39) {
        $('#human_filter_answer_good').prop("checked", true);
        $('#human_filter_answer_idk').prop("checked", false);
        $('#human_filter_answer_never').prop("checked", false);
      }
      else if (event.which === 32)
      {
        if ( $('#human_filter_answer_good').prop("checked")
            || $('#human_filter_answer_idk').prop("checked")
            || $('#human_filter_answer_never').prop("checked") )
          $('#new_human_filter').submit();
        else
          alert("Choice first");
      }



    });

  }

  var userForm = $('#update-user-name');
  if(!isEmpty(userForm)){
    userForm.on('click', function(){
      var userID = parseInt($('#user-id').data('user-id'));
      var userName = $('#user-name').val();
      $.ajax({
        method: "PATCH",
        url: '/users/' + userID,
        data: { "user": { "name": userName } }
      }).done(function(data){
        console.log(data);
        //No more lines in this scene
      });
    })
  }



});