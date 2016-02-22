// rule sets defining inequality constraints among actions
// each rule set is ordered from lowest to highest precedence (cost)
// within a rule set, a single rule encodes a chain of less-than inequalities
// For example:
//  ['a', 'b', 'c'] -> a < b < c
//  ['a', ['b', 'c'], 'd'] -> a < b < d && a < c < d
function ruleSet(){
  var  ruleSet = [
    {
      name: 'marktype',
      actions: [
        'AREA_BAR', 'AREA_LINE', 'AREA_POINT', 'AREA_TEXT', 'AREA_TICK',
        'BAR_LINE','BAR_POINT','BAR_TEXT','BAR_TICK',
        'LINE_POINT', 'LINE_TEXT', 'LINE_TICK',
        'POINT_TEXT', 'POINT_TICK',
        'TEXT_TICK' ],
      rules: [
        ['POINT_TICK', 'AREA_LINE', 'AREA_BAR', ['AREA_POINT', 'AREA_TICK'], 'AREA_TEXT'],
        [['BAR_POINT', 'BAR_TICK'], 'AREA_BAR', 'BAR_LINE', 'BAR_TEXT'],
        ['AREA_LINE', ['LINE_POINT', 'LINE_TICK'], 'BAR_LINE', 'LINE_TEXT'],
        ['POINT_TICK', 'BAR_POINT', 'LINE_POINT', 'AREA_POINT', 'POINT_TEXT'],
        [['POINT_TEXT', 'TEXT_TICK'], 'LINE_TEXT', 'BAR_TEXT', 'AREA_TEXT'],
        ['POINT_TICK', 'BAR_TICK', 'LINE_TICK', 'AREA_TICK', 'TEXT_TICK']
      ]
  },
  {
    name: 'transform',
    actions: [ 'SCALE', 'SORT', 'BIN', 'AGGREGATE', 'FILTER', 'SETTYPE' ],
    rules: [
      ['SCALE', 'SORT', 'BIN', 'AGGREGATE', 'FILTER', 'SETTYPE']
    ]
  },
  {
    name: 'encoding',
    actions: [
      'ADD_X','ADD_Y','ADD_COLOR','ADD_SHAPE','ADD_SIZE',
      'ADD_X_COUNT','ADD_Y_COUNT','ADD_COLOR_COUNT','ADD_SHAPE_COUNT','ADD_SIZE_COUNT',
      'REMOVE_X_COUNT','REMOVE_Y_COUNT','REMOVE_COLOR_COUNT','REMOVE_SHAPE_COUNT','REMOVE_SIZE_COUNT',
      'REMOVE_X','REMOVE_Y','REMOVE_COLOR','REMOVE_SHAPE','REMOVE_SIZE',
      'MODIFY_X','MODIFY_Y','MODIFY_COLOR','MODIFY_SHAPE','MODIFY_SIZE',
      'MODIFY_X_ADD_COUNT','MODIFY_Y_ADD_COUNT','MODIFY_COLOR_ADD_COUNT','MODIFY_SHAPE_ADD_COUNT','MODIFY_SIZE_ADD_COUNT',
      'MODIFY_X_REMOVE_COUNT','MODIFY_Y_REMOVE_COUNT','MODIFY_COLOR_REMOVE_COUNT','MODIFY_SHAPE_REMOVE_COUNT','MODIFY_SIZE_REMOVE_COUNT',
      'MOVE_X_SIZE','MOVE_X_SHAPE','MOVE_X_COLOR','MOVE_X_Y',
      'MOVE_Y_SIZE','MOVE_Y_SHAPE','MOVE_Y_COLOR','MOVE_Y_X',
      'MOVE_COLOR_SIZE','MOVE_COLOR_SHAPE','MOVE_COLOR_Y','MOVE_COLOR_X',
      'MOVE_SHAPE_SIZE','MOVE_SHAPE_COLOR','MOVE_SHAPE_Y','MOVE_SHAPE_X',
      'MOVE_SIZE_SHAPE','MOVE_SIZE_COLOR','MOVE_SIZE_Y','MOVE_SIZE_X',
      'SWAP_X_Y' ],
    rules: [
      ['SWAP_X_Y','REMOVE_SHAPE_COUNT', 'REMOVE_SHAPE','REMOVE_SIZE_COUNT', 'REMOVE_SIZE','REMOVE_COLOR_COUNT', 'REMOVE_COLOR',['REMOVE_X_COUNT', 'REMOVE_Y_COUNT'], ['REMOVE_X', 'REMOVE_Y']],
      [ ['REMOVE_X', 'REMOVE_Y'], 'ADD_COLOR_COUNT','ADD_COLOR', 'ADD_SIZE_COUNT','ADD_SIZE', 'ADD_SHAPE_COUNT','ADD_SHAPE',['ADD_X_COUNT', 'ADD_Y_COUNT'], ['ADD_X', 'ADD_Y']],
      [['ADD_X', 'ADD_Y'], 'MODIFY_COLOR_REMOVE_COUNT','MODIFY_COLOR_ADD_COUNT','MODIFY_COLOR'],
      ['MODIFY_SIZE_REMOVE_COUNT','MODIFY_SIZE_ADD_COUNT','MODIFY_SIZE'],
      ['MODIFY_SHAPE_REMOVE_COUNT','MODIFY_SHAPE_ADD_COUNT','MODIFY_SHAPE'],
      [['MODIFY_X_REMOVE_COUNT', 'MODIFY_Y_REMOVE_COUNT'],['MODIFY_X_ADD_COUNT', 'MODIFY_Y_ADD_COUNT'],['MODIFY_X', 'MODIFY_Y']]
    ]
  }
];
  return ruleSet ;
}

