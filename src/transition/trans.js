
const d3 = require("d3");
const vega = require("vega");
const vl = require("vega-lite");
var expr = require('vega-expression');
const { TYPES, CHANNELS, OPS, LOGIC_OPS } = require('../constants');
var util = require('../util');
const DEFAULT_EDIT_OPS = require('../editOp/editOpSet').DEFAULT_EDIT_OPS;
var nb = require('./neighbor');


async function transition(s, d, importedTransitionCosts, transOptions) {
  var importedMarkEditOps = importedTransitionCosts ? importedTransitionCosts.markEditOps : DEFAULT_EDIT_OPS["markEditOps"];
  var importedTransformEditOps = importedTransitionCosts ? importedTransitionCosts.transformEditOps : DEFAULT_EDIT_OPS["transformEditOps"];
  var importedEncodingEditOps = importedTransitionCosts ? importedTransitionCosts.encodingEditOps : DEFAULT_EDIT_OPS["encodingEditOps"];
  let _transformEditOps = await transformEditOps(s, d, importedTransformEditOps, transOptions);
  var trans = {
    mark: markEditOps(s, d, importedMarkEditOps).map(eo => { return {...eo, type: "mark"}}),
    transform: _transformEditOps.map(eo => { return {...eo, type: "transform"}}),
    encoding: encodingEditOps(s, d, importedEncodingEditOps).map(eo => { return {...eo, type: "encoding"}})
  };

  //Todo: if there is a MOVE_A_B and the field has Transform, ignore the transform
  const re = new RegExp("^MOVE_")
  trans.transform = trans.transform.filter(editOp => {
    if (editOp.name.indexOf("FILTER") >= 0) {
      return true;
    }
    let moveEditOps = trans.encoding.filter(eo => re.test(eo.name) );
    if (moveEditOps.length ===0) {
      return true;
    }
    moveEditOps.forEach(moveEditOp => {

      let sChannel = moveEditOp.detail.before.channel,
        dChannel = moveEditOp.detail.after.channel;
      let removed = editOp.detail.findIndex(dt => (dt.how === "removed") && (dt.channel === sChannel))
      let added = editOp.detail.findIndex(dt => (dt.how === "added") && (dt.channel === dChannel))
      if ((removed >= 0) && (added >= 0)) {
        editOp.detail = editOp.detail.filter((dt, i) => [removed, added].indexOf(i)<0);
      }
    })
    return editOp.detail.length > 0
  })



  var cost = 0;

  cost = trans.encoding.reduce(function (prev, editOp) {
    if (editOp.name.indexOf('_COUNT') >= 0) {
      var channel = editOp.name.replace(/COUNT/g, '').replace(/ADD/g, '').replace(/REMOVE/g, '').replace(/MODIFY/g, '').replace(/_/g, '').toLowerCase();
      var aggEditOp = trans.transform.filter(function (editOp) { return editOp.name === "AGGREGATE"; })[0];
      if (aggEditOp
          && aggEditOp.detail.length === 1
          && aggEditOp.detail.filter(function (dt) { return dt.channel.toLowerCase() === channel; }).length) {
        aggEditOp.cost = 0;
      }
      var binEditOp = trans.transform.filter(function (editOp) { return editOp.name === "BIN"; })[0];
      if (binEditOp && binEditOp.detail.filter(function (dt) {
        if (dt.how === "added") {
          return d.encoding[dt.channel].type === TYPES.QUANTITATIVE;
        }
        else {
          return s.encoding[dt.channel].type === TYPES.QUANTITATIVE;
        }
      }).length > 0) {
        binEditOp.cost = 0;
      }
    }
    prev += editOp.cost;
    return prev;
  }, cost);
  cost = trans.mark.reduce(function (prev, editOp) {
    prev += editOp.cost;
    return prev;
  }, cost);
  cost = trans.transform.reduce(function (prev, editOp) {
    prev += editOp.cost;
    return prev;
  }, cost);

  return {
    ...trans,
    cost
  };
}
exports.transition = transition;
function markEditOps(s, d, importedMarkEditOps) {
  var editOps = [];
  var markEditOps = importedMarkEditOps || DEFAULT_EDIT_OPS["markEditOps"];
  var newEditOp;
  if (s.mark === d.mark) {
    return editOps;
  }
  else {
    var editOpName = [s.mark.toUpperCase(), d.mark.toUpperCase()].sort().join("_");
    if (markEditOps[editOpName]) {
      newEditOp = util.duplicate(markEditOps[editOpName]);
      newEditOp.detail = { "before":s.mark.toUpperCase(), "after":d.mark.toUpperCase() };
      editOps.push(newEditOp);
    }
  }
  return editOps;
}
exports.markEditOps = markEditOps;

