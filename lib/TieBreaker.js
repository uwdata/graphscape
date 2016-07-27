'use strict'
//Longest Repeated Pattern


function TieBreaker(result) {
	var TBScore = 0;
	var reasons = {};
  //rule#1 FILTER_MODIFY, same field, same op, ascending numeric values > descending
  result.transitionSet.forEach(function(transitions){
  	// console.log('--');
  	transitions.transform.forEach(function(transformTr){
  		// console.log(transformTr.name);
  		if (transformTr.name === "MODIFY_FILTER" && !!transformTr.detail && !transformTr.detail.op && !!transformTr.detail.value ) {
  			let values = transformTr.detail.value.split(', ').map(function(v){ return Number(v)}); 
  			if ( !isNaN(values[0]) && !isNaN(values[1]) && values[0] < values[1]) {
  				TBScore += 1;
  				if (!reasons["FILTER_MODIFY with ascending numeric values"]) {
  					reasons["FILTER_MODIFY with ascending numeric values"] = 1;
  				} else {
  					reasons["FILTER_MODIFY with ascending numeric values"] += 1;	
  				}				
  			}
  		}
  		
  	})
  })
  return { 'tiebreakScore' : TBScore, 'reasons': reasons };
}


// var result = {"sequence":[0,6,2,3,4,5,1],"transitionSet":[{"marktype":[],"transform":[{"name":"SCALE","cost":0.6,"details":[{"type":"added","channel":"x"},{"type":"added","channel":"y"},{"type":"added","channel":"size"}]},{"name":"BIN","cost":0.62,"details":[{"type":"added","channel":"x"},null]},{"name":"AGGREGATE","cost":0.63,"details":[{"type":"added","channel":"y"},{"type":"added","channel":"size"}]},{"name":"ADD_FILTER","cost":0.65,"detail":{"field":"Year","op":"===","value":"1976"}},{"name":"ADD_FILTER","cost":0.65,"detail":{"field":"Origin","op":"!==","value":"'Japan'"}}],"encoding":[{"name":"ADD_SIZE_COUNT","cost":4.52},{"name":"ADD_X","cost":4.59},{"name":"ADD_Y","cost":4.59}],"cost":16.85,"id":6,"start":0,"destination":6,"rank":5},{"marktype":[],"transform":[{"name":"MODIFY_FILTER","cost":0.64,"detail":{"value":"1976, 1980"}},{"name":"ADD_FILTER","cost":0.65,"detail":{"field":"Origin","op":"===","value":"'USA'"}}],"encoding":[],"cost":1.29,"id":31,"start":6,"destination":2,"rank":4},{"marktype":[],"transform":[{"name":"MODIFY_FILTER","cost":0.64,"detail":{"value":"'USA', 'Europe'"}}],"encoding":[],"cost":0.64,"id":15,"start":2,"destination":3,"rank":1},{"marktype":[],"transform":[{"name":"MODIFY_FILTER","cost":0.64,"detail":{"value":"1980, 1976"}},{"name":"MODIFY_FILTER","cost":0.64,"detail":{"value":"'Europe', 'USA'"}}],"encoding":[],"cost":1.28,"id":21,"start":3,"destination":4,"rank":3},{"marktype":[],"transform":[{"name":"MODIFY_FILTER","cost":0.64,"detail":{"value":"'USA', 'Europe'"}}],"encoding":[],"cost":0.64,"id":15,"start":4,"destination":5,"rank":1},{"marktype":[],"transform":[{"name":"MODIFY_FILTER","cost":0.64,"detail":{"value":"1976, 1980"}},{"name":"REMOVE_FILTER","cost":0.65,"detail":{"field":"Origin","op":"===","value":"'Europe'"}}],"encoding":[],"cost":1.29,"id":28,"start":5,"destination":1,"rank":4}],"distance":21.99,"patternScore":0.3333333333333333,"specs":[{"mark":"point","encoding":{},"distance":0,"prev":[]},{"description":"Cars in 1976","data":{"url":"/data/cars.json"},"transform":{"filter":" datum.Year === 1976 && (datum.Origin !== 'Japan')"},"mark":"point","encoding":{"x":{"field":"Horsepower","type":"quantitative","bin":true,"scale":{"domain":[0,240]},"axis":{"title":"Horsepower"}},"y":{"field":"Weight_in_lbs","type":"quantitative","aggregate":"mean","scale":{"domain":[0,5000]},"axis":{"title":"Avg. Weight (lbs)"}},"size":{"field":"*","type":"quantitative","aggregate":"count","scale":{"domain":[0,15]},"legend":{"title":"# of Cars"}}},"distance":0,"prev":[]},{"description":"USA cars in 1980","data":{"url":"/data/cars.json"},"transform":{"filter":" datum.Year === 1980 && datum.Origin === 'USA' && (datum.Origin !== 'Japan')"},"mark":"point","encoding":{"x":{"field":"Horsepower","type":"quantitative","bin":true,"scale":{"domain":[0,240]},"axis":{"title":"Horsepower"}},"y":{"field":"Weight_in_lbs","type":"quantitative","aggregate":"mean","scale":{"domain":[0,5000]},"axis":{"title":"Avg. Weight (lbs)"}},"size":{"field":"*","type":"quantitative","aggregate":"count","scale":{"domain":[0,15]},"legend":{"title":"# of Cars"}}},"distance":0,"prev":[]},{"description":"European cars in 1980","data":{"url":"/data/cars.json"},"transform":{"filter":" datum.Year === 1980 && datum.Origin === 'Europe' && (datum.Origin !== 'Japan')"},"mark":"point","encoding":{"x":{"field":"Horsepower","type":"quantitative","bin":true,"scale":{"domain":[0,240]},"axis":{"title":"Horsepower"}},"y":{"field":"Weight_in_lbs","type":"quantitative","aggregate":"mean","scale":{"domain":[0,5000]},"axis":{"title":"Avg. Weight (lbs)"}},"size":{"field":"*","type":"quantitative","aggregate":"count","scale":{"domain":[0,15]},"legend":{"title":"# of Cars"}}},"distance":0,"prev":[]},{"description":"USA cars in 1976","data":{"url":"/data/cars.json"},"transform":{"filter":" datum.Year === 1976 && datum.Origin === 'USA' && (datum.Origin !== 'Japan')"},"mark":"point","encoding":{"x":{"field":"Horsepower","type":"quantitative","bin":true,"scale":{"domain":[0,240]},"axis":{"title":"Horsepower"}},"y":{"field":"Weight_in_lbs","type":"quantitative","aggregate":"mean","scale":{"domain":[0,5000]},"axis":{"title":"Avg. Weight (lbs)"}},"size":{"field":"*","type":"quantitative","aggregate":"count","scale":{"domain":[0,15]},"legend":{"title":"# of Cars"}}},"distance":0,"prev":[]},{"description":"European cars in 1976","data":{"url":"/data/cars.json"},"transform":{"filter":" datum.Year === 1976 && datum.Origin === 'Europe' && (datum.Origin !== 'Japan')"},"mark":"point","encoding":{"x":{"field":"Horsepower","type":"quantitative","bin":true,"scale":{"domain":[0,240]},"axis":{"title":"Horsepower"}},"y":{"field":"Weight_in_lbs","type":"quantitative","aggregate":"mean","scale":{"domain":[0,5000]},"axis":{"title":"Avg. Weight (lbs)"}},"size":{"field":"*","type":"quantitative","aggregate":"count","scale":{"domain":[0,15]},"legend":{"title":"# of Cars"}}},"distance":0,"prev":[]},{"description":"Cars in 1980","data":{"url":"/data/cars.json"},"transform":{"filter":" datum.Year === 1980 && (datum.Origin !== 'Japan')"},"mark":"point","encoding":{"x":{"field":"Horsepower","type":"quantitative","bin":true,"scale":{"domain":[0,240]},"axis":{"title":"Horsepower"}},"y":{"field":"Weight_in_lbs","type":"quantitative","aggregate":"mean","scale":{"domain":[0,5000]},"axis":{"title":"Avg. Weight (lbs)"}},"size":{"field":"*","type":"quantitative","aggregate":"count","scale":{"domain":[0,15]},"legend":{"title":"# of Cars"}}},"distance":0,"prev":[]}],"globalScore":0.06820259362187077}
// console.log(TieBreaker(result));

module.exports = {
  TieBreaker: TieBreaker
};
