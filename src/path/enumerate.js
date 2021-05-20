
// import {default as vl2vg4gemini} from "../../util/vl2vg4gemini"
const vl = require("vega-lite");
const vega = require("vega");
const { copy, deepEqual, partition, permutate, union, intersection} = require("../util");
const apply = require("../transition/apply").apply;

// Take two vega-lite specs and enumerate paths [{sequence, editOpPartition (aka transition)}]:
async function enumerate(sVLSpec, eVLSpec, editOps, transM, withExcluded = false) {
  if (editOps.length < transM) {
    throw new CannotEnumStagesMoreThanTransitions(editOps.length, transM)
  }

  const editOpPartitions = partition(editOps, transM)

  const orderedEditOpPartitions = editOpPartitions.reduce((ordered, pt) => {
    return ordered.concat(permutate(pt));
  }, [])
  const sequences = [];

  let excludedPaths = [];

  for (const editOpPartition of orderedEditOpPartitions) {
    let sequence = [copy(sVLSpec)];
    let currSpec = copy(sVLSpec);
    let valid = true;
    for (let i = 0; i < editOpPartition.length; i++) {
      const editOps = editOpPartition[i];
      if (i===(editOpPartition.length - 1)) {
        sequence.push(eVLSpec);
        break; // The last spec should be the same as eVLSpec;
      }

      try {
        currSpec = apply(copy(currSpec), eVLSpec, editOps);
      } catch(e) {
        if (["UnapplicableEditOPError", "InvalidVLSpecError", "UnapplicableEditOpsError"].indexOf(e.name) < 0) {
          throw e;
        } else {
          valid = false;
          excludedPaths.push({info: e, editOpPartition, invalidSpec: currSpec})
          break;
        }
      }

      sequence.push(copy(currSpec));
    }

    const mergedScaleDomain = await getMergedScale(sequence);

    sequence = sequence.map((currSpec, i) => {
      if (i===0 || i===sequence.length-1) {
        return currSpec
      }
      return applyMergedScale(currSpec, mergedScaleDomain, editOpPartition[i-1])
    })

    if (valid && validate(sequence)) {
      sequences.push({sequence, editOpPartition});
    }
  }
  if (withExcluded) {
    return {sequences, excludedPaths}
  }

  return sequences
}
exports.enumerate = enumerate;


function applyMergedScale(vlSpec, mergedScaleDomain, currEditOps) {
  let currSpec = copy(vlSpec);
  let sortEditOp = currEditOps.find(eo => eo.name === "SORT");

  for (const channel in mergedScaleDomain) {
    // When sort editOps are applied, do not change the corresponding scale domain.
    if (sortEditOp && sortEditOp.detail.find(dt => dt.channel === channel)) {
      continue;
    };

    if (mergedScaleDomain.hasOwnProperty(channel)) {

      if (currSpec.encoding[channel]) {
        if (!currSpec.encoding[channel].scale) {
          currSpec.encoding[channel].scale = {};
        }
        currSpec.encoding[channel].scale.domain = mergedScaleDomain[channel];
        if (currSpec.encoding[channel].scale.zero !== undefined) {

          delete currSpec.encoding[channel].scale.zero
        }
      }
    }
  }
  return currSpec
}

// Get the scales including all data points while doing transitions.
async function getMergedScale(sequence) {

  const views = await Promise.all(sequence.map(vlSpec => {
    return new vega.View(vega.parse(vl.compile(vlSpec).spec), {renderer: "svg"}).runAsync()
  }))

  let commonEncoding = sequence.reduce((commonEncoding, vlSpec, i) => {
    let encoding = Object.keys(vlSpec.encoding).map(channel => {
      return {
        channel,
        ...vlSpec.encoding[channel],
        runtimeScale: views[i]._runtime.scales[channel]
      };
    });
    if (i===0){
      return encoding;
    }
    return intersection(encoding, commonEncoding, ch => {
      return [ch.channel, ch.field||"", ch.type||"", ch.runtimeScale ? ch.runtimeScale.type : ""].join("_");
    })
  }, []).map(encoding => {
    return {
      ...encoding,
      domains: views.map(view => {
        return view._runtime.scales[encoding.channel] ? view._runtime.scales[encoding.channel].value.domain() : undefined
      })
    }
  })

  commonEncoding = commonEncoding.filter(encoding => {
    //if all the domains are the same, then don't need to merge
    return !encoding.domains
      .filter(d => d)
      .reduce((accDomain, domain) => {
      if (deepEqual(domain, accDomain)) {
        return domain;
      }
      return undefined;
    }, encoding.domains[0])
  })

  return commonEncoding.reduce((mergedScaleDomains, encoding) => {
    if (!encoding.runtimeScale) {
      return mergedScaleDomains;
    }
    const vlType = encoding.type,
      domains = encoding.domains;

    if (vlType === "quantitative") {
      mergedScaleDomains[encoding.channel] = [
        Math.min(...domains.map(domain => domain[0])),
        Math.max(...domains.map(domain => domain[1]))
      ]
    } else if (vlType === "nominal" || vlType === "ordinal") {
      mergedScaleDomains[encoding.channel] = domains.reduce((merged, domain) => {
        return union(merged, domain)
      }, [])
    } else if (vlType==="temporal") {
      mergedScaleDomains[encoding.channel] = [
        Math.min(...domains.map(domain => domain[0])),
        Math.max(...domains.map(domain => domain[1]))
      ]
    }

    return mergedScaleDomains;
  }, {})
}
exports.getMergedScale = getMergedScale


function validate(sequence) {
  //Todo: check if the sequence is a valid vega-lite spec.
  let prevChart = sequence[0];
  for (let i = 1; i < sequence.length; i++) {
    const currChart = sequence[i];
    if (deepEqual(prevChart, currChart)) {
      return false;
    }
    prevChart = sequence[i];
  }
  return true;
}
exports.validate = validate


class CannotEnumStagesMoreThanTransitions extends Error {
  constructor(editOpsN, transM) {
    super(`Cannot enumerate ${transM} transitions for ${editOpsN} edit operations. The number of transitions should lesser than the number of possible edit operations.`)
    this.name = "CannotEnumStagesMoreThanTransitions"
  }
}