async function transformEditOps(s, d, importedTransformEditOps, transOptions) {
  var transformEditOps = importedTransformEditOps || DEFAULT_EDIT_OPS["transformEditOps"];
  var editOps = [];
  for (let i = 0; i < CHANNELS.length; i++) {
    const channel = CHANNELS[i];

    ["SCALE", "SORT", "AGGREGATE", "BIN", "SETTYPE"].map(async function (transformType) {
      let editOp;

      if (transformType === "SETTYPE" && transformEditOps[transformType]) {
        editOp = transformSettype(s, d, channel, transformEditOps);
      } else if (transformType === "SCALE" && transformEditOps[transformType]) {
        editOp = await scaleEditOps(s, d, channel, transformEditOps[transformType], transOptions);
      } else if (transformEditOps[transformType]) {
        editOp = transformBasic(s, d, channel, transformType, transformEditOps);
      }
      if (editOp) {
        let found = editOps.find(eo => eo.name === editOp.name);
        if (found) {
          found.detail.push(editOp.detail);
        } else {
          editOp.detail = [editOp.detail];
          editOps.push(editOp);
        }
      }
    });
  };
  var importedFilterEditOps = {
    "MODIFY_FILTER": transformEditOps["MODIFY_FILTER"],
    "ADD_FILTER": transformEditOps["ADD_FILTER"],
    "REMOVE_FILTER": transformEditOps["REMOVE_FILTER"]
  };

  editOps = editOps.concat(filterEditOps(s, d, importedFilterEditOps));
  return editOps;
}
exports.transformEditOps = transformEditOps;
function transformBasic(s, d, channel, transform, transformEditOps) {
  var sHas = false;
  var dHas = false;
  var editOp;
  var sEditOp, dEditOp;
  if (s.encoding[channel] && s.encoding[channel][transform.toLowerCase()]) {
    sHas = true;
    sEditOp = s.encoding[channel][transform.toLowerCase()];
  }
  if (d.encoding[channel] && d.encoding[channel][transform.toLowerCase()]) {
    dHas = true;
    dEditOp = d.encoding[channel][transform.toLowerCase()];
  }

  if (sHas && dHas && (!util.rawEqual(sEditOp, dEditOp))) {
    editOp = util.duplicate(transformEditOps[transform]);
    editOp.detail = { "how": "modified", "channel": channel };
    return editOp;
  }
  else if (sHas && !dHas) {
    editOp = util.duplicate(transformEditOps[transform]);
    editOp.detail = { "how": "removed", "channel": channel };
    return editOp;
  }
  else if (!sHas && dHas) {
    editOp = util.duplicate(transformEditOps[transform]);
    editOp.detail = { "how": "added", "channel": channel };
    return editOp;
  }
}
exports.transformBasic = transformBasic;

