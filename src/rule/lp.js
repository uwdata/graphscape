const fs = require('fs');
// rule sets defining inequality constraints among actions
// each rule set is ordered from lowest to highest precedence (cost)
// within a rule set, a single rule encodes a chain of less-than inequalities
// For example:
//  ['a', 'b', 'c'] -> a < b < c
//  ['a', ['b', 'c'], 'd'] -> a < b < d && a < c < d
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
        [['POINT_TEXT', 'TEXT_TICK'], 'BAR_TEXT', 'LINE_TEXT', 'AREA_TEXT'],
        ['POINT_TICK', 'BAR_TICK', 'LINE_TICK', 'AREA_TICK', 'TEXT_TICK']
      ]
  },
  {
    name: 'transform',
    actions: [ 'SCALE', 'SORT', 'BIN', 'AGGREGATE','ADD_FILTER', 'REMOVE_FILTER', 'MODIFY_FILTER' ],
    rules: [
      [ 'SCALE', 'SORT', 'BIN',  'AGGREGATE', 'MODIFY_FILTER', ['ADD_FILTER', 'REMOVE_FILTER']]

    ]
  },
  {
    name: 'encoding',
    actions: [
      'ADD_X','ADD_Y','ADD_COLOR','ADD_SHAPE','ADD_SIZE','ADD_ROW','ADD_COLUMN','ADD_TEXT',
      'ADD_X_COUNT','ADD_Y_COUNT','ADD_COLOR_COUNT','ADD_SHAPE_COUNT','ADD_SIZE_COUNT','ADD_ROW_COUNT','ADD_COLUMN_COUNT','ADD_TEXT_COUNT',
      'REMOVE_X_COUNT','REMOVE_Y_COUNT','REMOVE_COLOR_COUNT','REMOVE_SHAPE_COUNT','REMOVE_SIZE_COUNT','REMOVE_ROW_COUNT','REMOVE_COLUMN_COUNT','REMOVE_TEXT_COUNT',
      'REMOVE_X','REMOVE_Y','REMOVE_COLOR','REMOVE_SHAPE','REMOVE_SIZE','REMOVE_ROW','REMOVE_COLUMN','REMOVE_TEXT',
      'MODIFY_X','MODIFY_Y','MODIFY_COLOR','MODIFY_SHAPE','MODIFY_SIZE','MODIFY_ROW','MODIFY_COLUMN','MODIFY_TEXT',
      'MODIFY_X_ADD_COUNT','MODIFY_Y_ADD_COUNT','MODIFY_COLOR_ADD_COUNT','MODIFY_SHAPE_ADD_COUNT','MODIFY_SIZE_ADD_COUNT','MODIFY_ROW_ADD_COUNT','MODIFY_COLUMN_ADD_COUNT','MODIFY_TEXT_ADD_COUNT',
      'MODIFY_X_REMOVE_COUNT','MODIFY_Y_REMOVE_COUNT','MODIFY_COLOR_REMOVE_COUNT','MODIFY_SHAPE_REMOVE_COUNT','MODIFY_SIZE_REMOVE_COUNT','MODIFY_ROW_REMOVE_COUNT','MODIFY_COLUMN_REMOVE_COUNT','MODIFY_TEXT_REMOVE_COUNT',
      'MOVE_X_ROW','MOVE_X_COLUMN','MOVE_X_SIZE','MOVE_X_SHAPE','MOVE_X_COLOR','MOVE_X_Y','MOVE_X_TEXT',
      'MOVE_Y_ROW','MOVE_Y_COLUMN','MOVE_Y_SIZE','MOVE_Y_SHAPE','MOVE_Y_COLOR','MOVE_Y_X','MOVE_Y_TEXT',
      'MOVE_COLOR_ROW','MOVE_COLOR_COLUMN','MOVE_COLOR_SIZE','MOVE_COLOR_SHAPE','MOVE_COLOR_Y','MOVE_COLOR_X','MOVE_COLOR_TEXT',
      'MOVE_SHAPE_ROW','MOVE_SHAPE_COLUMN','MOVE_SHAPE_SIZE','MOVE_SHAPE_COLOR','MOVE_SHAPE_Y','MOVE_SHAPE_X','MOVE_SHAPE_TEXT',
      'MOVE_SIZE_ROW','MOVE_SIZE_COLUMN','MOVE_SIZE_SHAPE','MOVE_SIZE_COLOR','MOVE_SIZE_Y','MOVE_SIZE_X','MOVE_SIZE_TEXT',
      'MOVE_TEXT_ROW','MOVE_TEXT_COLUMN','MOVE_TEXT_SHAPE','MOVE_TEXT_COLOR','MOVE_TEXT_Y','MOVE_TEXT_X','MOVE_TEXT_SIZE',
      'MOVE_COLUMN_ROW','MOVE_COLUMN_SIZE','MOVE_COLUMN_SHAPE','MOVE_COLUMN_COLOR','MOVE_COLUMN_Y','MOVE_COLUMN_X','MOVE_COLUMN_TEXT',
      'MOVE_ROW_COLUMN','MOVE_ROW_SIZE','MOVE_ROW_SHAPE','MOVE_ROW_COLOR','MOVE_ROW_Y','MOVE_ROW_X','MOVE_ROW_TEXT',
      'SWAP_X_Y', 'SWAP_ROW_COLUMN' ],
    rules: [
      //SWAP < MOVE      
      ['SWAP_ROW_COLUMN', 'SWAP_X_Y', ['MOVE_SHAPE_COLOR','MOVE_COLOR_SHAPE', 'MOVE_SIZE_COLOR','MOVE_COLOR_SIZE','MOVE_TEXT_COLOR','MOVE_COLOR_TEXT' ]],
      ['SWAP_ROW_COLUMN', 'SWAP_X_Y', ['MOVE_SHAPE_COLOR','MOVE_COLOR_SHAPE', 'MOVE_SIZE_SHAPE','MOVE_SHAPE_SIZE','MOVE_TEXT_SHAPE','MOVE_SHAPE_TEXT' ]],
      ['SWAP_ROW_COLUMN', 'SWAP_X_Y', ['MOVE_SIZE_COLOR', 'MOVE_COLOR_SIZE',  'MOVE_SHAPE_SIZE','MOVE_SIZE_SHAPE','MOVE_TEXT_SIZE','MOVE_SIZE_TEXT' ]],
      ['SWAP_ROW_COLUMN', 'SWAP_X_Y', ['MOVE_TEXT_COLOR', 'MOVE_COLOR_TEXT',  'MOVE_SHAPE_TEXT','MOVE_TEXT_SHAPE','MOVE_TEXT_SIZE','MOVE_SIZE_TEXT' ]],
      ['SWAP_ROW_COLUMN', 'SWAP_X_Y', ['MOVE_ROW_Y','MOVE_Y_ROW']],
      ['SWAP_ROW_COLUMN', 'SWAP_X_Y', ['MOVE_COLUMN_X','MOVE_X_COLUMN']],
      //MOVE
      [['MOVE_SHAPE_COLOR','MOVE_COLOR_SHAPE', 'MOVE_SIZE_COLOR','MOVE_COLOR_SIZE','MOVE_TEXT_COLOR','MOVE_COLOR_TEXT' ], ['MOVE_X_COLOR','MOVE_COLOR_X','MOVE_Y_COLOR','MOVE_COLOR_Y'], ['MOVE_COLUMN_COLOR','MOVE_COLOR_COLUMN','MOVE_ROW_COLOR','MOVE_COLOR_ROW'] ],
      [['MOVE_SHAPE_COLOR','MOVE_COLOR_SHAPE', 'MOVE_SIZE_SHAPE','MOVE_SHAPE_SIZE','MOVE_TEXT_SHAPE','MOVE_SHAPE_TEXT' ], ['MOVE_X_SHAPE','MOVE_SHAPE_X','MOVE_Y_SHAPE','MOVE_SHAPE_Y'], ['MOVE_COLUMN_SHAPE','MOVE_SHAPE_COLUMN','MOVE_ROW_SHAPE','MOVE_SHAPE_ROW'] ],
      [['MOVE_SIZE_COLOR', 'MOVE_COLOR_SIZE',  'MOVE_SHAPE_SIZE','MOVE_SIZE_SHAPE','MOVE_TEXT_SIZE','MOVE_SIZE_TEXT' ], ['MOVE_X_SIZE', 'MOVE_SIZE_X', 'MOVE_Y_SIZE', 'MOVE_SIZE_Y'],  ['MOVE_COLUMN_SIZE', 'MOVE_SIZE_COLUMN', 'MOVE_ROW_SIZE', 'MOVE_SIZE_ROW' ] ],
      [['MOVE_TEXT_COLOR', 'MOVE_COLOR_TEXT',  'MOVE_SHAPE_TEXT','MOVE_TEXT_SHAPE','MOVE_TEXT_SIZE','MOVE_SIZE_TEXT' ], ['MOVE_X_TEXT', 'MOVE_TEXT_X', 'MOVE_Y_TEXT', 'MOVE_TEXT_Y'],  ['MOVE_COLUMN_TEXT', 'MOVE_TEXT_COLUMN', 'MOVE_ROW_TEXT', 'MOVE_TEXT_ROW' ] ],
      
      //MOVE (Positionals -> Glyphs)
      [ ['MOVE_ROW_Y','MOVE_Y_ROW'],              ['MOVE_ROW_COLUMN','MOVE_COLUMN_ROW'],  ['MOVE_X_ROW','MOVE_ROW_X'],                ['MOVE_COLOR_ROW','MOVE_ROW_COLOR', 'MOVE_SIZE_ROW','MOVE_ROW_SIZE','MOVE_SHAPE_ROW','MOVE_ROW_SHAPE','MOVE_TEXT_ROW','MOVE_ROW_TEXT']],
      [ ['MOVE_COLUMN_X','MOVE_X_COLUMN'],        ['MOVE_ROW_COLUMN','MOVE_COLUMN_ROW'],  ['MOVE_Y_COLUMN','MOVE_COLUMN_Y'],          ['MOVE_COLOR_COLUMN','MOVE_COLUMN_COLOR', 'MOVE_SIZE_COLUMN','MOVE_COLUMN_SIZE', 'MOVE_SHAPE_COLUMN','MOVE_COLUMN_SHAPE', 'MOVE_TEXT_COLUMN','MOVE_COLUMN_TEXT']],
      [ ['MOVE_ROW_Y','MOVE_Y_ROW'],              ['MOVE_X_Y','MOVE_Y_X'],                ['MOVE_Y_COLUMN','MOVE_COLUMN_Y'],          ['MOVE_COLOR_Y','MOVE_Y_COLOR','MOVE_SIZE_Y','MOVE_Y_SIZE', 'MOVE_SHAPE_Y','MOVE_Y_SHAPE', 'MOVE_TEXT_Y','MOVE_Y_TEXT']],
      [ ['MOVE_COLUMN_X','MOVE_X_COLUMN'],        ['MOVE_X_Y','MOVE_Y_X'],                ['MOVE_X_ROW','MOVE_ROW_X'],                ['MOVE_COLOR_X','MOVE_X_COLOR','MOVE_SIZE_X','MOVE_X_SIZE', 'MOVE_SHAPE_X','MOVE_X_SHAPE', 'MOVE_TEXT_X','MOVE_X_TEXT']],

      //MOVE < ADD=REMOVE 
      [['MOVE_COLUMN_SIZE', 'MOVE_SIZE_COLUMN', 'MOVE_ROW_SIZE', 'MOVE_SIZE_ROW' ], ['ADD_TEXT_COUNT', 'REMOVE_TEXT_COUNT']],
      [['MOVE_COLUMN_TEXT', 'MOVE_TEXT_COLUMN', 'MOVE_ROW_TEXT', 'MOVE_TEXT_ROW' ], ['ADD_TEXT_COUNT', 'REMOVE_TEXT_COUNT']],
      [['MOVE_COLUMN_SHAPE', 'MOVE_SHAPE_COLUMN', 'MOVE_ROW_SHAPE', 'MOVE_SHAPE_ROW' ], ['ADD_TEXT_COUNT', 'REMOVE_TEXT_COUNT']],
      [['MOVE_COLUMN_COLOR', 'MOVE_COLOR_COLUMN', 'MOVE_ROW_COLOR', 'MOVE_COLOR_ROW' ], ['ADD_TEXT_COUNT', 'REMOVE_TEXT_COUNT']],
      
      //ADD,REMOVE
      [ 
        ['ADD_TEXT_COUNT', 'REMOVE_TEXT_COUNT'], ['ADD_TEXT', 'REMOVE_TEXT'], 
        ['ADD_SHAPE_COUNT', 'REMOVE_SHAPE_COUNT'], ['ADD_SHAPE', 'REMOVE_SHAPE'], 
        ['ADD_SIZE_COUNT', 'REMOVE_SIZE_COUNT'],['ADD_SIZE', 'REMOVE_SIZE'], 
        ['ADD_COLOR_COUNT', 'REMOVE_COLOR_COUNT'], ['ADD_COLOR', 'REMOVE_COLOR'],  
        ['ADD_ROW_COUNT', 'ADD_COLUMN_COUNT', 'REMOVE_COLUMN_COUNT', 'REMOVE_ROW_COUNT'],
        ['ADD_ROW', 'REMOVE_ROW', 'ADD_COLUMN', 'REMOVE_COLUMN'], 
        ['ADD_X_COUNT', 'REMOVE_X_COUNT', 'ADD_Y_COUNT', 'REMOVE_Y_COUNT'], 
        ['ADD_X', 'REMOVE_X', 'ADD_Y', 'REMOVE_Y']
        ],
      
      
      //ADD=REMOVE < MODIFY 
      [ ['ADD_X', 'REMOVE_X', 'ADD_Y', 'REMOVE_Y'], ['MODIFY_TEXT_ADD_COUNT','MODIFY_TEXT_REMOVE_COUNT']],
      
      //MODIFY (ADD_COUNT < REMOVE_COUNT)
      [ ['MODIFY_TEXT_ADD_COUNT','MODIFY_TEXT_REMOVE_COUNT'], 'MODIFY_TEXT',
        ['MODIFY_SHAPE_ADD_COUNT','MODIFY_SHAPE_REMOVE_COUNT'], 'MODIFY_SHAPE', 
        ['MODIFY_SIZE_ADD_COUNT', 'MODIFY_SIZE_REMOVE_COUNT'], 'MODIFY_SIZE', 
        ['MODIFY_COLOR_ADD_COUNT','MODIFY_COLOR_REMOVE_COUNT'],'MODIFY_COLOR',
        ['MODIFY_ROW_ADD_COUNT', 'MODIFY_COLUMN_ADD_COUNT', 'MODIFY_ROW_REMOVE_COUNT', 'MODIFY_COLUMN_REMOVE_COUNT'], ['MODIFY_ROW', 'MODIFY_COLUMN'],
        ['MODIFY_X_ADD_COUNT', 'MODIFY_Y_ADD_COUNT', 'MODIFY_X_REMOVE_COUNT', 'MODIFY_Y_REMOVE_COUNT'],['MODIFY_X', 'MODIFY_Y']]
    ],
    ceiling: { depth: 10 } //more than 3 encoding transitions are too far to be measured.

  }
];

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
  var matlabCode = [A, b, c, lb].join(';\n') + ';\n'
                  + 'x = linprog(c, A, b, [], [], lb);\n'
                  + "str = strjoin(strtrim(cellstr(num2str(x))),',');\n"
                  + "fid = fopen('./../../temp/costs.json','wt');\n"
                  + "fprintf(fid, strcat('[',str,']'));\n"
                  + "fclose(fid);";
  return matlabCode;
}

// GENERATE LP AND WRITE TO FILE
var lp = linearProgram(ruleSet);
var s = lpMATLAB(lp);

fs.writeFileSync('lp.m', s);
fs.writeFileSync('./../../temp/idMap.json', JSON.stringify(lp.actions.idMap));
fs.writeFileSync('./../../temp/encodingCeiling.json', JSON.stringify(ruleSet[2].ceiling));