var rulesets = ruleSet();


// var rulesets =  [
//   {
//     name: 'marktype',
//     actions: [
//       'mark_area_bar',
//       'mark_area_line',
//       'mark_area_point',
//       'mark_area_text',
//       'mark_area_tick',
//       'mark_bar_line',
//       'mark_bar_point',
//       'mark_bar_text',
//       'mark_bar_tick',
//       'mark_line_point',
//       'mark_line_text',
//       'mark_line_tick',
//       'mark_point_text',
//       'mark_point_tick',
//       'mark_text_tick'
//     ],
//     rules: [
//       ['mark_point_tick', 'mark_area_line', 'mark_area_bar', ['mark_area_point', 'mark_area_tick'], 'mark_area_text'],
//       [['mark_bar_point', 'mark_bar_tick'], 'mark_area_bar', 'mark_bar_line', 'mark_bar_text'],
//       ['mark_area_line', ['mark_line_point', 'mark_line_tick'], 'mark_bar_line', 'mark_line_text'],
//       ['mark_point_tick', 'mark_bar_point', 'mark_line_point', 'mark_area_point', 'mark_point_text'],
//       [['mark_point_text', 'mark_tick_text'], 'mark_line_text', 'mark_bar_text', 'mark_area_text'],
//       ['mark_point_tick', 'mark_bar_tick', 'mark_line_tick', 'mark_area_tick', 'mark_text_tick']
//     ]
//   },
//   {
//     name: 'transform',
//     actions: [
//       'scale',
//       'sort',
//       'bin',
//       'aggregate',
//       'filter',
//       'settype'
//     ],
//     rules: [
//       ['scale', 'sort', 'bin', 'aggregate', 'filter', 'settype']
//     ]
//   },
//   {
//     name: 'encode',
//     actions: [
//       'add_x', 'add_y', 'add_color', 'add_shape', 'add_size',
//       'rem_x', 'rem_y', 'rem_color', 'rem_shape', 'rem_size',
//       'mod_x', 'mod_y', 'mod_color', 'mod_shape', 'mod_size',
//       'swap_x_y'
//       // TODO: incorporate moving field from one encoding to another
//       // 'move_x_y', 'move_x_color', 'move_x_shape', 'move_x_size',
//       // 'move_y_x', 'move_y_color', 'move_y_shape', 'move_y_size',
//       // 'move_color_x', 'move_color_y', 'move_color_shape', 'move_color_size',
//       // 'move_shape_x', 'move_shape_y', 'move_shape_color', 'move_shape_size',
//       // 'move_size_x',  'move_size_y',  'move_size_color',  'move_size_shape'
//       // TODO: add support for redundant vs. non-redundant encodings?
//       // TODO: add support for type (dimension/measure) information?
//     ],
//     rules: [
//       ['rem_shape', 'rem_size', 'rem_color', ['rem_x', 'rem_y']],
//       ['swap_x_y', ['add_x', 'add_y'], 'add_color', 'add_size', 'add_shape'],
//       ['add_shape', 'mod_color', 'mod_size', 'mod_shape', ['mod_x', 'mod_y'], 'rem_shape']
//     ]
//   }
// ];


