# Guide to use *GrapeScape*
(last updated 2016-03-10)


### Purpose
Sorting *Vega-Lite* visualizations to have the smallest transition cost.  

### Prerequisite
- MATLAB
- Link to *Compass* [yh/neighbors](https://github.com/vega/compass/tree/yh/neighbors) branch
- Dependents of *Compass*

### Minimal tutorial

1. Run `lp.js`. (`$ node lp.js`) It will generate `lp.m` and `temp/idMap.json`.
2. Run `lp.m` by MATLAB. It will generate `temp/costs.json`.
3. Run `genRuleSet.js`. (`$ node genRuleSetl.js`) It will generate `ruleSet.json`.
4. Run `calTransSampled.js`(`$ node calTransSempled.js`).
5. Open `sequence.html`.


### Customization
1. You can (or should) edit `lp.js` to match rule to your rationales.
2. You can (or should) edit `js/sampled-specs.js` to run with other *Vega-Lite* visualizations you collected.


---

### Others
1. If you want to generate all kinds of specs and see their distances, run `calTransAll.js` with editing generating options and open `specs.html` and `transition.html`.
2. Or you can use `specs.html` and `transition.html` to see your own visualization samples by copying and pasting `js/get-sampled-specs.js` and `get-sampled-transitionSets.js` to `js/get-specs.js` and `get-transitionSets.js`.