async function scaleEditOps(s, d, channel, scaleTransformEditOps, transOptions) {
  var sHas = false, sOnlyHasDomainRelated = false;
  var dHas = false, dOnlyHasDomainRelated = false;
  var editOp;
  var sEditOp, dEditOp;
  if (s.encoding[channel] && s.encoding[channel].scale) {
    sHas = true;
    sEditOp = {...s.encoding[channel].scale};
    if (!Object.keys(sEditOp).find(key => ["domain", "zero"].indexOf(key) < 0) ) {
      sOnlyHasDomainRelated = true;
    }
  }
  if (d.encoding[channel] && d.encoding[channel].scale) {
    dHas = true;
    dEditOp = {...d.encoding[channel].scale};
    if (!Object.keys(dEditOp).find(key => ["domain", "zero"].indexOf(key) < 0) ) {
      dOnlyHasDomainRelated = true;
    }
  }
  if (transOptions && transOptions.omitIncludeRawDomain) {
    if (sEditOp && sEditOp.domain && dEditOp.domain === "unaggregated") {
      delete sEditOp.domain;
      if (Object.keys(sEditOp).length === 0) {
        sOnlyHasDomainRelated = false;
        sHas = false;
      }
    }

    if (dEditOp && dEditOp.domain && (dEditOp.domain === "unaggregated")) {
      delete dEditOp.domain;
      if (Object.keys(dEditOp).length === 0) {
        dOnlyHasDomainRelated = false;
        dHas = false;
      }
    }
  }
  if (sHas && dHas && (!util.rawEqual(sEditOp, dEditOp))) {
    if (sOnlyHasDomainRelated && dOnlyHasDomainRelated && await sameDomain(s,d, channel)) {
      return;
    }
    editOp = util.duplicate(scaleTransformEditOps);
    editOp.detail = { "how": "modified", "channel": channel };
    return editOp;
  }
  else if (sHas && !dHas) {
    if (sOnlyHasDomainRelated && await sameDomain(s,d, channel)) {
      return;
    }
    editOp = util.duplicate(scaleTransformEditOps);
    editOp.detail = { "how": "removed", "channel": channel };
    return editOp;
  }
  else if (!sHas && dHas) {
    if (dOnlyHasDomainRelated && await sameDomain(s,d, channel)) {
      return;
    }
    editOp = util.duplicate(scaleTransformEditOps);
    editOp.detail = { "how": "added", "channel": channel };
    return editOp;
  }
}
exports.scaleEditOps = scaleEditOps;
async function sameDomain(s, d, channel) {
  const dView = await new vega.View(vega.parse(vl.compile(util.duplicate(d)).spec), {
    renderer: "svg"
  }).runAsync();

  const sView = await new vega.View(vega.parse(vl.compile(util.duplicate(s)).spec), {
    renderer: "svg"
  }).runAsync();

  const sScale = sView._runtime.scales[channel].value;
  const dScale = dView._runtime.scales[channel].value;

  return util.deepEqual(sScale.domain(), dScale.domain())
}
function filterEditOps(s, d, importedFilterEditOps) {

  var sFilters = [], dFilters = [];
  var editOps = [];

  if (s.transform) {

    sFilters = getFilters(s.transform.filter(trsfm => trsfm.filter).map(trsfm => trsfm.filter));
  }
  if (d.transform) {
    dFilters = getFilters(d.transform.filter(trsfm => trsfm.filter).map(trsfm => trsfm.filter));
  }

  if (sFilters.length === 0 && dFilters.length === 0) {
    return editOps;
  }

  var dOnly = util.arrayDiff(dFilters, sFilters);
  var sOnly = util.arrayDiff(sFilters, dFilters);

  var isFind = false;
  for (var i = 0; i < dOnly.length; i++) {
    for (var j = 0; j < sOnly.length; j++) {
      if (dOnly[i].id === sOnly[j].id) {
        var newEditOp = util.duplicate(importedFilterEditOps["MODIFY_FILTER"]);
        newEditOp.detail = {
          "what": [], "id": sOnly[j].id, "before":[], "after":[],
          "sFilter": sOnly[j],
          "eFilter": dOnly[i]
        };
        if (!util.deepEqual(sOnly[j].op, dOnly[i].op)) {
          newEditOp.detail.what.push("op")
          newEditOp.detail.before.push(sOnly[j].op);
          newEditOp.detail.after.push(dOnly[i].op);
        }
        if (!util.deepEqual(sOnly[j].value, dOnly[i].value)) {
          newEditOp.detail.what.push("value")
          newEditOp.detail.before.push(sOnly[j].value);
          newEditOp.detail.after.push(dOnly[i].value);
        }
        editOps.push(newEditOp);
        dOnly.splice(i, 1);
        sOnly.splice(j, 1);
        isFind = true;
        break;
      }
    }
    if (isFind) {
      isFind = false;
      i--;
      continue;
    }
  }
  for (var i = 0; i < dOnly.length; i++) {
    var newEditOp = util.duplicate(importedFilterEditOps["ADD_FILTER"]);
    newEditOp.detail = newEditOp.detail = {
      "id": dOnly[i].id,
      "what": ["field", "op", "value"],
      "before":[undefined, undefined, undefined],
      "after":[dOnly[i].field, dOnly[i].op, dOnly[i].value],
      "eFilter": dOnly[i],
      "sFilter": undefined,
    };

    editOps.push(newEditOp);
  }
  for (var i = 0; i < sOnly.length; i++) {
    var newEditOp = util.duplicate(importedFilterEditOps["REMOVE_FILTER"]);
    newEditOp.detail = newEditOp.detail = {
      "id": sOnly[i].id,
      "what": ["field", "op", "value"],
      "before": [sOnly[i].field, sOnly[i].op, sOnly[i].value],
      "after": [undefined, undefined, undefined],
      "sFilter": sOnly[i],
      "eFilter": undefined,
    };

    editOps.push(newEditOp);
  }
  return editOps;
}
exports.filterEditOps = filterEditOps;

