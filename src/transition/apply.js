const util = require('../util');
const {parsePredicateFilter} = require('./trans');
const {  OPS, LOGIC_OPS } = require('../constants');
function apply (sSpec, eSpec, editOps) {
  return editOps.reduce((resultSpec, editOp) => {
    if (editOp.type === "mark") {
      resultSpec = applyMarkEditOp(resultSpec, eSpec, editOp);
    } else if (editOp.type === "transform") {
      resultSpec = applyTransformEditOp(resultSpec, eSpec, editOp);
    } else if (editOp.type === "encoding") {
      resultSpec = applyEncodingEditOp(resultSpec, eSpec, editOp);
    }
    return resultSpec;
  }, util.duplicate(sSpec))//an intermediate spec by applying edit operations on the sSpec
}
exports.apply = apply

function applyMarkEditOp(targetSpec, eSpec, editOp) {
  let resultSpec = util.duplicate(targetSpec);
  resultSpec.mark = eSpec.mark
  return resultSpec;
}
exports.applyMarkEditOp = applyMarkEditOp;

function applyTransformEditOp(targetSpec, eSpec, editOp){
  let resultSpec = util.duplicate(targetSpec);
  const transformType = editOp.name.toLowerCase();
  const details = !util.isArray(editOp.detail) ? [editOp.detail] : editOp.detail;

  if (transformType.indexOf("filter") >= 0) {
    if (editOp.name === "REMOVE_FILTER" || editOp.name === "MODIFY_FILTER") {

      resultSpec.transform.filter(tfm => {
        return tfm.filter && ((parsePredicateFilter(tfm.filter)[0].id === editOp.detail.id))
      }).forEach(filter => {
        if (resultSpec.transform) {

          let i = resultSpec.transform.findIndex(trsfm => util.deepEqual(trsfm, filter))

          resultSpec.transform.splice(i, 1);
        }
      })
    }
    if (editOp.name === "ADD_FILTER" || editOp.name === "MODIFY_FILTER") {
      eSpec.transform.filter(tfm => {
        return tfm.filter && ((parsePredicateFilter(tfm.filter)[0].id === editOp.detail.id))
      }).forEach(filter => {
        if (!resultSpec.transform) {
          resultSpec.transform = [filter];
        } else if (!resultSpec.transform.find(trsfm => util.deepEqual(filter, trsfm))) {
          resultSpec.transform.push(filter);
        }
      })
    }
  } else {
    details.forEach(detail => {
      if (resultSpec.encoding[detail.channel]) {
        if (detail.how === "removed"){
          delete resultSpec.encoding[detail.channel][transformType]
        } else {
          resultSpec.encoding[detail.channel][transformType] = eSpec.encoding[detail.channel][transformType]
        }
      } else {
        throw new UnapplicableEditOPError(`Cannot apply ${editOp.name} since there is no "${detail.channel}" channel.`)
      }
    })

  }
  return resultSpec;
}
exports.applyTransformEditOp = applyTransformEditOp;


function applyEncodingEditOp(targetSpec, eSpec, editOp){
  let resultSpec = util.duplicate(targetSpec);
  if (editOp.name.indexOf("REMOVE") === 0) {
    let channel = editOp.detail.before.channel;
    if (resultSpec.encoding[channel]) {
      delete resultSpec.encoding[channel];
    } else {
      throw new UnapplicableEditOPError(`Cannot apply ${editOp.name} since there is no "${channel}" channel.`);
    }
  } else if (editOp.name.indexOf("ADD") === 0) {
    let channel = editOp.detail.after.channel;
    if (resultSpec.encoding[channel]) {
      throw new UnapplicableEditOPError(`Cannot apply ${editOp.name} since "${channel}" already exists.`);
    } else {
      resultSpec.encoding[channel] = util.duplicate(eSpec.encoding[channel]);
    }
  } else if (editOp.name.indexOf("MOVE") === 0) {
    let sChannel = editOp.detail.before.channel,
      dChannel = editOp.detail.after.channel;
    if (!resultSpec.encoding[sChannel]) {
      throw new UnapplicableEditOPError(`Cannot apply ${editOp.name} since there is no "${sChannel}" channel.`);
    } else if (resultSpec.encoding[dChannel]) {
      throw new UnapplicableEditOPError(`Cannot apply ${editOp.name} since "${dChannel}" already exists.`);
    } else {
      resultSpec.encoding[dChannel] = util.duplicate(resultSpec.encoding[sChannel])
      delete resultSpec.encoding[sChannel];
    }
  } else if (editOp.name.indexOf("MODIFY") === 0) {
    let channel = editOp.detail.before.channel,
      field = editOp.detail.after.field,
      type = editOp.detail.after.type;
    if (!resultSpec.encoding[channel]) {
      throw new UnapplicableEditOPError(`Cannot apply ${editOp.name} since there is no "${channel}" channel.`);
    } else {
      resultSpec.encoding[channel].field = field;
      resultSpec.encoding[channel].type = type;
    }
  } else if (editOp.name.indexOf("SWAP_X_Y") === 0) {
    if (!resultSpec.encoding.x || !resultSpec.encoding.y) {
      throw new UnapplicableEditOPError(`Cannot apply ${editOp.name} since there is no "x" and "y" channels.`);
    } else {
      let temp = util.duplicate(resultSpec.encoding.y);
      resultSpec.encoding.y = util.duplicate(resultSpec.encoding.x);
      resultSpec.encoding.x = temp;
    }
  }

  return resultSpec;
}
exports.applyEncodingEditOp = applyEncodingEditOp;

class UnapplicableEditOPError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnapplicableEditOPError"
  }
}