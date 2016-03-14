# Guide to use *GrapeScape*
(last updated 2016-03-13)


### Purpose
Sorting *Vega-Lite* visualizations to have the smallest transition cost.  

### Prerequisite

- MATLAB

### Minimal tutorial

```
$ node lp.js
$ matlab < lp.m
$ node gen_ruleSet.js
$ node cal_transSampled.js
```

1. Run `lp.js`. It will generate `lp.m` and `temp/idMap.json`.
2. Run `lp.m` by MATLAB. It will generate `temp/costs.json`.
3. Run `gen_ruleSet.js`. It will generate `ruleSet.json`.
4. Run `cal_transSampled.js`. It will generate `js/get_sampled_specs.js` and `js/get_sampled_transitionSets.js`.
5. Open `sequence.html` to see how visualizations sorted. or Open `transitions_sampled.html` to see how they clustered by Bond Energy Algorithm.

### Customizing
1. You can (or should) edit `lp.js` to match rule to your rationales.
2. You can (or should) edit `js/sampled_specs.json` to run with other *Vega-Lite* visualizations you collected. Default specs are sampled by Younghoon with *Polestar*.


---

### Miscellaneous
1. If you want to generate all kinds of specs and see their distances, run `cal_transAll.js` with editing generating options and open `specs.html` and `transitions.html`.
2. `sequence.html` and `transitions_sampled.html` are using BEA with an option fixing a starting spec as an empty point visualization.


---

### To develop

- Link to *Compass* [yh/neighbors](https://github.com/vega/compass/tree/yh/neighbors) branch.