function getFilters (filterExpression) {
  let filters;
  if (util.isArray(filterExpression)) {
    filters = filterExpression.reduce((acc, expression) => {
      return acc.concat(parsePredicateFilter(expression));
    }, []);
  } else {
    filters = parsePredicateFilter(filterExpression);
  }

  filters = d3.groups(filters, filter => filter.id)
    .map(group => {
      return {
        id: group[0],
        field: group[1].map(filter => filter.field),
        op: group[1].map(filter => filter.op),
        value: group[1].map(filter => filter.value)
      }
    })

  return filters;


}
exports.getFilters = getFilters;

function parsePredicateFilter(expression) {

  let parsed = [];
  if (util.isString(expression)) {
    parsed = parsed.concat(stringFilter(expression));
  } else {
    LOGIC_OPS.filter(logicOp => expression.hasOwnProperty(logicOp)).forEach(logicOp => {
      let subParsed;
      if (util.isArray(expression[logicOp])) {
        subParsed = expression[logicOp].reduce((subParsed, expr) => {
          return subParsed.concat(parsePredicateFilter(expr))
        }, []);
      } else {
        subParsed = parsePredicateFilter(expression[logicOp]);
      }
      let id = subParsed.map(f => f.id).join("_")
      parsed.push({
        "id": `${logicOp}>[${id}]`,
        "op": logicOp,
        "value": subParsed
      })
    })

    OPS.filter(op => expression.hasOwnProperty(op))
      .forEach(op => {
      parsed.push({
        "id": expression.field,
        "field": expression.field,
        "op": op,
        "value": JSON.stringify(expression[op])
      });
    })
  }

  if (parsed.length === 0) {
    console.log("WARN: cannot parse filters.");
  }
  return parsed;
}
exports.parsePredicateFilter = parsePredicateFilter;

function stringFilter(expression) {
  var parser = expr["parse"];
  var expressionTree = parser(expression);

  return binaryExprsFromExprTree(expressionTree, [], 0).map(function (bExpr) {
    return {
      "id": bExpr.left.property.name,
      "field": bExpr.left.property.name,
      "op": bExpr.operator,
      "value": bExpr.right.raw
    };
  });

  function binaryExprsFromExprTree(tree, arr, depth) {
    if (tree.operator === '||' || tree.operator === '&&') {
      arr = binaryExprsFromExprTree(tree.left, arr, depth + 1);
      arr = binaryExprsFromExprTree(tree.right, arr, depth + 1);
    }
    else if (['==', '===', '!==', '!=', '<', '<=', '>', '>='].indexOf(tree.operator) >= 0) {
      tree.depth = depth;
      arr.push(tree);
    }
    return arr;
  }
}



