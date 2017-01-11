# GraphScape

A directed graph model of the visualization design space that supports automated reasoning about visualization similarity and sequencing.


## Main API

The main method is `graphscape.sequence.serialize`, in `src/seqeunce/serialize.js`.

#### Input

| Parameter  | Type          | Description    |
| :-------- |:-------------:| :------------- |
| charts | Array | An array of [Vega-Lite](https://vega.github.io/vega-lite/) charts. |
| options | Object | `{ "fixFirst" : true/false }` <br> fixFirst :  whether first chart should be at first(`true`) or not(`false`). <br> (Currently, there is only `"fixFirst"` in the options.) |
| ruleSet | Object | (*Optional*) Specifying a rule to calculate sequence costs |
| callback | Function | (*Optional*) `function(result){ ... }` <br> A function that called after it results. |


#### Output

Output is an array where each item corresponds to a possible sequence of given charts. 

| Property  | Type          | Description    |
| :-------- |:-------------:| :------------- |
| charts | Array | Given charts as an input. <br> If `options.fixFirst` was `false`, *null specification* is placed at first. |
| sequence | Array | Order of indexes of input charts.   |
| transitions | Array | Transitions between each pair of two adjacent charts.<br> Each transition is consist of `id`, `marktype`, `transform`, `encoding`, and `cost` properties. <br> `id` : Transition identifier.<br> `marktype` : Edit operations in *mark* category.<br> `transform` : Edit operations in *transform* category.<br> `encoding` : Edit operations in *encoding* category.<br> `cost` : Sum of all costs of edit operations in this transition. | 
| sequenceCost | Number| Final GraphScape sequence cost. |
| sumOfTransitionCosts | Number | Sum of transition costs. |
| patterns | Array | Observed patterns of the sequence. <br> Each pattern is consist of `pattern`, `appear`, `coverage`, and `patternScore`. <br> `pattern` : An array of transition `id`s composing the pattern.<br> `appear` : An array of indexes of `transitions` where the pattern appears in the sequence. <br>`coverage` : How much the pattern cover the sequence.<br>`patternScore` : Final pattern score, which is the same as coverage now. |
| globalWeightingTerm | Number | Global weighting term. |
| filterSequenceCost | Number | Filter sequence cost. |
| filterSequenceCostReasons | Array | Sum of filter value change score <br> Increment of value : +1 <br> Decrement of value : -1 <br> Otherwise : 0|


#### Sample Code

```js
var gs = require('./graphscape.js')
var charts = []; // an array of Vega-Lite charts
charts.push({
  "data": {"url": "data/cars.json"},
  "mark": "point",
  "encoding": {
    "x": {"field": "Horsepower","type": "quantitative"},
  }
});
charts.push({
  "data": {"url": "data/cars.json"},
  "mark": "point",
  "encoding": {
    "x": {"field": "Horsepower","type": "quantitative"},
    "y": {"field": "Miles_per_Gallon","type": "quantitative"}
  }
});
var options = { "fixFirst": false };
console.log(gs.sequence.serialize(charts, options));
```


## Development Instruction
1) MATLAB is required to solve `lp.m`

2) You can install npm dependencies with:

```console
$ npm install
```

3) You can customize rankings of edit operations by modifying `lp.js` and use yours by :

```console
$ cd src/rule
$ node lp.js
$ matlab < lp.m
$ node gen_ruleSet.js //It will generate ruleSet.js.

// After creating your ranking, you should re-build `graphscape.js` to apply yours.

$ cd
$ npm run test
$ npm run build
```

### Application : Sequence Recommender
`app/`  contains *sequence recommender* which is a web app that recommends a sequence of input [Vega-Lite](https://vega.github.io/vega-lite/) visualization specifications. To run this app, first you should install bower components with :
```console
$ cd app
$ bower install
```
Then, you can run `python -m SimpleHTTPServer 9000` and access this from http://localhost:9000/.

```console
$ python -m SimpleHTTPServer 9000
```

*To apply a newly built `graphscape.js`, you should copy the new `graphscape.js` and paste on `app/js`.
