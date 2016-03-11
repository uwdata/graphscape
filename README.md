# Guide to use *GrapeScape*
(last updated 2016-03-10)


### Purpose
Sorting *Vega-Lite* visualizations to have the smallest transition cost.  

### Prerequisite

- MATLAB

### Minimal tutorial

```
$ node lp.js
$ matlab < lp.m
$ node genRuleSet.js
$ node calTransSempled.js
```

1. Run `lp.js`. It will generate `lp.m` and `temp/idMap.json`.
2. Run `lp.m` by MATLAB. It will generate `temp/costs.json`.
3. Run `gen_ruleSet.js`. It will generate `ruleSet.json`.
4. Run `cal_transitionSets.js`. It will generate `js/get_sampled_specs.js` and `js/get_sampled_transitionSets.js`.
5. Open `sequence.html`.

### Customization
1. You can (or should) edit `lp.js` to match rule to your rationales.
2. You can (or should) edit `js/sampled_specs.js` to run with other *Vega-Lite* visualizations you collected.


---

### Others
1. If you want to generate all kinds of specs and see their distances, run `calTransAll.js` with editing generating options and open `specs.html` and `transition.html`.
2. Or you can use `specs.html` and `transition.html` to see your own visualization samples by copying and pasting `js/get_sampled_specs.js` and `get_sampled_transitionSets.js` to `js/get_specs.js` and `get_transitionSets.js`.

---

### To develop

- Link to *Compass* [yh/neighbors](https://github.com/vega/compass/tree/yh/neighbors) branch.