function transformSettype(s, d, channel, transformEditOps) {
  var editOp;
  if (s.encoding[channel] && d.encoding[channel]
    && (d.encoding[channel]["field"] === s.encoding[channel]["field"])
    && (d.encoding[channel]["type"] !== s.encoding[channel]["type"])) {
    editOp = util.duplicate(transformEditOps["SETTYPE"]);
    editOp.detail = {
      "before": s.encoding[channel]["type"],
      "after": d.encoding[channel]["type"],
      "channel": channel
    };
    return editOp;
  }
}
exports.transformSettype = transformSettype;


function encodingEditOps(s, d, importedEncodingEditOps) {
  if (nb.sameEncoding(s.encoding, d.encoding)) {
    return [];
  }
  var sChannels = util.keys(s.encoding);
  var sFields = sChannels.map(function (key) {
    return s.encoding[key];
  });
  var dChannels = util.keys(d.encoding);
  var dFields = dChannels.map(function (key) {
    return d.encoding[key];
  });
  var additionalFields = util.unionObjectArray(dFields, sFields, function (field) { return field.field + "_" + field.type; });
  var additionalChannels = util.arrayDiff(dChannels, sChannels);
  var u;
  function nearestNode(nodes) {
    var minD = Infinity;
    var argMinD = -1;
    nodes.forEach(function (node, index) {
      if (node.distance < minD) {
        minD = node.distance;
        argMinD = index;
      }
    });
    return nodes.splice(argMinD, 1)[0];
  }
  var nodes = nb.neighbors(s, additionalFields, additionalChannels, importedEncodingEditOps)
    .map(function (neighbor) {
    neighbor.distance = neighbor.editOp.cost,
      neighbor.prev = [s];
    return neighbor;
  });
  s.distance = 0;
  s.prev = [];
  var doneNodes = [s];
  while (nodes.length > 0) {
    u = nearestNode(nodes);
    if (nb.sameEncoding(u.encoding, d.encoding)) {
      break;
    }
    if (u.distance >= importedEncodingEditOps.ceiling.cost) {
      return [{ name: 'OVER_THE_CEILING', cost: importedEncodingEditOps.ceiling.alternatingCost }];
    }
    var newNodes = nb.neighbors(u, additionalFields, u.additionalChannels, importedEncodingEditOps);
    newNodes.forEach(function (newNode) {
      var node;
      for (var i = 0; i < doneNodes.length; i += 1) {
        if (nb.sameEncoding(doneNodes[i].encoding, newNode.encoding)) {
          return;
        }
      }
      for (var i = 0; i < nodes.length; i += 1) {
        if (nb.sameEncoding(nodes[i].encoding, newNode.encoding)) {
          node = nodes[i];
          break;
        }
      }
      if (node) {
        if (node.distance > u.distance + newNode.editOp.cost) {
          node.distance = u.distance + newNode.editOp.cost;
          node.editOp = newNode.editOp;
          node.prev = u.prev.concat([u]);
        }
      }
      else {
        newNode.distance = u.distance + newNode.editOp.cost;
        newNode.prev = u.prev.concat([u]);
        nodes.push(newNode);
      }
    });
    doneNodes.push(u);
  }
  if (!nb.sameEncoding(u.encoding, d.encoding) && nodes.length === 0) {
    return [{ name: "UNREACHABLE", cost: 999 }];
  }
  var result = [].concat(u.prev.map(function (node) {
    return node.editOp;
  }).filter(function (editOp) { return editOp; })
  );
  result.push(u.editOp);
  return result ;
}


exports.encodingEditOps = encodingEditOps;
