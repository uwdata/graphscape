# Guide to use *grapecape*

### Purpose
...

### Prerequisite

- MATLAB

### Minimal Tutorial
...


### Development

```console
// Generating Transition Rules
$ cd src/rule
$ node lp.js
$ matlab < lp.m
$ node gen_ruleSet.js

// Test and Build graphscape
$ cd
$ npm run test
$ npm run build
```

To use a newly built `graphscape.js`, you should copy the new `graphscape.js` and past on `app/js`.

### Customizing Rule


