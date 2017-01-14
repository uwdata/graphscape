"use strict";
var vlFilter = require('vega-lite/src/filter');
var type = require('vega-lite/src/type');
var channel_1 = require('vega-lite/src/channel');
var expr = require('vega-expression');
var util = require('../util');
var def = require('../editOp/editOpSet');
var nb = require('./neighbor');
function transition(s, d, importedTransitionCosts, transOptions) {
    var importedMarkEditOps = importedTransitionCosts ? importedTransitionCosts.markEditOps : def.DEFAULT_MARK_EDIT_OPS;
    var importedTransformEditOps = importedTransitionCosts ? importedTransitionCosts.transformEditOps : def.DEFAULT_TRANSFORM_EDIT_OPS;
    var importedEncodingEditOps = importedTransitionCosts ? importedTransitionCosts.encodingEditOps : def.DEFAULT_ENCODING_EDIT_OPS;
    var trans = {
        mark: markEditOps(s, d, importedMarkEditOps),
        transform: transformEditOps(s, d, importedTransformEditOps, transOptions),
        encoding: encodingEditOps(s, d, importedEncodingEditOps)
    };
    var cost = 0;
    cost = trans.encoding.reduce(function (prev, editOp) {
        if (editOp.name.indexOf('_COUNT') >= 0) {
            var channel = editOp.name.replace(/COUNT/g, '').replace(/ADD/g, '').replace(/REMOVE/g, '').replace(/MODIFY/g, '').replace(/_/g, '').toLowerCase();
            var aggEditOp = trans.transform.filter(function (editOp) { return editOp.name === "AGGREGATE"; })[0];
            if (aggEditOp && aggEditOp.detail.length === 1 && aggEditOp.detail.filter(function (dt) { return dt.channel.toLowerCase() === channel; }).length) {
                aggEditOp.cost = 0;
            }
            var binEditOp = trans.transform.filter(function (editOp) { return editOp.name === "BIN"; })[0];
            if (binEditOp && binEditOp.detail.filter(function (dt) {
                if (dt.type === "added") {
                    return d.encoding[dt.channel].type === type.Type.QUANTITATIVE;
                }
                else {
                    return s.encoding[dt.channel].type === type.Type.QUANTITATIVE;
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
    trans["cost"] = cost;
    return trans;
}
exports.transition = transition;
function markEditOps(s, d, importedMarkEditOps) {
    var editOps = [];
    var markEditOps = importedMarkEditOps || def.DEFAULT_MARK_EDIT_OPS;
    var newEditOp;
    if (s.mark === d.mark) {
        return editOps;
    }
    else {
        var editOpName = [s.mark.toUpperCase(), d.mark.toUpperCase()].sort().join("_");
        if (markEditOps[editOpName]) {
            newEditOp = util.duplicate(markEditOps[editOpName]);
            newEditOp.detail = { "from": s.mark.toUpperCase(), "to": d.mark.toUpperCase() };
            editOps.push(newEditOp);
        }
    }
    return editOps;
}
exports.markEditOps = markEditOps;
function transformEditOps(s, d, importedTransformEditOps, transOptions) {
    var transformEditOps = importedTransformEditOps || def.DEFAULT_TRANSFORM_EDIT_OPS;
    var editOps = [];
    channel_1.CHANNELS.forEach(function (channel) {
        ["SCALE", "SORT", "AGGREGATE", "BIN", "SETTYPE"].map(function (transformType) {
            var editOp;
            var already;
            if (transformType === "SETTYPE" && transformEditOps[transformType]) {
                editOp = transformSettype(s, d, channel, transformEditOps);
            }
            else {
                if (transformEditOps[transformType]) {
                    editOp = transformBasic(s, d, channel, transformType, transformEditOps, transOptions);
                }
            }
            if (editOp) {
                already = util.find(editOps, function (eo) { return eo.name; }, editOp);
                if (already >= 0) {
                    editOps[already].detail.push(util.duplicate(editOp.detail));
                }
                else {
                    editOp.detail = [util.duplicate(editOp.detail)];
                    editOps.push(editOp);
                }
            }
        });
    });
    var importedFilterEditOps = {
        "MODIFY_FILTER": transformEditOps["MODIFY_FILTER"],
        "ADD_FILTER": transformEditOps["ADD_FILTER"],
        "REMOVE_FILTER": transformEditOps["REMOVE_FILTER"]
    };
    editOps = editOps.concat(filterEditOps(s, d, importedFilterEditOps));
    return editOps;
}
exports.transformEditOps = transformEditOps;
function transformBasic(s, d, channel, transform, transformEditOps, transOptions) {
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
    if (transOptions && transOptions.omitIncludeRawDomain && transform === "SCALE") {
        if (sEditOp && sEditOp.includeRawDomain) {
            delete sEditOp.includeRawDomain;
            if (Object.keys(sEditOp).length === 0 && JSON.stringify(sEditOp) === JSON.stringify({})) {
                sHas = false;
            }
        }
        if (dEditOp && dEditOp.includeRawDomain) {
            delete dEditOp.includeRawDomain;
            if (Object.keys(dEditOp).length === 0 && JSON.stringify(dEditOp) === JSON.stringify({})) {
                dHas = false;
            }
        }
    }
    if (sHas && dHas && (!util.rawEqual(sEditOp, dEditOp))) {
        editOp = util.duplicate(transformEditOps[transform]);
        editOp.detail = { "type": "modified", "channel": channel };
        return editOp;
    }
    else if (sHas && !dHas) {
        editOp = util.duplicate(transformEditOps[transform]);
        editOp.detail = { "type": "removed", "channel": channel };
        return editOp;
    }
    else if (!sHas && dHas) {
        editOp = util.duplicate(transformEditOps[transform]);
        editOp.detail = { "type": "added", "channel": channel };
        return editOp;
    }
}
exports.transformBasic = transformBasic;
function filterEditOps(s, d, importedFilterEditOps) {
    var sFilters = [], dFilters = [];
    var editOps = [];
    if (s.transform && s.transform.filter) {
        sFilters = filters(s.transform.filter);
    }
    if (d.transform && d.transform.filter) {
        dFilters = filters(d.transform.filter);
    }
    var dOnly = util.arrayDiff(dFilters, sFilters);
    var sOnly = util.arrayDiff(sFilters, dFilters);
    if (sFilters.length === 0 && dFilters.length === 0) {
        return editOps;
    }
    var isFind = false;
    for (var i = 0; i < dOnly.length; i++) {
        for (var j = 0; j < sOnly.length; j++) {
            if (util.rawEqual(dOnly[i].field, sOnly[j].field)) {
                var newEditOp = util.duplicate(importedFilterEditOps["MODIFY_FILTER"]);
                newEditOp.detail = { field: sOnly[j].field };
                if (sOnly[j].op !== dOnly[j].op) {
                    newEditOp.detail.op = sOnly[j].op + ', ' + dOnly[j].op;
                }
                if (sOnly[j].value !== dOnly[j].value) {
                    newEditOp.detail.value = sOnly[j].value + ', ' + dOnly[j].value;
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
        newEditOp.detail = util.duplicate(dOnly[i]);
        editOps.push(newEditOp);
    }
    for (var i = 0; i < sOnly.length; i++) {
        var newEditOp = util.duplicate(importedFilterEditOps["REMOVE_FILTER"]);
        newEditOp.detail = util.duplicate(sOnly[i]);
        editOps.push(newEditOp);
    }
    return editOps;
}
exports.filterEditOps = filterEditOps;
function filters(filterExpression) {
    var filters = [];
    if (util.isArray(filterExpression)) {
        filterExpression.map(function (filter) {
            if (util.isString(filter)) {
                filters = filters.concat(stringFilter(filter));
            }
            else if (vlFilter.isRangeFilter(filter)) {
                filters.push({ "field": filter.field, "op": 'range', "value": JSON.stringify(filter.range) });
            }
            else if (vlFilter.isInFilter(filter)) {
                filters.push({ "field": filter.field, "op": 'in', "value": JSON.stringify(filter.in) });
            }
            else if (vlFilter.isEqualFilter(filter)) {
                filters.push({ "field": filter.field, "op": 'equal', "value": filter.equal.toString() });
            }
            else {
                console.log("WARN: cannot parse filters.");
            }
        });
    }
    else {
        var filter = filterExpression;
        if (util.isString(filter)) {
            filters = filters.concat(stringFilter(filter));
        }
        else if (vlFilter.isRangeFilter(filter)) {
            filters.push({ "field": filter.field, "op": 'range', "value": JSON.stringify(filter.range) });
        }
        else if (vlFilter.isInFilter(filter)) {
            filters.push({ "field": filter.field, "op": 'in', "value": JSON.stringify(filter.in) });
        }
        else if (vlFilter.isEqualFilter(filter)) {
            filters.push({ "field": filter.field, "op": 'equal', "value": filter.equal.toString() });
        }
        else {
            console.log("WARN: cannot parse filters.");
        }
    }
    return filters;
    function stringFilter(expression) {
        var parser = expr["parse"];
        var expressionTree = parser(expression);
        return binaryExprsFromExprTree(expressionTree.body[0].expression, [], 0).map(function (bExpr) {
            return { "field": bExpr.left.property.name, "op": bExpr.operator, "value": bExpr.right.raw };
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
}
exports.filters = filters;
function transformSettype(s, d, channel, transformEditOps) {
    var editOp;
    if (s.encoding[channel] && d.encoding[channel]
        && (d.encoding[channel]["field"] === s.encoding[channel]["field"])
        && (d.encoding[channel]["type"] !== s.encoding[channel]["type"])) {
        editOp = util.duplicate(transformEditOps["SETTYPE"]);
        editOp.detail = {
            "type": s.encoding[channel]["type"] + "_" + d.encoding[channel]["type"],
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
    var result = u.prev.map(function (node) {
        return node.editOp;
    }).filter(function (editOp) { return editOp; });
    result.push(u.editOp);
    return result;
}
exports.encodingEditOps = encodingEditOps;
//# sourceMappingURL=trans.js.map