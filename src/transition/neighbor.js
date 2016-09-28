"use strict";
var util = require('../util');
var def = require('../rule/ruleSet');
function neighbors(spec, additionalFields, additionalChannels, importedEncodingTransitions) {
    var neighbors = [];
    var encodingTransitions = importedEncodingTransitions || def.DEFAULT_ENCODING_TRANSITIONS;
    var inChannels = util.keys(spec.encoding);
    var exChannels = additionalChannels;
    inChannels.forEach(function (channel) {
        var newNeighbor = util.duplicate(spec);
        var transitionType = "REMOVE_" + channel.toUpperCase();
        transitionType += (spec.encoding[channel].field === "*") ? "_COUNT" : "";
        var transition = util.duplicate(encodingTransitions[transitionType]);
        var newAdditionalFields = util.duplicate(additionalFields);
        if (util.find(newAdditionalFields, util.rawEqual, newNeighbor.encoding[channel]) === -1) {
            newAdditionalFields.push(newNeighbor.encoding[channel]);
        }
        var newAdditionalChannels = util.duplicate(additionalChannels);
        transition.detail = { "field": newNeighbor.encoding[channel].field, "channel": channel };
        newAdditionalChannels.push(channel);
        delete newNeighbor.encoding[channel];
        if (validate(newNeighbor)) {
            newNeighbor.transition = transition;
            newNeighbor.additionalFields = newAdditionalFields;
            newNeighbor.additionalChannels = newAdditionalChannels;
            neighbors.push(newNeighbor);
        }
        ;
        additionalFields.forEach(function (field, index) {
            if (field.field !== spec.encoding[channel].field) {
                newNeighbor = util.duplicate(spec);
                transitionType = "MODIFY_" + channel.toUpperCase();
                if (spec.encoding[channel].field === "*" && field.field !== "*") {
                    transitionType += "_REMOVE_COUNT";
                }
                else if (spec.encoding[channel].field !== "*" && field.field === "*") {
                    transitionType += "_ADD_COUNT";
                }
                transition = util.duplicate(encodingTransitions[transitionType]);
                newAdditionalFields = util.duplicate(additionalFields);
                newAdditionalFields.splice(index, 1);
                if (util.find(newAdditionalFields, util.rawEqual, newNeighbor.encoding[channel]) === -1) {
                    newAdditionalFields.push(newNeighbor.encoding[channel]);
                }
                newAdditionalChannels = util.duplicate(additionalChannels);
                newNeighbor.encoding[channel] = field;
                transition.detail = { "field": [spec.encoding[channel].field, field.field].join(','), "channel": channel };
                if (validate(newNeighbor)) {
                    newNeighbor.transition = transition;
                    newNeighbor.additionalFields = newAdditionalFields;
                    newNeighbor.additionalChannels = newAdditionalChannels;
                    neighbors.push(newNeighbor);
                }
                ;
            }
        });
        inChannels.forEach(function (anotherChannel) {
            if (anotherChannel === channel
                || (["x", "y"].indexOf(channel) < 0 || ["x", "y"].indexOf(anotherChannel) < 0)) {
                return;
            }
            newNeighbor = util.duplicate(spec);
            transition = util.duplicate(encodingTransitions["SWAP_X_Y"]);
            newAdditionalFields = util.duplicate(additionalFields);
            newAdditionalChannels = util.duplicate(additionalChannels);
            var tempChannel = util.duplicate(newNeighbor.encoding[channel]);
            newNeighbor.encoding[channel] = newNeighbor.encoding[anotherChannel];
            newNeighbor.encoding[anotherChannel] = tempChannel;
            transition.detail = { "field": [spec.encoding["x"].field, spec.encoding["y"].field].join(','), "channel": "x,y" };
            if (validate(newNeighbor)) {
                newNeighbor.transition = transition;
                newNeighbor.additionalFields = newAdditionalFields;
                newNeighbor.additionalChannels = newAdditionalChannels;
                neighbors.push(newNeighbor);
            }
            ;
        });
        exChannels.forEach(function (exChannel, index) {
            newNeighbor = util.duplicate(spec);
            var newNeighborChannels = (channel + "_" + exChannel).toUpperCase();
            transition = util.duplicate(encodingTransitions["MOVE_" + newNeighborChannels]);
            newAdditionalFields = util.duplicate(additionalFields);
            newAdditionalChannels = util.duplicate(additionalChannels);
            newAdditionalChannels.splice(index, 1);
            newAdditionalChannels.push(channel);
            newNeighbor.encoding[exChannel] = util.duplicate(newNeighbor.encoding[channel]);
            delete newNeighbor.encoding[channel];
            transition.detail = { "field": spec.encoding[channel].field, "channel": [channel, exChannel].join(',') };
            if (validate(newNeighbor)) {
                newNeighbor.transition = transition;
                newNeighbor.additionalFields = newAdditionalFields;
                newNeighbor.additionalChannels = newAdditionalChannels;
                neighbors.push(newNeighbor);
            }
            ;
        });
    });
    exChannels.forEach(function (channel, chIndex) {
        additionalFields.forEach(function (field, index) {
            var newNeighbor = util.duplicate(spec);
            var transitionType = "ADD_" + channel.toUpperCase();
            transitionType += (field.field === "*") ? "_COUNT" : "";
            var transition = util.duplicate(encodingTransitions[transitionType]);
            var newAdditionalFields = util.duplicate(additionalFields);
            var newAdditionalChannels = util.duplicate(additionalChannels);
            newAdditionalFields.splice(index, 1);
            newNeighbor.encoding[channel] = field;
            newAdditionalChannels.splice(chIndex, 1);
            transition.detail = { "field": field.field, "channel": channel };
            if (validate(newNeighbor)) {
                newNeighbor.transition = transition;
                newNeighbor.additionalFields = newAdditionalFields;
                newNeighbor.additionalChannels = newAdditionalChannels;
                neighbors.push(newNeighbor);
            }
            ;
        });
    });
    for (var i = 0; i < neighbors.length; i += 1) {
        for (var j = i + 1; j < neighbors.length; j += 1) {
            if (sameEncoding(neighbors[i].encoding, neighbors[j].encoding)) {
                neighbors.splice(j, 1);
                j -= 1;
            }
        }
    }
    return neighbors;
}
exports.neighbors = neighbors;
function validate(spec) {
    return true;
}
function sameEncoding(a, b) {
    var aKeys = util.keys(a);
    var bKeys = util.keys(b);
    if (aKeys.length !== bKeys.length) {
        return false;
    }
    var allKeys = util.union(aKeys, bKeys);
    for (var i = 0; i < allKeys.length; i += 1) {
        var key = allKeys[i];
        if (!(a[key] && b[key])) {
            return false;
        }
        if (a[key].field !== b[key].field) {
            return false;
        }
    }
    return true;
}
exports.sameEncoding = sameEncoding;
//# sourceMappingURL=neighbor.js.map