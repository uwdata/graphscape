"use strict";
var expect = require('chai').expect;
var ruleSet = require('../ruleSetForTest');
var trans = require('../../src/transition/trans');
var util = require('../../src/util');
var startVL = {
    "data": { "url": "/data/cars.json" },
    "mark": "area",
    "transform": { "filter": "datum.Year > 1970 " },
    "encoding": {
        "x": { "type": "temporal", "field": "Year", "timeUnit": "year" },
        "y": { "type": "quantitative",
            "field": "*",
            "aggregate": "count"
        },
        "color": { "type": "nominal", "field": "Origin" }
    }
};
var destinationVL = {
    "data": { "url": "/data/cars.json" },
    "mark": "point",
    "encoding": {
        "x": { "type": "quantitative", "field": "Horsepower", "scale": { "type": "log" } },
        "y": {
            "type": "quantitative",
            "field": "Acceleration",
            "scale": { "type": "log" }
        },
        "color": { "type": "ordinal", "field": "Origin" }
    }
};
describe('transition.trans', function () {
    describe('marktype transition', function () {
        it('should return a marktype transition correctly.', function () {
            var tr = trans.marktypeTransitionSet(startVL, destinationVL, ruleSet.DEFAULT_TRANSITIONS["marktypeTransitions"])[0];
            expect(tr.cost).to.eq(ruleSet.DEFAULT_TRANSITIONS["marktypeTransitions"]["AREA_POINT"].cost);
            expect(tr.detail.from).to.eq("AREA");
            expect(tr.detail.to).to.eq("POINT");
        });
    });
    describe('transform transition', function () {
        var result = trans.transformTransitionSet(startVL, destinationVL, ruleSet.DEFAULT_TRANSITIONS["transformTransitions"]);
        it('should return SCALE,AGGREGATE, and SORT transitions correctly.', function () {
            var scaleTrs = trans.transformBasic(startVL, destinationVL, "y", "SCALE", ruleSet.DEFAULT_TRANSITIONS["transformTransitions"]);
            expect(scaleTrs.cost).to.eq(ruleSet.DEFAULT_TRANSITIONS["transformTransitions"]["SCALE"].cost);
            expect(trans.transformBasic(startVL, destinationVL, "y", "AGGREGATE", ruleSet.DEFAULT_TRANSITIONS["transformTransitions"]).cost).to.eq(ruleSet.DEFAULT_TRANSITIONS["transformTransitions"]["AGGREGATE"].cost);
            expect(trans.transformBasic(startVL, destinationVL, "y", "SORT", ruleSet.DEFAULT_TRANSITIONS["transformTransitions"])).to.eq(undefined);
        });
        it('should return SCALE,AGGREGATE, and SORT transitions with detail correctly.', function () {
            expect(result[0].detail.length).to.eq(2);
        });
        it('should omit SCALE if omitIncludeRawDomain is true.', function () {
            var testVL = util.duplicate(startVL);
            testVL.encoding.y["scale"] = { includeRawDomain: true };
            var real = trans.transformBasic(startVL, testVL, "y", "SCALE", ruleSet.DEFAULT_TRANSITIONS["transformTransitions"], { omitIncludeRawDomain: true });
            expect(real).to.eq(undefined);
        });
        // YH : Deprecated SETTYPE transition
        // it('should return SETTYPE transition correctly.', function () {
        //     expect(trans.transformSettype(startVL, destinationVL, "color", ruleSet.DEFAULT_TRANSITIONS["transformTransitions"]).name).to.eq("SETTYPE");
        // });
        it('should return all transitions without order.', function () {
            expect(result.length).to.eq(3);
        });
        var filterTransitions = {
            "MODIFY_FILTER": ruleSet.DEFAULT_TRANSITIONS["transformTransitions"]["MODIFY_FILTER"],
            "ADD_FILTER": ruleSet.DEFAULT_TRANSITIONS["transformTransitions"]["ADD_FILTER"],
            "REMOVE_FILTER": ruleSet.DEFAULT_TRANSITIONS["transformTransitions"]["REMOVE_FILTER"]
        };
        it('should return ADD_FILTER / REMOVE_FILTER transition correctly.', function () {
            var startVL = { "transform": { "filter": "datum.A == 0 && datum.B == 100 && datum.C == 3  " } };
            var destinationVL = { "transform": { "filter": "datum.A == 0 && datum.B == 100 && datum.D == 4" } };
            var sd = trans.filterTransitionSet(startVL, destinationVL, filterTransitions);
            expect(sd.length).to.eq(2);
            expect(sd[0].name).to.eq("ADD_FILTER");
            expect(sd[0].detail.field).to.eq("D");
            expect(sd[0].detail.op).to.eq("==");
            expect(sd[0].detail.value).to.eq("4");
            expect(sd[1].name).to.eq("REMOVE_FILTER");
            expect(sd[1].detail.field).to.eq("C");
            expect(sd[1].detail.op).to.eq("==");
            expect(sd[1].detail.value).to.eq("3");
        });
        it('should return MODIFY_FILTER  transition correctly.', function () {
            var startVL = { "transform": { "filter": "datum.Running_Time_min > 0" } };
            var destinationVL = { "transform": { "filter": "datum.Running_Time_min == 100 && datum.Rotten_Tomato_Rating == 100" } };
            var sd = trans.filterTransitionSet(startVL, destinationVL, filterTransitions);
            expect(sd[0].name).to.eq("MODIFY_FILTER");
            expect(sd[0].detail.field).to.eq("Running_Time_min");
            expect(sd[0].detail.op).to.eq(">, ==");
            expect(sd[0].detail.value).to.eq("0, 100");
            expect(sd[1].name).to.eq("ADD_FILTER");
            expect(sd[1].detail.field).to.eq("Rotten_Tomato_Rating");
            expect(sd[1].detail.op).to.eq("==");
            expect(sd[1].detail.value).to.eq("100");
            startVL = { "transform": { "filter": "datum.A == 0 && datum.B == 100" } };
            destinationVL = { "transform": { "filter": "datum.A != 0 && datum.D == 100" } };
            sd = trans.filterTransitionSet(startVL, destinationVL, filterTransitions);
            expect(sd[0].name).to.eq("MODIFY_FILTER");
            expect(sd[0].detail.op).to.eq("==, !=");
            expect(sd[0].detail.value).to.eq(undefined);
            expect(sd[1].name).to.eq("ADD_FILTER");
            expect(sd[1].detail.field).to.eq("D");
            expect(sd[1].detail.op).to.eq("==");
            expect(sd[1].detail.value).to.eq("100");
            expect(sd[2].name).to.eq("REMOVE_FILTER");
            expect(sd[2].detail.field).to.eq("B");
            expect(sd[2].detail.op).to.eq("==");
            expect(sd[2].detail.value).to.eq("100");
        });
        it('should return MODIFY_FILTER  transition when filter has Filter objects correctly.', function () {
            var startVL = { "transform": { "filter": { field: "Running_Time_min", range: [0, null] } } };
            var destinationVL = { "transform": { "filter": [{ field: "Running_Time_min", equal: "0" }, { field: "Rotten_Tomato_Rating", equal: "100" }] } };
            var sd = trans.filterTransitionSet(startVL, destinationVL, filterTransitions);
            expect(sd[0].name).to.eq("MODIFY_FILTER");
            expect(sd[0].detail.op).to.eq("range, equal");
            expect(sd[0].detail.value).to.eq('[0,null], 0');
            expect(sd[1].name).to.eq("ADD_FILTER");
            expect(sd[1].detail.field).to.eq("Rotten_Tomato_Rating");
            expect(sd[1].detail.op).to.eq("equal");
            expect(sd[1].detail.value).to.eq('100');
            var startVL2 = { "transform": { "filter": ["datum.A == 0", { field: "B", in: ['red', 'blue'] }] } };
            var destinationVL2 = { "transform": { "filter": "datum.A != 0 && datum.D == 100" } };
            sd = trans.filterTransitionSet(startVL2, destinationVL2, filterTransitions);
            expect(sd[0].name).to.eq("MODIFY_FILTER");
            expect(sd[0].detail.op).to.eq("==, !=");
            expect(sd[0].detail.value).to.eq(undefined);
            expect(sd[1].name).to.eq("ADD_FILTER");
            expect(sd[1].detail.field).to.eq("D");
            expect(sd[1].detail.op).to.eq("==");
            expect(sd[1].detail.value).to.eq("100");
            expect(sd[2].name).to.eq("REMOVE_FILTER");
            expect(sd[2].detail.field).to.eq("B");
            expect(sd[2].detail.op).to.eq("in");
            expect(sd[2].detail.value).to.eq('["red","blue"]');
        });
        it('should return FILTER ARITHMETIC transition correctly.', function () {
            var startVL = { "transform": { "filter": "datum.Running_Time_min > 0" } };
            var destinationVL = { "transform": { "filter": "datum.Running_Time_min > 10" } };
            expect(trans.filterTransitionSet(startVL, destinationVL, filterTransitions)[0].name).to.eq("MODIFY_FILTER");
            startVL = { "transform": { "filter": "datum.A == 0 && datum.B == 100 && datum.S !== 1" } };
            destinationVL = { "transform": { "filter": "datum.A == 0 && datum.S !== 1 && datum.B == 100" } };
            expect(trans.filterTransitionSet(startVL, destinationVL, filterTransitions).length).to.eq(0);
            startVL = { "transform": { "filter": "datum.Running_Time_min > 0" } };
            destinationVL = { "transform": { "filter": "datum.Running_Time_min == 0" } };
            expect(trans.filterTransitionSet(startVL, destinationVL, filterTransitions)[0].name).to.eq("MODIFY_FILTER");
        });
    });
    describe('encoding transition', function () {
        it('should return empty array if start is equal to dest.', function () {
            expect(trans.encodingTransitionSet(startVL, startVL, ruleSet.DEFAULT_TRANSITIONS["encodingTransitions"]).length).to.eq(0);
        });
        it('should return all encoding transitions', function () {
            var source = {
                "data": { "url": "data/cars.json" },
                "mark": "point",
                "encoding": {
                    "x": { "field": "Horsepower", "type": "quantitative" }
                }
            };
            var target1 = util.duplicate(source);
            target1.encoding.y = { "field": "Origin", "type": "ordinal" };
            var target2 = util.duplicate(target1);
            delete target2.encoding.x;
            target2.encoding.color = { "field": "Horsepower", "type": "quantitative" };
            var result1 = trans.encodingTransitionSet(source, target1, ruleSet.DEFAULT_TRANSITIONS["encodingTransitions"]);
            var result2 = trans.encodingTransitionSet(source, target2, ruleSet.DEFAULT_TRANSITIONS["encodingTransitions"]);
            var result3 = trans.encodingTransitionSet(startVL, destinationVL, ruleSet.DEFAULT_TRANSITIONS["encodingTransitions"]);
            console.log(result2);
            expect(result1.length).to.eq(1);
            expect(result1[0].detail.field).to.eq("Origin");
            expect(result1[0].detail.channel).to.eq("y");
            expect(result2.length).to.eq(2);
            expect(result2[0].detail.field).to.eq("Horsepower");
            expect(result2[0].detail.channel).to.eq("x,color");
            expect(result3.length).to.eq(2);
            expect(result3[0].detail.field).to.eq("*,Acceleration");
            expect(result3[0].detail.channel).to.eq("y");
            var destination = {
                "description": "A scatterplot showing horsepower and miles per gallons for various cars.",
                "data": { "url": "data/cars.json" },
                "mark": "point",
                "encoding": {
                    "x": { "type": "quantitative", "field": "Acceleration" },
                    "y": { "type": "quantitative", "field": "Horsepower" }
                }
            };
            var origin = {
                "description": "A scatterplot showing horsepower and miles per gallons for various cars.",
                "data": { "url": "data/cars.json" },
                "mark": "point",
                "encoding": {
                    "x": {
                        "type": "quantitative",
                        "field": "Acceleration",
                        "bin": true
                    },
                    "y": {
                        "type": "quantitative",
                        "field": "*",
                        "scale": { "type": "log" },
                        "aggregate": "count"
                    }
                }
            };
            var result4 = trans.encodingTransitionSet(origin, destination, ruleSet.DEFAULT_TRANSITIONS["encodingTransitions"]);
            expect(result4.length).to.eq(1);
        });

        it('should return OVER_THE_CEILING if the sum of encoding transitions exceed OVER_THE_CEILING\'s cost', function () {

            var ruleSetWithCeil = util.duplicate(ruleSet.DEFAULT_TRANSITIONS["encodingTransitions"]);
            ruleSetWithCeil["ceiling"] = {"cost": 4.1,"alternatingCost": 5.81}
            this.timeout(500000);
            var startVL = {
                "data": { "url": "data/cars.json" },
                "mark": "line",
                "encoding": {
                    "x": { "field": "Year", "type": "temporal", "timeUnit": "year" }
                }
            };
            var destinationVL = {
                "data": { "url": "data/cars.json" },
                "mark": "point",
                "encoding": {
                    "x": { "field": "Horsepower", "type": "quantitative", "aggregate": "mean" }
                    
                }
            };
            expect(trans.encodingTransitionSet(startVL, destinationVL, ruleSetWithCeil)[0].name)
                .to.eq("OVER_THE_CEILING");
        });

        it('should return the correct answer for redundant encodings', function () {
            var source = {
                "encoding": {
                    "x": {
                        "field": "Major_Genre",
                        "type": "nominal",
                        "sort": { "op": "mean", "field": "Profit", "order": "descending" }
                    },
                    "y": {
                        "field": "Profit",
                        "aggregate": "mean",
                        "type": "quantitative"
                    }
                }
            };
            var target = util.duplicate(source);
            target.encoding.size = {
                "field": "Profit",
                "aggregate": "stdev",
                "type": "quantitative"
            };
            var result1 = trans.encodingTransitionSet(source, target, ruleSet.DEFAULT_TRANSITIONS["encodingTransitions"]);
            expect(result1.length).to.eq(1);
        });
        it('should return all encoding transitions correctly when nodes are updated during Dijkstra Algorithm.', function () {
            this.timeout(500000);
            var startVL = {
                "data": {
                    "url": "data/population.json",
                    "formatType": "json"
                },
                "mark": "area",
                "encoding": {
                    "column": {
                        "field": "year",
                        "type": "ordinal"
                    },
                    "x": {
                        "field": "age",
                        "type": "ordinal"
                    },
                    "y": {
                        "field": "people",
                        "type": "quantitative"
                    },
                    "color": {
                        "field": "sex",
                        "type": "nominal"
                    }
                }
            };
            var destinationVL = {
                "data": {
                    "url": "data/population.json",
                    "formatType": "json"
                },
                "mark": "point",
                "encoding": {
                    "row": {
                        "field": "year",
                        "type": "ordinal"
                    },
                    "x": {
                        "field": "age",
                        "type": "ordinal"
                    },
                    "size": {
                        "field": "people",
                        "type": "quantitative"
                    }
                }
            };
            var result = trans.encodingTransitionSet(startVL, destinationVL, ruleSet.DEFAULT_TRANSITIONS["encodingTransitions"]);
            expect(result.length).to.eq(3);
        });
    });
    describe('whole transition', function () {
        it('should return modified costs for _COUNT type encoding transitions.', function () {
            var startVL = {
                "mark": "area",
                "encoding": {
                    "y": { "type": "quantitative", "field": "A" }
                }
            };
            var destinationVL = {
                "mark": "area",
                "encoding": {
                    "x": { "type": "quantitative", "field": "*", "aggregate": "count" },
                    "y": { "type": "quantitative", "field": "A", "bin": true }
                }
            };
            var destinationVL2 = {
                "mark": "area",
                "encoding": {
                    "x": { "type": "quantitative", "field": "*", "aggregate": "count" },
                    "y": { "type": "quantitative", "field": "A", "aggregate": "mean", "bin": true }
                }
            };
            var result = trans.transitionSet(startVL, destinationVL, ruleSet.DEFAULT_TRANSITIONS);
            var actualCost = ruleSet.DEFAULT_TRANSITIONS.encodingTransitions["ADD_X_COUNT"].cost;
            expect(result.encoding[0].cost).to.eq(actualCost);
            var result2 = trans.transitionSet(startVL, destinationVL2, ruleSet.DEFAULT_TRANSITIONS);
            actualCost = ruleSet.DEFAULT_TRANSITIONS.encodingTransitions["ADD_X_COUNT"].cost + ruleSet.DEFAULT_TRANSITIONS.transformTransitions["AGGREGATE"].cost;
            expect(result2['cost']).to.eq(actualCost);
        });
        it('should return all transitions correctly.', function () {
            var result = trans.transitionSet(startVL, destinationVL, ruleSet.DEFAULT_TRANSITIONS);
            expect(result.marktype[0].cost).to.eq(ruleSet.DEFAULT_TRANSITIONS["marktypeTransitions"]["AREA_POINT"].cost);
            expect(result.transform.length).to.eq(3);
            expect(result.encoding.length).to.eq(2);
        });
    });
    it('should return modified costs for _COUNT type encoding transitions.', function () {
        var startVL = {
            "data": { "url": "data/cameras.json" },
            "mark": "bar",
            "transform": {
                "filter": "datum.Storage_included <= 64 && datum.Zoom_wide>0"
            },
            "encoding": {
                "x": { "field": "Price", "type": "quantitative", "bin": true },
                "y": {
                    "field": "*",
                    "type": "quantitative",
                    "aggregate": "count"
                }
            }
        };
        var destinationVL = {
            "data": { "url": "data/cameras.json" },
            "mark": "point",
            "transform": {
                "filter": "datum.Storage_included <= 64 && datum.Zoom_wide>0"
            },
            "encoding": {
                "y": { "field": "Max_resolution", "type": "quantitative" },
                "x": { "field": "Weight", "type": "quantitative" }
            }
        };
        var result = trans.transitionSet(startVL, destinationVL, ruleSet.DEFAULT_TRANSITIONS);
        console.log(result);
    });
});