// console.log(rulesets);

// LP BUILDER

// given a collection of rulesets, generate a corresponding linear program
function linearProgram(rulesets) {
  var actions = extractActions(rulesets),
      lp = {
        A: [], b: [], n: actions.length,
        actions: actions,
        mincost: 0.01
      };

  rulesets.forEach(function(rs, i) {
    if (i > 0) connectRuleSets(lp, rulesets[i-1], rs);
    rs.rules.forEach(function(r) { addRuleSet(lp, r); });
  });

  return lp;
}

// scan through rulesets, extract an array of all action strings
// also attach a lookup map from strings to id number
function extractActions(rulesets) {
  var actions = [],
      idMap = {};
  rulesets.forEach(function(rs) {
    rs.actions.forEach(function(a) {
      if (idMap[a] === undefined) {
        idMap[a] = actions.length;
        actions.push(a);
      }
    })
  });
  actions.idMap = idMap;
  return actions;
}

function addRuleSet(lp, r) {
  var id = lp.actions.idMap, i, j, k, u, v;

  u = array(r[0]);
  for (k=1; k<r.length; ++k, u=v) {
    v = array(r[k]);
    for (i=0; i<u.length; ++i) {
      for (j=0; j<v.length; ++j) {
        addConstraint(lp, id[u[i]], id[v[j]]);
      }
    }
  }
}

// add an inequality constraint to an lp
function addConstraint(lp, u, v) {
  var r = repeat(lp.n, 0);
  r[u] = 1;
  r[v] = -1;
  lp.A.push(r);
  lp.b.push(-lp.mincost);
}

// add inequality constraints between rule sets
// here, we ensure that each action in the higher cost set
// has a cost greater than the sum of the lower cost set
function connectRuleSets(lp, a, b) {
  var id = lp.actions.idMap,
      x = repeat(lp.n, 0),
      r, i;

  for (i=0; i<a.actions.length; ++i) {
    x[id[a.actions[i]]] = 1;
  }

  for (i=0; i<b.actions.length; ++i) {
    r = cloneArray(x);
    r[id[b.actions[i]]] = -1;
    lp.A.push(r);
    lp.b.push(-lp.mincost);
  }
}

// UTILITIES

// generate an array of a single repeating value
function repeat(n, val) {
  var a = Array(n);
  for (var i=0; i<n; ++i) a[i] = val;
  return a;
}

function array(x) {
  return Array.isArray(x) ? x : [x];
}

// clone an array
function cloneArray(_) {
  var a = Array(_.length);
  for (var i=0; i<_.length; ++i) a[i] = _[i];
  return a;
}

// return the MATLAB code string for solving an LP
function lpMATLAB(lp) {
  var A = 'A = [\n ' + lp.A.map(function(row) {
    return row.join(' ');
  }).join(';\n ') + ']';
  var b = 'b = [' + lp.b.join(' ') + ']';
  var c = 'c = [' + repeat(lp.n, 1).join(' ') + ']';
  var lb = 'lb = [' + repeat(lp.n, lp.mincost).join(' ') + ']';

  return [A, b, c, lb].join(';\n') + ';\n'
    + 'linprog(c, A, b, [], [], lb)\n';
}

// GENERATE LP AND WRITE TO FILE
var lp = linearProgram(rulesets);
var s = lpMATLAB(lp);
require('fs').writeFileSync('lp_yh01.m', s);
console.log(lp.actions.idMap);
