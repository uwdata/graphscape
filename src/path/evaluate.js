const RULES = require("./evaluateRules").HEURISTIC_RULES
const {copy, intersection} = require("../util");

function evaluate(editOpPartition) {
  let satisfiedRules = findRules(editOpPartition, RULES);
  let score = satisfiedRules.reduce((score, rule) => {
    return score + rule.score
  }, 0)
  return {score, satisfiedRules}
}
exports.evaluate = evaluate;

function findRules(editOpPartition, rules = RULES) {
  return rules.filter(_rule => {
    let rule = copy(_rule);
    for (let j = 0; j < rule.editOps.length; j++) {
      const ruleEditOp = rule.editOps[j];
      rule[ruleEditOp] = [];

      for (let i = 0; i < editOpPartition.length; i++) {
        const editOpPart = editOpPartition[i];
        let newFoundEditOps = findEditOps(editOpPart, ruleEditOp)

        if (newFoundEditOps.length > 0) {
          rule[ruleEditOp] = [
            ...rule[ruleEditOp],
            ...newFoundEditOps.map(eo => {
              return {...eo, position: i}
            })
          ];
        }
      }

      if (rule[ruleEditOp].length === 0) {
        return false; // when there is no corresponding edit op for the rule in given editOp partition.
      }
    }

    if (rule.type === "A-With-B"){
      let foundEditOps = rule.editOps.map(eo => rule[eo]);

      if (foundEditOps.filter(eo => !eo).length !== 0) {
        return false;
      }
      let positions = rule.editOps.reduce((positions, eo, i) => {
        let currPositions = rule[eo].map(d => d.position);
        if (i === 0){
          return currPositions
        }
        return intersection(positions, currPositions)
      }, [])



      if (positions.length === 0) {
        return false
      } else if (_rule.condition) {
        let mappedFoundEditOps = rule.editOps.reduce((acc, eo) => {
          acc[eo] = rule[eo]
          return acc;
        }, {});

        return _rule.condition(mappedFoundEditOps);
      }
      return true;

    } else {
      for (let i = 0; i < rule[rule.editOps[0]].length; i++) {
        const followed = rule[rule.editOps[0]][i];
        for (let j = 0; j < rule[rule.editOps[1]].length; j++) {
          const following = rule[rule.editOps[1]][j];
          if (followed.position >= following.position) {
            return false
          }

          if (_rule.condition && !_rule.condition(followed, following)) {
            return false;
          }
        }
      }
      return true;
    }

  });
}
exports.findRules = findRules;

function findEditOps(editOps, query) {
  return editOps.filter(eo => {
    if (query === "TRANSFORM") {
      return eo.type === "transform"
    } else if (query === "ENCODING") {
      return eo.type === "encoding"
    } else if (query === "MARK") {
      return eo.type === "mark"
    } else if (query === "ENCODING.MODIFY") {
      return eo.type === "encoding" && eo.name.indexOf("MODIFY") >= 0
    }
    return (eo.name.indexOf(query) >= 0)
  })
}