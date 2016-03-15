# Guide to use *GrapeScape*
(last updated 2016-03-14)


### Purpose
Sorting *Vega-Lite* visualizations to have the smallest transition cost.  

### Prerequisite

- MATLAB

### Minimal tutorial

```console
// Generating Transition Rule
$ cd src/rule
$ node lp.js
$ matlab < lp.m
$ node gen_ruleSet.js

// Apply the rule to serialize sampled visualizations
$ cd ../sequence
$ node cal_transSampled.js

// And open sequence.html
```

### Customizing
1. You can (or should) edit `lp.js` to match rule with your rationales.
2. You can (or should) edit `data/sampled_specs.json` to run with other *Vega-Lite* visualizations you collected. Default specs are sampled by Younghoon with *Polestar*.


---

### Miscellaneous
1. If you want to generate all kinds of specs and see their distances, run `cal_transAll.js` with editing generating options and open `specs.html` and `transitions.html`. (It require you to link bower module. see *To Develop* )
2. `sequence.html` and `transitions_sampled.html` are using BEA with an option fixing a starting spec as an empty point visualization.


---

### To Develop

- Link to *Compass* [yh/neighbors](https://github.com/vega/compass/tree/yh/neighbors) branch.
