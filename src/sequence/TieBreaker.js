function TieBreaker(result, transitionSetsFromEmptyVis) {
	var TBScore = 0;
	var reasons = {};
  //rule#1 FILTER_MODIFY, same field, same op, ascending numeric values > descending
  var continued = { };
  var filterState = {};
  var filterScore = [];
  var filterSequenceCost = 0;
  for (var i = 0; i < result.charts.length; i++) {
    let spec = result.charts[i];
    if (spec.transform ) {
      let filters = spec.transform.filter(trsfm => trsfm.filter).map(trsfm => trsfm.filter);
      for (var j = 0; j < filters.length; j++) {
        let filter = filters[j];
        if ( filter.hasOwnProperty("field") && filter.hasOwnProperty("equal") ) {
          if (filterState[filter.field]) {
            filterState[filter.field].push(filter.equal);
          } else {
            filterState[filter.field] = [filter.equal] ;
            filterScore.push({ "field": filter.field, "score": 0});
          }
        }

      }
    }
  }

  for (var i = 0; i < filterScore.length; i++) {
    for (var j = 1; j < filterState[filterScore[i].field].length; j++) {
      if ( filterState[filterScore[i].field][j-1] < filterState[filterScore[i].field][j] ) {
        filterScore[i].score += 1;
      } else if (filterState[filterScore[i].field][j-1] > filterState[filterScore[i].field][j] ){
        filterScore[i].score -= 1;
      }
    }

    filterSequenceCost += Math.abs(filterScore[i].score + 0.1) / ( filterState[filterScore[i].field].length - 1 + 0.1 );
  }

  filterSequenceCost = filterScore.length > 0 ? 1 - filterSequenceCost / filterScore.length : 0;

  return { 'tiebreakCost' : filterSequenceCost, 'reasons': filterScore };
}



module.exports = {
  TieBreaker: TieBreaker
};
