"use strict";
var filter_1 = require('vega-lite/src/filter');
var type_1 = require('vega-lite/src/type');
var channel_1 = require('vega-lite/src/channel');
var expr = require('vega-expression');
var util = require('../util');
var def = require('../rule/ruleSet');
var nb = require('./neighbor');
function transitionSet(s, d, importedTransitionCosts, transOptions) {
    var importedMarktypeTransitions = importedTransitionCosts ? importedTransitionCosts.marktypeTransitions : def.DEFAULT_MARKTYPE_TRANSITIONS;
    var importedTransformTransitions = importedTransitionCosts ? importedTransitionCosts.transformTransitions : def.DEFAULT_TRANSFORM_TRANSITIONS;
    var importedEncodingTransitions = importedTransitionCosts ? importedTransitionCosts.encodingTransitions : def.DEFAULT_ENCODING_TRANSITIONS;
    var transitions = {
        marktype: marktypeTransitionSet(s, d, importedMarktypeTransitions),
        transform: transformTransitionSet(s, d, importedTransformTransitions, transOptions),
        encoding: encodingTransitionSet(s, d, importedEncodingTransitions)
    };
    var cost = 0;
    cost = transitions.encoding.reduce(function (prev, transition) {
        if (transition.name.indexOf('_COUNT') >= 0) {
            var channel_2 = transition.name.replace(/COUNT/g, '').replace(/ADD/g, '').replace(/REMOVE/g, '').replace(/MODIFY/g, '').replace(/_/g, '').toLowerCase();
            var aggTr = transitions.transform.filter(function (tr) { return tr.name === "AGGREGATE"; })[0];
            if (aggTr && aggTr.detail.length === 1 && aggTr.detail.filter(function (dt) { return dt.channel.toLowerCase() === channel_2; }).length) {
                aggTr.cost = 0;
            }
            var binTr = transitions.transform.filter(function (tr) { return tr.name === "BIN"; })[0];
            if (binTr && binTr.detail.filter(function (dt) {
                if (dt.type === "added") {
                    return d.encoding[dt.channel].type === type_1.Type.QUANTITATIVE;
                }
                else {
                    return s.encoding[dt.channel].type === type_1.Type.QUANTITATIVE;
                }
            }).length > 0) {
                binTr.cost = 0;
            }
        }
        prev += transition.cost;
        return prev;
    }, cost);
    cost = transitions.marktype.reduce(function (prev, transition) {
        prev += transition.cost;
        return prev;
    }, cost);
    cost = transitions.transform.reduce(function (prev, transition) {
        prev += transition.cost;
        return prev;
    }, cost);
    transitions["cost"] = cost;
    return transitions;
}
exports.transitionSet = transitionSet;
function marktypeTransitionSet(s, d, importedMarktypeTransitions) {
    var transSet = [];
    var marktypeTransitions = importedMarktypeTransitions || def.DEFAULT_MARKTYPE_TRANSITIONS;
    var newTr;
    if (s.mark === d.mark) {
        return transSet;
    }
    else {
        var trName = [s.mark.toUpperCase(), d.mark.toUpperCase()].sort().join("_");
        if (marktypeTransitions[trName]) {
            newTr = util.duplicate(marktypeTransitions[trName]);
            newTr.detail = { "from": s.mark.toUpperCase(), "to": d.mark.toUpperCase() };
            transSet.push(newTr);
        }
    }
    return transSet;
}
exports.marktypeTransitionSet = marktypeTransitionSet;
function transformTransitionSet(s, d, importedTransformTransitions, transOptions) {
    var transformTransitions = importedTransformTransitions || def.DEFAULT_TRANSFORM_TRANSITIONS;
    var transSet = [];
    channel_1.CHANNELS.forEach(function (channel) {
        ["SCALE", "SORT", "AGGREGATE", "BIN", "SETTYPE"].map(function (transformType) {
            var trans;
            var already;
            if (transformType === "SETTYPE" && transformTransitions[transformType]) {
                trans = transformSettype(s, d, channel, transformTransitions);
            }
            else {
                if (transformTransitions[transformType]) {
                    trans = transformBasic(s, d, channel, transformType, transformTransitions, transOptions);
                }
            }
            if (trans) {
                already = util.find(transSet, function (tr) { return tr.name; }, trans);
                if (already >= 0) {
                    transSet[already].detail.push(util.duplicate(trans.detail));
                }
                else {
                    trans.detail = [util.duplicate(trans.detail)];
                    transSet.push(trans);
                }
            }
        });
    });
    var filterTransitions = {
        "MODIFY_FILTER": transformTransitions["MODIFY_FILTER"],
        "ADD_FILTER": transformTransitions["ADD_FILTER"],
        "REMOVE_FILTER": transformTransitions["REMOVE_FILTER"]
    };
    transSet = transSet.concat(filterTransitionSet(s, d, filterTransitions));
    return transSet;
}
exports.transformTransitionSet = transformTransitionSet;
function transformBasic(s, d, channel, transform, transformTransitions, transOptions) {
    var sHas = false;
    var dHas = false;
    var transistion;
    var sTransform, dTransform;
    if (s.encoding[channel] && s.encoding[channel][transform.toLowerCase()]) {
        sHas = true;
        sTransform = s.encoding[channel][transform.toLowerCase()];
    }
    if (d.encoding[channel] && d.encoding[channel][transform.toLowerCase()]) {
        dHas = true;
        dTransform = d.encoding[channel][transform.toLowerCase()];
    }
    if (transOptions && transOptions.omitIncludeRawDomain && transform === "SCALE") {
        if (sTransform && sTransform.includeRawDomain) {
            delete sTransform.includeRawDomain;
            if (Object.keys(sTransform).length === 0 && JSON.stringify(sTransform) === JSON.stringify({})) {
                sHas = false;
            }
        }
        if (dTransform && dTransform.includeRawDomain) {
            delete dTransform.includeRawDomain;
            if (Object.keys(dTransform).length === 0 && JSON.stringify(dTransform) === JSON.stringify({})) {
                dHas = false;
            }
        }
    }
    if (sHas && dHas && (!util.rawEqual(sTransform, dTransform))) {
        transistion = util.duplicate(transformTransitions[transform]);
        transistion.detail = { "type": "modified", "channel": channel };
        return transistion;
    }
    else if (sHas && !dHas) {
        transistion = util.duplicate(transformTransitions[transform]);
        transistion.detail = { "type": "removed", "channel": channel };
        return transistion;
    }
    else if (!sHas && dHas) {
        transistion = util.duplicate(transformTransitions[transform]);
        transistion.detail = { "type": "added", "channel": channel };
        return transistion;
    }
}
exports.transformBasic = transformBasic;
function filterTransitionSet(s, d, filterTransitions) {
    var sFilters = [], dFilters = [];
    var transitions = [];
    if (s.transform && s.transform.filter) {
        sFilters = filters(s.transform.filter);
    }
    if (d.transform && d.transform.filter) {
        dFilters = filters(d.transform.filter);
    }
    var dOnly = util.arrayDiff(dFilters, sFilters);
    var sOnly = util.arrayDiff(sFilters, dFilters);
    if (sFilters.length === 0 && dFilters.length === 0) {
        return transitions;
    }
    var isFind = false;
    for (var i = 0; i < dOnly.length; i++) {
        for (var j = 0; j < sOnly.length; j++) {
            if (util.rawEqual(dOnly[i].field, sOnly[j].field)) {
                var newTr = util.duplicate(filterTransitions["MODIFY_FILTER"]);
                newTr.detail = { field: sOnly[j].field };
                if (sOnly[j].op !== dOnly[j].op) {
                    newTr.detail.op = sOnly[j].op + ', ' + dOnly[j].op;
                }
                if (sOnly[j].value !== dOnly[j].value) {
                    newTr.detail.value = sOnly[j].value + ', ' + dOnly[j].value;
                }
                transitions.push(newTr);
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
        var newTr = util.duplicate(filterTransitions["ADD_FILTER"]);
        newTr.detail = util.duplicate(dOnly[i]);
        transitions.push(newTr);
    }
    for (var i = 0; i < sOnly.length; i++) {
        var newTr = util.duplicate(filterTransitions["REMOVE_FILTER"]);
        newTr.detail = util.duplicate(sOnly[i]);
        transitions.push(newTr);
    }
    return transitions;
}
exports.filterTransitionSet = filterTransitionSet;
function filters(filterExpression) {
    var filters = [];
    if (util.isArray(filterExpression)) {
        filterExpression.map(function (filter) {
            if (util.isString(filter)) {
                filters = filters.concat(stringFilter(filter));
            }
            else if (filter_1.isRangeFilter(filter)) {
                filters.push({ "field": filter.field, "op": 'range', "value": JSON.stringify(filter.range) });
            }
            else if (filter_1.isInFilter(filter)) {
                filters.push({ "field": filter.field, "op": 'in', "value": JSON.stringify(filter.in) });
            }
            else if (filter_1.isEqualFilter(filter)) {
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
        else if (filter_1.isRangeFilter(filter)) {
            filters.push({ "field": filter.field, "op": 'range', "value": JSON.stringify(filter.range) });
        }
        else if (filter_1.isInFilter(filter)) {
            filters.push({ "field": filter.field, "op": 'in', "value": JSON.stringify(filter.in) });
        }
        else if (filter_1.isEqualFilter(filter)) {
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
function transformSettype(s, d, channel, transformTransitions) {
    var transistion;
    if (s.encoding[channel] && d.encoding[channel]
        && (d.encoding[channel]["field"] === s.encoding[channel]["field"])
        && (d.encoding[channel]["type"] !== s.encoding[channel]["type"])) {
        transistion = util.duplicate(transformTransitions["SETTYPE"]);
        transistion.detail = {
            "type": s.encoding[channel]["type"] + "_" + d.encoding[channel]["type"],
            "channel": channel
        };
        return transistion;
    }
}
exports.transformSettype = transformSettype;
function encodingTransitionSet(s, d, importedEncodingTransitions) {
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
    var nodes = nb.neighbors(s, additionalFields, additionalChannels, importedEncodingTransitions)
        .map(function (neighbor) {
        neighbor.distance = neighbor.transition.cost,
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
        if (u.distance >= importedEncodingTransitions.ceiling.cost) {
            return [{ name: 'OVER_THE_CEILING', cost: importedEncodingTransitions.ceiling.alternatingCost }];
        }
        var newNodes = nb.neighbors(u, additionalFields, u.additionalChannels, importedEncodingTransitions);
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
                if (node.distance > u.distance + newNode.transition.cost) {
                    node.distance = u.distance + newNode.transition.cost;
                    node.transition = newNode.transition;
                    node.prev = u.prev.concat([u]);
                }
            }
            else {
                newNode.distance = u.distance + newNode.transition.cost;
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
        return node.transition;
    }).filter(function (transition) { return transition; });
    result.push(u.transition);
    return result;
}
exports.encodingTransitionSet = encodingTransitionSet;
//# sourceMappingURL=trans.js.map