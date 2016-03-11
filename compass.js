(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cp = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
module.exports = {
   hcluster: require("./hcluster"),
   Kmeans: require("./kmeans"),
   kmeans: require("./kmeans").kmeans
};
},{"./hcluster":4,"./kmeans":5}],3:[function(require,module,exports){
module.exports = {
  euclidean: function(v1, v2) {
      var total = 0;
      for (var i = 0; i < v1.length; i++) {
         total += Math.pow(v2[i] - v1[i], 2);      
      }
      return Math.sqrt(total);
   },
   manhattan: function(v1, v2) {
     var total = 0;
     for (var i = 0; i < v1.length ; i++) {
        total += Math.abs(v2[i] - v1[i]);      
     }
     return total;
   },
   max: function(v1, v2) {
     var max = 0;
     for (var i = 0; i < v1.length; i++) {
        max = Math.max(max , Math.abs(v2[i] - v1[i]));      
     }
     return max;
   }
};
},{}],4:[function(require,module,exports){
var distances = require("./distance");

var HierarchicalClustering = function(distance, linkage, threshold) {
   this.distance = distance;
   this.linkage = linkage;
   this.threshold = threshold == undefined ? Infinity : threshold;
}

HierarchicalClustering.prototype = {
   cluster : function(items, snapshotPeriod, snapshotCb) {
      this.clusters = [];
      this.dists = [];  // distances between each pair of clusters
      this.mins = []; // closest cluster for each cluster
      this.index = []; // keep a hash of all clusters by key
      
      for (var i = 0; i < items.length; i++) {
         var cluster = {
            value: items[i],
            key: i,
            index: i,
            size: 1
         };
         this.clusters[i] = cluster;
         this.index[i] = cluster;
         this.dists[i] = [];
         this.mins[i] = 0;
      }

      for (var i = 0; i < this.clusters.length; i++) {
         for (var j = 0; j <= i; j++) {
            var dist = (i == j) ? Infinity : 
               this.distance(this.clusters[i].value, this.clusters[j].value);
            this.dists[i][j] = dist;
            this.dists[j][i] = dist;

            if (dist < this.dists[i][this.mins[i]]) {
               this.mins[i] = j;               
            }
         }
      }

      var merged = this.mergeClosest();
      var i = 0;
      while (merged) {
        if (snapshotCb && (i++ % snapshotPeriod) == 0) {
           snapshotCb(this.clusters);           
        }
        merged = this.mergeClosest();
      }
    
      this.clusters.forEach(function(cluster) {
        // clean up metadata used for clustering
        delete cluster.key;
        delete cluster.index;
      });

      return this.clusters;
   },
  
   mergeClosest: function() {
      // find two closest clusters from cached mins
      var minKey = 0, min = Infinity;
      for (var i = 0; i < this.clusters.length; i++) {
         var key = this.clusters[i].key,
             dist = this.dists[key][this.mins[key]];
         if (dist < min) {
            minKey = key;
            min = dist;
         }
      }
      if (min >= this.threshold) {
         return false;         
      }

      var c1 = this.index[minKey],
          c2 = this.index[this.mins[minKey]];

      // merge two closest clusters
      var merged = {
         left: c1,
         right: c2,
         key: c1.key,
         size: c1.size + c2.size
      };

      this.clusters[c1.index] = merged;
      this.clusters.splice(c2.index, 1);
      this.index[c1.key] = merged;

      // update distances with new merged cluster
      for (var i = 0; i < this.clusters.length; i++) {
         var ci = this.clusters[i];
         var dist;
         if (c1.key == ci.key) {
            dist = Infinity;            
         }
         else if (this.linkage == "single") {
            dist = this.dists[c1.key][ci.key];
            if (this.dists[c1.key][ci.key] > this.dists[c2.key][ci.key]) {
               dist = this.dists[c2.key][ci.key];
            }
         }
         else if (this.linkage == "complete") {
            dist = this.dists[c1.key][ci.key];
            if (this.dists[c1.key][ci.key] < this.dists[c2.key][ci.key]) {
               dist = this.dists[c2.key][ci.key];              
            }
         }
         else if (this.linkage == "average") {
            dist = (this.dists[c1.key][ci.key] * c1.size
                   + this.dists[c2.key][ci.key] * c2.size) / (c1.size + c2.size);
         }
         else {
            dist = this.distance(ci.value, c1.value);            
         }

         this.dists[c1.key][ci.key] = this.dists[ci.key][c1.key] = dist;
      }

    
      // update cached mins
      for (var i = 0; i < this.clusters.length; i++) {
         var key1 = this.clusters[i].key;        
         if (this.mins[key1] == c1.key || this.mins[key1] == c2.key) {
            var min = key1;
            for (var j = 0; j < this.clusters.length; j++) {
               var key2 = this.clusters[j].key;
               if (this.dists[key1][key2] < this.dists[key1][min]) {
                  min = key2;                  
               }
            }
            this.mins[key1] = min;
         }
         this.clusters[i].index = i;
      }
    
      // clean up metadata used for clustering
      delete c1.key; delete c2.key;
      delete c1.index; delete c2.index;

      return true;
   }
}

var hcluster = function(items, distance, linkage, threshold, snapshot, snapshotCallback) {
   distance = distance || "euclidean";
   linkage = linkage || "average";

   if (typeof distance == "string") {
     distance = distances[distance];
   }
   var clusters = (new HierarchicalClustering(distance, linkage, threshold))
                  .cluster(items, snapshot, snapshotCallback);
      
   if (threshold === undefined) {
      return clusters[0]; // all clustered into one
   }
   return clusters;
}

module.exports = hcluster;

},{"./distance":3}],5:[function(require,module,exports){
var distances = require("./distance");

function KMeans(centroids) {
   this.centroids = centroids || [];
}

KMeans.prototype.randomCentroids = function(points, k) {
   var centroids = points.slice(0); // copy
   centroids.sort(function() {
      return (Math.round(Math.random()) - 0.5);
   });
   return centroids.slice(0, k);
}

KMeans.prototype.classify = function(point, distance) {
   var min = Infinity,
       index = 0;

   distance = distance || "euclidean";
   if (typeof distance == "string") {
      distance = distances[distance];
   }

   for (var i = 0; i < this.centroids.length; i++) {
      var dist = distance(point, this.centroids[i]);
      if (dist < min) {
         min = dist;
         index = i;
      }
   }

   return index;
}

KMeans.prototype.cluster = function(points, k, distance, snapshotPeriod, snapshotCb) {
   k = k || Math.max(2, Math.ceil(Math.sqrt(points.length / 2)));

   distance = distance || "euclidean";
   if (typeof distance == "string") {
      distance = distances[distance];
   }

   this.centroids = this.randomCentroids(points, k);

   var assignment = new Array(points.length);
   var clusters = new Array(k);

   var iterations = 0;
   var movement = true;
   while (movement) {
      // update point-to-centroid assignments
      for (var i = 0; i < points.length; i++) {
         assignment[i] = this.classify(points[i], distance);
      }

      // update location of each centroid
      movement = false;
      for (var j = 0; j < k; j++) {
         var assigned = [];
         for (var i = 0; i < assignment.length; i++) {
            if (assignment[i] == j) {
               assigned.push(points[i]);
            }
         }

         if (!assigned.length) {
            continue;
         }

         var centroid = this.centroids[j];
         var newCentroid = new Array(centroid.length);

         for (var g = 0; g < centroid.length; g++) {
            var sum = 0;
            for (var i = 0; i < assigned.length; i++) {
               sum += assigned[i][g];
            }
            newCentroid[g] = sum / assigned.length;

            if (newCentroid[g] != centroid[g]) {
               movement = true;
            }
         }

         this.centroids[j] = newCentroid;
         clusters[j] = assigned;
      }

      if (snapshotCb && (iterations++ % snapshotPeriod == 0)) {
         snapshotCb(clusters);
      }
   }

   return clusters;
}

KMeans.prototype.toJSON = function() {
   return JSON.stringify(this.centroids);
}

KMeans.prototype.fromJSON = function(json) {
   this.centroids = JSON.parse(json);
   return this;
}

module.exports = KMeans;

module.exports.kmeans = function(vectors, k) {
   return (new KMeans()).cluster(vectors, k);
}
},{"./distance":3}],6:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define('d3-time', ['exports'], factory) :
  factory((global.d3_time = {}));
}(this, function (exports) { 'use strict';

  var t0 = new Date;
  var t1 = new Date;
  function newInterval(floori, offseti, count, field) {

    function interval(date) {
      return floori(date = new Date(+date)), date;
    }

    interval.floor = interval;

    interval.round = function(date) {
      var d0 = new Date(+date),
          d1 = new Date(date - 1);
      floori(d0), floori(d1), offseti(d1, 1);
      return date - d0 < d1 - date ? d0 : d1;
    };

    interval.ceil = function(date) {
      return floori(date = new Date(date - 1)), offseti(date, 1), date;
    };

    interval.offset = function(date, step) {
      return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
    };

    interval.range = function(start, stop, step) {
      var range = [];
      start = new Date(start - 1);
      stop = new Date(+stop);
      step = step == null ? 1 : Math.floor(step);
      if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
      offseti(start, 1), floori(start);
      if (start < stop) range.push(new Date(+start));
      while (offseti(start, step), floori(start), start < stop) range.push(new Date(+start));
      return range;
    };

    interval.filter = function(test) {
      return newInterval(function(date) {
        while (floori(date), !test(date)) date.setTime(date - 1);
      }, function(date, step) {
        while (--step >= 0) while (offseti(date, 1), !test(date));
      });
    };

    if (count) {
      interval.count = function(start, end) {
        t0.setTime(+start), t1.setTime(+end);
        floori(t0), floori(t1);
        return Math.floor(count(t0, t1));
      };

      interval.every = function(step) {
        step = Math.floor(step);
        return !isFinite(step) || !(step > 0) ? null
            : !(step > 1) ? interval
            : interval.filter(field
                ? function(d) { return field(d) % step === 0; }
                : function(d) { return interval.count(0, d) % step === 0; });
      };
    }

    return interval;
  };

  var millisecond = newInterval(function() {
    // noop
  }, function(date, step) {
    date.setTime(+date + step);
  }, function(start, end) {
    return end - start;
  });

  // An optimized implementation for this simple case.
  millisecond.every = function(k) {
    k = Math.floor(k);
    if (!isFinite(k) || !(k > 0)) return null;
    if (!(k > 1)) return millisecond;
    return newInterval(function(date) {
      date.setTime(Math.floor(date / k) * k);
    }, function(date, step) {
      date.setTime(+date + step * k);
    }, function(start, end) {
      return (end - start) / k;
    });
  };

  var second = newInterval(function(date) {
    date.setMilliseconds(0);
  }, function(date, step) {
    date.setTime(+date + step * 1e3);
  }, function(start, end) {
    return (end - start) / 1e3;
  }, function(date) {
    return date.getSeconds();
  });

  var minute = newInterval(function(date) {
    date.setSeconds(0, 0);
  }, function(date, step) {
    date.setTime(+date + step * 6e4);
  }, function(start, end) {
    return (end - start) / 6e4;
  }, function(date) {
    return date.getMinutes();
  });

  var hour = newInterval(function(date) {
    date.setMinutes(0, 0, 0);
  }, function(date, step) {
    date.setTime(+date + step * 36e5);
  }, function(start, end) {
    return (end - start) / 36e5;
  }, function(date) {
    return date.getHours();
  });

  var day = newInterval(function(date) {
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setDate(date.getDate() + step);
  }, function(start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * 6e4) / 864e5;
  }, function(date) {
    return date.getDate() - 1;
  });

  function weekday(i) {
    return newInterval(function(date) {
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    }, function(date, step) {
      date.setDate(date.getDate() + step * 7);
    }, function(start, end) {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * 6e4) / 6048e5;
    });
  }

  var sunday = weekday(0);
  var monday = weekday(1);
  var tuesday = weekday(2);
  var wednesday = weekday(3);
  var thursday = weekday(4);
  var friday = weekday(5);
  var saturday = weekday(6);

  var month = newInterval(function(date) {
    date.setHours(0, 0, 0, 0);
    date.setDate(1);
  }, function(date, step) {
    date.setMonth(date.getMonth() + step);
  }, function(start, end) {
    return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
  }, function(date) {
    return date.getMonth();
  });

  var year = newInterval(function(date) {
    date.setHours(0, 0, 0, 0);
    date.setMonth(0, 1);
  }, function(date, step) {
    date.setFullYear(date.getFullYear() + step);
  }, function(start, end) {
    return end.getFullYear() - start.getFullYear();
  }, function(date) {
    return date.getFullYear();
  });

  var utcSecond = newInterval(function(date) {
    date.setUTCMilliseconds(0);
  }, function(date, step) {
    date.setTime(+date + step * 1e3);
  }, function(start, end) {
    return (end - start) / 1e3;
  }, function(date) {
    return date.getUTCSeconds();
  });

  var utcMinute = newInterval(function(date) {
    date.setUTCSeconds(0, 0);
  }, function(date, step) {
    date.setTime(+date + step * 6e4);
  }, function(start, end) {
    return (end - start) / 6e4;
  }, function(date) {
    return date.getUTCMinutes();
  });

  var utcHour = newInterval(function(date) {
    date.setUTCMinutes(0, 0, 0);
  }, function(date, step) {
    date.setTime(+date + step * 36e5);
  }, function(start, end) {
    return (end - start) / 36e5;
  }, function(date) {
    return date.getUTCHours();
  });

  var utcDay = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step);
  }, function(start, end) {
    return (end - start) / 864e5;
  }, function(date) {
    return date.getUTCDate() - 1;
  });

  function utcWeekday(i) {
    return newInterval(function(date) {
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    }, function(date, step) {
      date.setUTCDate(date.getUTCDate() + step * 7);
    }, function(start, end) {
      return (end - start) / 6048e5;
    });
  }

  var utcSunday = utcWeekday(0);
  var utcMonday = utcWeekday(1);
  var utcTuesday = utcWeekday(2);
  var utcWednesday = utcWeekday(3);
  var utcThursday = utcWeekday(4);
  var utcFriday = utcWeekday(5);
  var utcSaturday = utcWeekday(6);

  var utcMonth = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(1);
  }, function(date, step) {
    date.setUTCMonth(date.getUTCMonth() + step);
  }, function(start, end) {
    return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
  }, function(date) {
    return date.getUTCMonth();
  });

  var utcYear = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCMonth(0, 1);
  }, function(date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  }, function(start, end) {
    return end.getUTCFullYear() - start.getUTCFullYear();
  }, function(date) {
    return date.getUTCFullYear();
  });

  var milliseconds = millisecond.range;
  var seconds = second.range;
  var minutes = minute.range;
  var hours = hour.range;
  var days = day.range;
  var sundays = sunday.range;
  var mondays = monday.range;
  var tuesdays = tuesday.range;
  var wednesdays = wednesday.range;
  var thursdays = thursday.range;
  var fridays = friday.range;
  var saturdays = saturday.range;
  var weeks = sunday.range;
  var months = month.range;
  var years = year.range;

  var utcMillisecond = millisecond;
  var utcMilliseconds = milliseconds;
  var utcSeconds = utcSecond.range;
  var utcMinutes = utcMinute.range;
  var utcHours = utcHour.range;
  var utcDays = utcDay.range;
  var utcSundays = utcSunday.range;
  var utcMondays = utcMonday.range;
  var utcTuesdays = utcTuesday.range;
  var utcWednesdays = utcWednesday.range;
  var utcThursdays = utcThursday.range;
  var utcFridays = utcFriday.range;
  var utcSaturdays = utcSaturday.range;
  var utcWeeks = utcSunday.range;
  var utcMonths = utcMonth.range;
  var utcYears = utcYear.range;

  var version = "0.1.1";

  exports.version = version;
  exports.milliseconds = milliseconds;
  exports.seconds = seconds;
  exports.minutes = minutes;
  exports.hours = hours;
  exports.days = days;
  exports.sundays = sundays;
  exports.mondays = mondays;
  exports.tuesdays = tuesdays;
  exports.wednesdays = wednesdays;
  exports.thursdays = thursdays;
  exports.fridays = fridays;
  exports.saturdays = saturdays;
  exports.weeks = weeks;
  exports.months = months;
  exports.years = years;
  exports.utcMillisecond = utcMillisecond;
  exports.utcMilliseconds = utcMilliseconds;
  exports.utcSeconds = utcSeconds;
  exports.utcMinutes = utcMinutes;
  exports.utcHours = utcHours;
  exports.utcDays = utcDays;
  exports.utcSundays = utcSundays;
  exports.utcMondays = utcMondays;
  exports.utcTuesdays = utcTuesdays;
  exports.utcWednesdays = utcWednesdays;
  exports.utcThursdays = utcThursdays;
  exports.utcFridays = utcFridays;
  exports.utcSaturdays = utcSaturdays;
  exports.utcWeeks = utcWeeks;
  exports.utcMonths = utcMonths;
  exports.utcYears = utcYears;
  exports.millisecond = millisecond;
  exports.second = second;
  exports.minute = minute;
  exports.hour = hour;
  exports.day = day;
  exports.sunday = sunday;
  exports.monday = monday;
  exports.tuesday = tuesday;
  exports.wednesday = wednesday;
  exports.thursday = thursday;
  exports.friday = friday;
  exports.saturday = saturday;
  exports.week = sunday;
  exports.month = month;
  exports.year = year;
  exports.utcSecond = utcSecond;
  exports.utcMinute = utcMinute;
  exports.utcHour = utcHour;
  exports.utcDay = utcDay;
  exports.utcSunday = utcSunday;
  exports.utcMonday = utcMonday;
  exports.utcTuesday = utcTuesday;
  exports.utcWednesday = utcWednesday;
  exports.utcThursday = utcThursday;
  exports.utcFriday = utcFriday;
  exports.utcSaturday = utcSaturday;
  exports.utcWeek = utcSunday;
  exports.utcMonth = utcMonth;
  exports.utcYear = utcYear;
  exports.interval = newInterval;

}));
},{}],7:[function(require,module,exports){
var util = require('../util'),
    time = require('../time'),
    EPSILON = 1e-15;

function bins(opt) {
  if (!opt) { throw Error("Missing binning options."); }

  // determine range
  var maxb = opt.maxbins || 15,
      base = opt.base || 10,
      logb = Math.log(base),
      div = opt.div || [5, 2],
      min = opt.min,
      max = opt.max,
      span = max - min,
      step, level, minstep, precision, v, i, eps;

  if (opt.step) {
    // if step size is explicitly given, use that
    step = opt.step;
  } else if (opt.steps) {
    // if provided, limit choice to acceptable step sizes
    step = opt.steps[Math.min(
      opt.steps.length - 1,
      bisect(opt.steps, span/maxb, 0, opt.steps.length)
    )];
  } else {
    // else use span to determine step size
    level = Math.ceil(Math.log(maxb) / logb);
    minstep = opt.minstep || 0;
    step = Math.max(
      minstep,
      Math.pow(base, Math.round(Math.log(span) / logb) - level)
    );

    // increase step size if too many bins
    while (Math.ceil(span/step) > maxb) { step *= base; }

    // decrease step size if allowed
    for (i=0; i<div.length; ++i) {
      v = step / div[i];
      if (v >= minstep && span / v <= maxb) step = v;
    }
  }

  // update precision, min and max
  v = Math.log(step);
  precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
  eps = Math.pow(base, -precision - 1);
  min = Math.min(min, Math.floor(min / step + eps) * step);
  max = Math.ceil(max / step) * step;

  return {
    start: min,
    stop:  max,
    step:  step,
    unit:  {precision: precision},
    value: value,
    index: index
  };
}

function bisect(a, x, lo, hi) {
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (util.cmp(a[mid], x) < 0) { lo = mid + 1; }
    else { hi = mid; }
  }
  return lo;
}

function value(v) {
  return this.step * Math.floor(v / this.step + EPSILON);
}

function index(v) {
  return Math.floor((v - this.start) / this.step + EPSILON);
}

function date_value(v) {
  return this.unit.date(value.call(this, v));
}

function date_index(v) {
  return index.call(this, this.unit.unit(v));
}

bins.date = function(opt) {
  if (!opt) { throw Error("Missing date binning options."); }

  // find time step, then bin
  var units = opt.utc ? time.utc : time,
      dmin = opt.min,
      dmax = opt.max,
      maxb = opt.maxbins || 20,
      minb = opt.minbins || 4,
      span = (+dmax) - (+dmin),
      unit = opt.unit ? units[opt.unit] : units.find(span, minb, maxb),
      spec = bins({
        min:     unit.min != null ? unit.min : unit.unit(dmin),
        max:     unit.max != null ? unit.max : unit.unit(dmax),
        maxbins: maxb,
        minstep: unit.minstep,
        steps:   unit.step
      });

  spec.unit = unit;
  spec.index = date_index;
  if (!opt.raw) spec.value = date_value;
  return spec;
};

module.exports = bins;

},{"../time":9,"../util":10}],8:[function(require,module,exports){
var util = require('./util'),
    gen = module.exports;

gen.repeat = function(val, n) {
  var a = Array(n), i;
  for (i=0; i<n; ++i) a[i] = val;
  return a;
};

gen.zeros = function(n) {
  return gen.repeat(0, n);
};

gen.range = function(start, stop, step) {
  if (arguments.length < 3) {
    step = 1;
    if (arguments.length < 2) {
      stop = start;
      start = 0;
    }
  }
  if ((stop - start) / step == Infinity) throw new Error('Infinite range');
  var range = [], i = -1, j;
  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j);
  else while ((j = start + step * ++i) < stop) range.push(j);
  return range;
};

gen.random = {};

gen.random.uniform = function(min, max) {
  if (max === undefined) {
    max = min === undefined ? 1 : min;
    min = 0;
  }
  var d = max - min;
  var f = function() {
    return min + d * Math.random();
  };
  f.samples = function(n) {
    return gen.zeros(n).map(f);
  };
  f.pdf = function(x) {
    return (x >= min && x <= max) ? 1/d : 0;
  };
  f.cdf = function(x) {
    return x < min ? 0 : x > max ? 1 : (x - min) / d;
  };
  f.icdf = function(p) {
    return (p >= 0 && p <= 1) ? min + p*d : NaN;
  };
  return f;
};

gen.random.integer = function(a, b) {
  if (b === undefined) {
    b = a;
    a = 0;
  }
  var d = b - a;
  var f = function() {
    return a + Math.floor(d * Math.random());
  };
  f.samples = function(n) {
    return gen.zeros(n).map(f);
  };
  f.pdf = function(x) {
    return (x === Math.floor(x) && x >= a && x < b) ? 1/d : 0;
  };
  f.cdf = function(x) {
    var v = Math.floor(x);
    return v < a ? 0 : v >= b ? 1 : (v - a + 1) / d;
  };
  f.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a - 1 + Math.floor(p*d) : NaN;
  };
  return f;
};

gen.random.normal = function(mean, stdev) {
  mean = mean || 0;
  stdev = stdev || 1;
  var next;
  var f = function() {
    var x = 0, y = 0, rds, c;
    if (next !== undefined) {
      x = next;
      next = undefined;
      return x;
    }
    do {
      x = Math.random()*2-1;
      y = Math.random()*2-1;
      rds = x*x + y*y;
    } while (rds === 0 || rds > 1);
    c = Math.sqrt(-2*Math.log(rds)/rds); // Box-Muller transform
    next = mean + y*c*stdev;
    return mean + x*c*stdev;
  };
  f.samples = function(n) {
    return gen.zeros(n).map(f);
  };
  f.pdf = function(x) {
    var exp = Math.exp(Math.pow(x-mean, 2) / (-2 * Math.pow(stdev, 2)));
    return (1 / (stdev * Math.sqrt(2*Math.PI))) * exp;
  };
  f.cdf = function(x) {
    // Approximation from West (2009)
    // Better Approximations to Cumulative Normal Functions
    var cd,
        z = (x - mean) / stdev,
        Z = Math.abs(z);
    if (Z > 37) {
      cd = 0;
    } else {
      var sum, exp = Math.exp(-Z*Z/2);
      if (Z < 7.07106781186547) {
        sum = 3.52624965998911e-02 * Z + 0.700383064443688;
        sum = sum * Z + 6.37396220353165;
        sum = sum * Z + 33.912866078383;
        sum = sum * Z + 112.079291497871;
        sum = sum * Z + 221.213596169931;
        sum = sum * Z + 220.206867912376;
        cd = exp * sum;
        sum = 8.83883476483184e-02 * Z + 1.75566716318264;
        sum = sum * Z + 16.064177579207;
        sum = sum * Z + 86.7807322029461;
        sum = sum * Z + 296.564248779674;
        sum = sum * Z + 637.333633378831;
        sum = sum * Z + 793.826512519948;
        sum = sum * Z + 440.413735824752;
        cd = cd / sum;
      } else {
        sum = Z + 0.65;
        sum = Z + 4 / sum;
        sum = Z + 3 / sum;
        sum = Z + 2 / sum;
        sum = Z + 1 / sum;
        cd = exp / sum / 2.506628274631;
      }
    }
    return z > 0 ? 1 - cd : cd;
  };
  f.icdf = function(p) {
    // Approximation of Probit function using inverse error function.
    if (p <= 0 || p >= 1) return NaN;
    var x = 2*p - 1,
        v = (8 * (Math.PI - 3)) / (3 * Math.PI * (4-Math.PI)),
        a = (2 / (Math.PI*v)) + (Math.log(1 - Math.pow(x,2)) / 2),
        b = Math.log(1 - (x*x)) / v,
        s = (x > 0 ? 1 : -1) * Math.sqrt(Math.sqrt((a*a) - b) - a);
    return mean + stdev * Math.SQRT2 * s;
  };
  return f;
};

gen.random.bootstrap = function(domain, smooth) {
  // Generates a bootstrap sample from a set of observations.
  // Smooth bootstrapping adds random zero-centered noise to the samples.
  var val = domain.filter(util.isValid),
      len = val.length,
      err = smooth ? gen.random.normal(0, smooth) : null;
  var f = function() {
    return val[~~(Math.random()*len)] + (err ? err() : 0);
  };
  f.samples = function(n) {
    return gen.zeros(n).map(f);
  };
  return f;
};
},{"./util":10}],9:[function(require,module,exports){
var d3_time = require('d3-time');

var tempDate = new Date(),
    baseDate = new Date(0, 0, 1).setFullYear(0), // Jan 1, 0 AD
    utcBaseDate = new Date(Date.UTC(0, 0, 1)).setUTCFullYear(0);

function date(d) {
  return (tempDate.setTime(+d), tempDate);
}

// create a time unit entry
function entry(type, date, unit, step, min, max) {
  var e = {
    type: type,
    date: date,
    unit: unit
  };
  if (step) {
    e.step = step;
  } else {
    e.minstep = 1;
  }
  if (min != null) e.min = min;
  if (max != null) e.max = max;
  return e;
}

function create(type, unit, base, step, min, max) {
  return entry(type,
    function(d) { return unit.offset(base, d); },
    function(d) { return unit.count(base, d); },
    step, min, max);
}

var locale = [
  create('second', d3_time.second, baseDate),
  create('minute', d3_time.minute, baseDate),
  create('hour',   d3_time.hour,   baseDate),
  create('day',    d3_time.day,    baseDate, [1, 7]),
  create('month',  d3_time.month,  baseDate, [1, 3, 6]),
  create('year',   d3_time.year,   baseDate),

  // periodic units
  entry('seconds',
    function(d) { return new Date(1970, 0, 1, 0, 0, d); },
    function(d) { return date(d).getSeconds(); },
    null, 0, 59
  ),
  entry('minutes',
    function(d) { return new Date(1970, 0, 1, 0, d); },
    function(d) { return date(d).getMinutes(); },
    null, 0, 59
  ),
  entry('hours',
    function(d) { return new Date(1970, 0, 1, d); },
    function(d) { return date(d).getHours(); },
    null, 0, 23
  ),
  entry('weekdays',
    function(d) { return new Date(1970, 0, 4+d); },
    function(d) { return date(d).getDay(); },
    [1], 0, 6
  ),
  entry('dates',
    function(d) { return new Date(1970, 0, d); },
    function(d) { return date(d).getDate(); },
    [1], 1, 31
  ),
  entry('months',
    function(d) { return new Date(1970, d % 12, 1); },
    function(d) { return date(d).getMonth(); },
    [1], 0, 11
  )
];

var utc = [
  create('second', d3_time.utcSecond, utcBaseDate),
  create('minute', d3_time.utcMinute, utcBaseDate),
  create('hour',   d3_time.utcHour,   utcBaseDate),
  create('day',    d3_time.utcDay,    utcBaseDate, [1, 7]),
  create('month',  d3_time.utcMonth,  utcBaseDate, [1, 3, 6]),
  create('year',   d3_time.utcYear,   utcBaseDate),

  // periodic units
  entry('seconds',
    function(d) { return new Date(Date.UTC(1970, 0, 1, 0, 0, d)); },
    function(d) { return date(d).getUTCSeconds(); },
    null, 0, 59
  ),
  entry('minutes',
    function(d) { return new Date(Date.UTC(1970, 0, 1, 0, d)); },
    function(d) { return date(d).getUTCMinutes(); },
    null, 0, 59
  ),
  entry('hours',
    function(d) { return new Date(Date.UTC(1970, 0, 1, d)); },
    function(d) { return date(d).getUTCHours(); },
    null, 0, 23
  ),
  entry('weekdays',
    function(d) { return new Date(Date.UTC(1970, 0, 4+d)); },
    function(d) { return date(d).getUTCDay(); },
    [1], 0, 6
  ),
  entry('dates',
    function(d) { return new Date(Date.UTC(1970, 0, d)); },
    function(d) { return date(d).getUTCDate(); },
    [1], 1, 31
  ),
  entry('months',
    function(d) { return new Date(Date.UTC(1970, d % 12, 1)); },
    function(d) { return date(d).getUTCMonth(); },
    [1], 0, 11
  )
];

var STEPS = [
  [31536e6, 5],  // 1-year
  [7776e6, 4],   // 3-month
  [2592e6, 4],   // 1-month
  [12096e5, 3],  // 2-week
  [6048e5, 3],   // 1-week
  [1728e5, 3],   // 2-day
  [864e5, 3],    // 1-day
  [432e5, 2],    // 12-hour
  [216e5, 2],    // 6-hour
  [108e5, 2],    // 3-hour
  [36e5, 2],     // 1-hour
  [18e5, 1],     // 30-minute
  [9e5, 1],      // 15-minute
  [3e5, 1],      // 5-minute
  [6e4, 1],      // 1-minute
  [3e4, 0],      // 30-second
  [15e3, 0],     // 15-second
  [5e3, 0],      // 5-second
  [1e3, 0]       // 1-second
];

function find(units, span, minb, maxb) {
  var step = STEPS[0], i, n, bins;

  for (i=1, n=STEPS.length; i<n; ++i) {
    step = STEPS[i];
    if (span > step[0]) {
      bins = span / step[0];
      if (bins > maxb) {
        return units[STEPS[i-1][1]];
      }
      if (bins >= minb) {
        return units[step[1]];
      }
    }
  }
  return units[STEPS[n-1][1]];
}

function toUnitMap(units) {
  var map = {}, i, n;
  for (i=0, n=units.length; i<n; ++i) {
    map[units[i].type] = units[i];
  }
  map.find = function(span, minb, maxb) {
    return find(units, span, minb, maxb);
  };
  return map;
}

module.exports = toUnitMap(locale);
module.exports.utc = toUnitMap(utc);
},{"d3-time":6}],10:[function(require,module,exports){
(function (Buffer){
var u = module.exports;

// utility functions

var FNAME = '__name__';

u.namedfunc = function(name, f) { return (f[FNAME] = name, f); };

u.name = function(f) { return f==null ? null : f[FNAME]; };

u.identity = function(x) { return x; };

u.true = u.namedfunc('true', function() { return true; });

u.false = u.namedfunc('false', function() { return false; });

u.duplicate = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

u.equal = function(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
};

u.extend = function(obj) {
  for (var x, name, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (name in x) { obj[name] = x[name]; }
  }
  return obj;
};

u.length = function(x) {
  return x != null && x.length != null ? x.length : null;
};

u.keys = function(x) {
  var keys = [], k;
  for (k in x) keys.push(k);
  return keys;
};

u.vals = function(x) {
  var vals = [], k;
  for (k in x) vals.push(x[k]);
  return vals;
};

u.toMap = function(list, f) {
  return (f = u.$(f)) ?
    list.reduce(function(obj, x) { return (obj[f(x)] = 1, obj); }, {}) :
    list.reduce(function(obj, x) { return (obj[x] = 1, obj); }, {});
};

u.keystr = function(values) {
  // use to ensure consistent key generation across modules
  var n = values.length;
  if (!n) return '';
  for (var s=String(values[0]), i=1; i<n; ++i) {
    s += '|' + String(values[i]);
  }
  return s;
};

// type checking functions

var toString = Object.prototype.toString;

u.isObject = function(obj) {
  return obj === Object(obj);
};

u.isFunction = function(obj) {
  return toString.call(obj) === '[object Function]';
};

u.isString = function(obj) {
  return typeof value === 'string' || toString.call(obj) === '[object String]';
};

u.isArray = Array.isArray || function(obj) {
  return toString.call(obj) === '[object Array]';
};

u.isNumber = function(obj) {
  return typeof obj === 'number' || toString.call(obj) === '[object Number]';
};

u.isBoolean = function(obj) {
  return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
};

u.isDate = function(obj) {
  return toString.call(obj) === '[object Date]';
};

u.isValid = function(obj) {
  return obj != null && obj === obj;
};

u.isBuffer = (typeof Buffer === 'function' && Buffer.isBuffer) || u.false;

// type coercion functions

u.number = function(s) {
  return s == null || s === '' ? null : +s;
};

u.boolean = function(s) {
  return s == null || s === '' ? null : s==='false' ? false : !!s;
};

// parse a date with optional d3.time-format format
u.date = function(s, format) {
  var d = format ? format : Date;
  return s == null || s === '' ? null : d.parse(s);
};

u.array = function(x) {
  return x != null ? (u.isArray(x) ? x : [x]) : [];
};

u.str = function(x) {
  return u.isArray(x) ? '[' + x.map(u.str) + ']'
    : u.isObject(x) || u.isString(x) ?
      // Output valid JSON and JS source strings.
      // See http://timelessrepo.com/json-isnt-a-javascript-subset
      JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
    : x;
};

// data access functions

var field_re = /\[(.*?)\]|[^.\[]+/g;

u.field = function(f) {
  return String(f).match(field_re).map(function(d) {
    return d[0] !== '[' ? d :
      d[1] !== "'" && d[1] !== '"' ? d.slice(1, -1) :
      d.slice(2, -2).replace(/\\(["'])/g, '$1');
  });
};

u.accessor = function(f) {
  /* jshint evil: true */
  return f==null || u.isFunction(f) ? f :
    u.namedfunc(f, Function('x', 'return x[' + u.field(f).map(u.str).join('][') + '];'));
};

// short-cut for accessor
u.$ = u.accessor;

u.mutator = function(f) {
  var s;
  return u.isString(f) && (s=u.field(f)).length > 1 ?
    function(x, v) {
      for (var i=0; i<s.length-1; ++i) x = x[s[i]];
      x[s[i]] = v;
    } :
    function(x, v) { x[f] = v; };
};


u.$func = function(name, op) {
  return function(f) {
    f = u.$(f) || u.identity;
    var n = name + (u.name(f) ? '_'+u.name(f) : '');
    return u.namedfunc(n, function(d) { return op(f(d)); });
  };
};

u.$valid  = u.$func('valid', u.isValid);
u.$length = u.$func('length', u.length);

u.$in = function(f, values) {
  f = u.$(f);
  var map = u.isArray(values) ? u.toMap(values) : values;
  return function(d) { return !!map[f(d)]; };
};

// comparison / sorting functions

u.comparator = function(sort) {
  var sign = [];
  if (sort === undefined) sort = [];
  sort = u.array(sort).map(function(f) {
    var s = 1;
    if      (f[0] === '-') { s = -1; f = f.slice(1); }
    else if (f[0] === '+') { s = +1; f = f.slice(1); }
    sign.push(s);
    return u.accessor(f);
  });
  return function(a,b) {
    var i, n, f, x, y;
    for (i=0, n=sort.length; i<n; ++i) {
      f = sort[i]; x = f(a); y = f(b);
      if (x < y) return -1 * sign[i];
      if (x > y) return sign[i];
    }
    return 0;
  };
};

u.cmp = function(a, b) {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else if (a >= b) {
    return 0;
  } else if (a === null) {
    return -1;
  } else if (b === null) {
    return 1;
  }
  return NaN;
};

u.numcmp = function(a, b) { return a - b; };

u.stablesort = function(array, sortBy, keyFn) {
  var indices = array.reduce(function(idx, v, i) {
    return (idx[keyFn(v)] = i, idx);
  }, {});

  array.sort(function(a, b) {
    var sa = sortBy(a),
        sb = sortBy(b);
    return sa < sb ? -1 : sa > sb ? 1
         : (indices[keyFn(a)] - indices[keyFn(b)]);
  });

  return array;
};


// string functions

u.pad = function(s, length, pos, padchar) {
  padchar = padchar || " ";
  var d = length - s.length;
  if (d <= 0) return s;
  switch (pos) {
    case 'left':
      return strrep(d, padchar) + s;
    case 'middle':
    case 'center':
      return strrep(Math.floor(d/2), padchar) +
         s + strrep(Math.ceil(d/2), padchar);
    default:
      return s + strrep(d, padchar);
  }
};

function strrep(n, str) {
  var s = "", i;
  for (i=0; i<n; ++i) s += str;
  return s;
}

u.truncate = function(s, length, pos, word, ellipsis) {
  var len = s.length;
  if (len <= length) return s;
  ellipsis = ellipsis !== undefined ? String(ellipsis) : '\u2026';
  var l = Math.max(0, length - ellipsis.length);

  switch (pos) {
    case 'left':
      return ellipsis + (word ? truncateOnWord(s,l,1) : s.slice(len-l));
    case 'middle':
    case 'center':
      var l1 = Math.ceil(l/2), l2 = Math.floor(l/2);
      return (word ? truncateOnWord(s,l1) : s.slice(0,l1)) +
        ellipsis + (word ? truncateOnWord(s,l2,1) : s.slice(len-l2));
    default:
      return (word ? truncateOnWord(s,l) : s.slice(0,l)) + ellipsis;
  }
};

function truncateOnWord(s, len, rev) {
  var cnt = 0, tok = s.split(truncate_word_re);
  if (rev) {
    s = (tok = tok.reverse())
      .filter(function(w) { cnt += w.length; return cnt <= len; })
      .reverse();
  } else {
    s = tok.filter(function(w) { cnt += w.length; return cnt <= len; });
  }
  return s.length ? s.join('').trim() : tok[0].slice(0, len);
}

var truncate_word_re = /([\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u2028\u2029\u3000\uFEFF])/;

}).call(this,require("buffer").Buffer)

},{"buffer":1}],11:[function(require,module,exports){
(function (AggregateOp) {
    AggregateOp[AggregateOp["VALUES"] = 'values'] = "VALUES";
    AggregateOp[AggregateOp["COUNT"] = 'count'] = "COUNT";
    AggregateOp[AggregateOp["VALID"] = 'valid'] = "VALID";
    AggregateOp[AggregateOp["MISSING"] = 'missing'] = "MISSING";
    AggregateOp[AggregateOp["DISTINCT"] = 'distinct'] = "DISTINCT";
    AggregateOp[AggregateOp["SUM"] = 'sum'] = "SUM";
    AggregateOp[AggregateOp["MEAN"] = 'mean'] = "MEAN";
    AggregateOp[AggregateOp["AVERAGE"] = 'average'] = "AVERAGE";
    AggregateOp[AggregateOp["VARIANCE"] = 'variance'] = "VARIANCE";
    AggregateOp[AggregateOp["VARIANCEP"] = 'variancep'] = "VARIANCEP";
    AggregateOp[AggregateOp["STDEV"] = 'stdev'] = "STDEV";
    AggregateOp[AggregateOp["STDEVP"] = 'stdevp'] = "STDEVP";
    AggregateOp[AggregateOp["MEDIAN"] = 'median'] = "MEDIAN";
    AggregateOp[AggregateOp["Q1"] = 'q1'] = "Q1";
    AggregateOp[AggregateOp["Q3"] = 'q3'] = "Q3";
    AggregateOp[AggregateOp["MODESKEW"] = 'modeskew'] = "MODESKEW";
    AggregateOp[AggregateOp["MIN"] = 'min'] = "MIN";
    AggregateOp[AggregateOp["MAX"] = 'max'] = "MAX";
    AggregateOp[AggregateOp["ARGMIN"] = 'argmin'] = "ARGMIN";
    AggregateOp[AggregateOp["ARGMAX"] = 'argmax'] = "ARGMAX";
})(exports.AggregateOp || (exports.AggregateOp = {}));
var AggregateOp = exports.AggregateOp;
exports.AGGREGATE_OPS = [
    AggregateOp.VALUES,
    AggregateOp.COUNT,
    AggregateOp.VALID,
    AggregateOp.MISSING,
    AggregateOp.DISTINCT,
    AggregateOp.SUM,
    AggregateOp.MEAN,
    AggregateOp.AVERAGE,
    AggregateOp.VARIANCE,
    AggregateOp.VARIANCEP,
    AggregateOp.STDEV,
    AggregateOp.STDEVP,
    AggregateOp.MEDIAN,
    AggregateOp.Q1,
    AggregateOp.Q3,
    AggregateOp.MODESKEW,
    AggregateOp.MIN,
    AggregateOp.MAX,
    AggregateOp.ARGMIN,
    AggregateOp.ARGMAX,
];
exports.SHARED_DOMAIN_OPS = [
    AggregateOp.MEAN,
    AggregateOp.AVERAGE,
    AggregateOp.STDEV,
    AggregateOp.STDEVP,
    AggregateOp.MEDIAN,
    AggregateOp.Q1,
    AggregateOp.Q3,
    AggregateOp.MIN,
    AggregateOp.MAX,
];

},{}],12:[function(require,module,exports){
var util_1 = require('./util');
(function (Channel) {
    Channel[Channel["X"] = 'x'] = "X";
    Channel[Channel["Y"] = 'y'] = "Y";
    Channel[Channel["ROW"] = 'row'] = "ROW";
    Channel[Channel["COLUMN"] = 'column'] = "COLUMN";
    Channel[Channel["SHAPE"] = 'shape'] = "SHAPE";
    Channel[Channel["SIZE"] = 'size'] = "SIZE";
    Channel[Channel["COLOR"] = 'color'] = "COLOR";
    Channel[Channel["TEXT"] = 'text'] = "TEXT";
    Channel[Channel["DETAIL"] = 'detail'] = "DETAIL";
    Channel[Channel["LABEL"] = 'label'] = "LABEL";
    Channel[Channel["PATH"] = 'path'] = "PATH";
    Channel[Channel["ORDER"] = 'order'] = "ORDER";
})(exports.Channel || (exports.Channel = {}));
var Channel = exports.Channel;
exports.X = Channel.X;
exports.Y = Channel.Y;
exports.ROW = Channel.ROW;
exports.COLUMN = Channel.COLUMN;
exports.SHAPE = Channel.SHAPE;
exports.SIZE = Channel.SIZE;
exports.COLOR = Channel.COLOR;
exports.TEXT = Channel.TEXT;
exports.DETAIL = Channel.DETAIL;
exports.LABEL = Channel.LABEL;
exports.PATH = Channel.PATH;
exports.ORDER = Channel.ORDER;
exports.CHANNELS = [exports.X, exports.Y, exports.ROW, exports.COLUMN, exports.SIZE, exports.SHAPE, exports.COLOR, exports.PATH, exports.ORDER, exports.TEXT, exports.DETAIL, exports.LABEL];
;
function supportMark(channel, mark) {
    return !!getSupportedMark(channel)[mark];
}
exports.supportMark = supportMark;
function getSupportedMark(channel) {
    switch (channel) {
        case exports.X:
        case exports.Y:
        case exports.COLOR:
        case exports.DETAIL:
        case exports.ORDER:
        case exports.ROW:
        case exports.COLUMN:
            return {
                point: true, tick: true, circle: true, square: true,
                bar: true, line: true, area: true, text: true
            };
        case exports.SIZE:
            return {
                point: true, tick: true, circle: true, square: true,
                bar: true, text: true
            };
        case exports.SHAPE:
            return { point: true };
        case exports.TEXT:
            return { text: true };
        case exports.PATH:
            return { line: true };
    }
    return {};
}
exports.getSupportedMark = getSupportedMark;
;
function getSupportedRole(channel) {
    switch (channel) {
        case exports.X:
        case exports.Y:
        case exports.COLOR:
        case exports.LABEL:
            return {
                measure: true,
                dimension: true
            };
        case exports.ROW:
        case exports.COLUMN:
        case exports.SHAPE:
        case exports.DETAIL:
            return {
                measure: false,
                dimension: true
            };
        case exports.SIZE:
        case exports.TEXT:
            return {
                measure: true,
                dimension: false
            };
        case exports.PATH:
            return {
                measure: false,
                dimension: true
            };
    }
    throw new Error('Invalid encoding channel' + channel);
}
exports.getSupportedRole = getSupportedRole;
function hasScale(channel) {
    return !util_1.contains([exports.DETAIL, exports.PATH, exports.TEXT, exports.LABEL, exports.ORDER], channel);
}
exports.hasScale = hasScale;

},{"./util":21}],13:[function(require,module,exports){
var channel_1 = require('./channel');
var util_1 = require('./util');
function countRetinal(encoding) {
    var count = 0;
    if (encoding.color) {
        count++;
    }
    if (encoding.size) {
        count++;
    }
    if (encoding.shape) {
        count++;
    }
    return count;
}
exports.countRetinal = countRetinal;
function channels(encoding) {
    return channel_1.CHANNELS.filter(function (channel) {
        return has(encoding, channel);
    });
}
exports.channels = channels;
function has(encoding, channel) {
    var channelEncoding = encoding && encoding[channel];
    return channelEncoding && (channelEncoding.field !== undefined ||
        (util_1.isArray(channelEncoding) && channelEncoding.length > 0));
}
exports.has = has;
function isAggregate(encoding) {
    return util_1.any(channel_1.CHANNELS, function (channel) {
        if (has(encoding, channel) && encoding[channel].aggregate) {
            return true;
        }
        return false;
    });
}
exports.isAggregate = isAggregate;
function fieldDefs(encoding) {
    var arr = [];
    channel_1.CHANNELS.forEach(function (channel) {
        if (has(encoding, channel)) {
            if (util_1.isArray(encoding[channel])) {
                encoding[channel].forEach(function (fieldDef) {
                    arr.push(fieldDef);
                });
            }
            else {
                arr.push(encoding[channel]);
            }
        }
    });
    return arr;
}
exports.fieldDefs = fieldDefs;
;
function forEach(encoding, f, thisArg) {
    var i = 0;
    channel_1.CHANNELS.forEach(function (channel) {
        if (has(encoding, channel)) {
            if (util_1.isArray(encoding[channel])) {
                encoding[channel].forEach(function (fieldDef) {
                    f.call(thisArg, fieldDef, channel, i++);
                });
            }
            else {
                f.call(thisArg, encoding[channel], channel, i++);
            }
        }
    });
}
exports.forEach = forEach;
function map(encoding, f, thisArg) {
    var arr = [];
    channel_1.CHANNELS.forEach(function (channel) {
        if (has(encoding, channel)) {
            if (util_1.isArray(encoding[channel])) {
                encoding[channel].forEach(function (fieldDef) {
                    arr.push(f.call(thisArg, fieldDef, channel, encoding));
                });
            }
            else {
                arr.push(f.call(thisArg, encoding[channel], channel, encoding));
            }
        }
    });
    return arr;
}
exports.map = map;
function reduce(encoding, f, init, thisArg) {
    var r = init;
    channel_1.CHANNELS.forEach(function (channel) {
        if (has(encoding, channel)) {
            if (util_1.isArray(encoding[channel])) {
                encoding[channel].forEach(function (fieldDef) {
                    r = f.call(thisArg, r, fieldDef, channel, encoding);
                });
            }
            else {
                r = f.call(thisArg, r, encoding[channel], channel, encoding);
            }
        }
    });
    return r;
}
exports.reduce = reduce;

},{"./channel":12,"./util":21}],14:[function(require,module,exports){
var aggregate_1 = require('./aggregate');
var timeunit_1 = require('./timeunit');
var type_1 = require('./type');
var util_1 = require('./util');
exports.aggregate = {
    type: 'string',
    enum: aggregate_1.AGGREGATE_OPS,
    supportedEnums: {
        quantitative: aggregate_1.AGGREGATE_OPS,
        ordinal: ['median', 'min', 'max'],
        nominal: [],
        temporal: ['mean', 'median', 'min', 'max'],
        '': ['count']
    },
    supportedTypes: util_1.toMap([type_1.QUANTITATIVE, type_1.NOMINAL, type_1.ORDINAL, type_1.TEMPORAL, ''])
};
function field(fieldDef, opt) {
    if (opt === void 0) { opt = {}; }
    var prefix = (opt.datum ? 'datum.' : '') + (opt.prefn || '');
    var suffix = opt.suffix || '';
    var field = fieldDef.field;
    if (isCount(fieldDef)) {
        return prefix + 'count' + suffix;
    }
    else if (opt.fn) {
        return prefix + opt.fn + '_' + field + suffix;
    }
    else if (!opt.nofn && fieldDef.bin) {
        return prefix + 'bin_' + field + (opt.binSuffix || suffix || '_start');
    }
    else if (!opt.nofn && !opt.noAggregate && fieldDef.aggregate) {
        return prefix + fieldDef.aggregate + '_' + field + suffix;
    }
    else if (!opt.nofn && fieldDef.timeUnit) {
        return prefix + fieldDef.timeUnit + '_' + field + suffix;
    }
    else {
        return prefix + field;
    }
}
exports.field = field;
function _isFieldDimension(fieldDef) {
    return util_1.contains([type_1.NOMINAL, type_1.ORDINAL], fieldDef.type) || !!fieldDef.bin ||
        (fieldDef.type === type_1.TEMPORAL && !!fieldDef.timeUnit);
}
function isDimension(fieldDef) {
    return fieldDef && fieldDef.field && _isFieldDimension(fieldDef);
}
exports.isDimension = isDimension;
function isMeasure(fieldDef) {
    return fieldDef && fieldDef.field && !_isFieldDimension(fieldDef);
}
exports.isMeasure = isMeasure;
exports.COUNT_DISPLAYNAME = 'Number of Records';
function count() {
    return { field: '*', aggregate: aggregate_1.AggregateOp.COUNT, type: type_1.QUANTITATIVE, displayName: exports.COUNT_DISPLAYNAME };
}
exports.count = count;
function isCount(fieldDef) {
    return fieldDef.aggregate === aggregate_1.AggregateOp.COUNT;
}
exports.isCount = isCount;
function cardinality(fieldDef, stats, filterNull) {
    if (filterNull === void 0) { filterNull = {}; }
    var stat = stats[fieldDef.field], type = fieldDef.type;
    if (fieldDef.bin) {
        var bin_1 = fieldDef.bin;
        var maxbins = (typeof bin_1 === 'boolean') ? undefined : bin_1.maxbins;
        if (maxbins === undefined) {
            maxbins = 10;
        }
        var bins = util_1.getbins(stat, maxbins);
        return (bins.stop - bins.start) / bins.step;
    }
    if (type === type_1.TEMPORAL) {
        var timeUnit = fieldDef.timeUnit;
        switch (timeUnit) {
            case timeunit_1.TimeUnit.SECONDS: return 60;
            case timeunit_1.TimeUnit.MINUTES: return 60;
            case timeunit_1.TimeUnit.HOURS: return 24;
            case timeunit_1.TimeUnit.DAY: return 7;
            case timeunit_1.TimeUnit.DATE: return 31;
            case timeunit_1.TimeUnit.MONTH: return 12;
            case timeunit_1.TimeUnit.YEAR:
                var yearstat = stats['year_' + fieldDef.field];
                if (!yearstat) {
                    return null;
                }
                return yearstat.distinct -
                    (stat.missing > 0 && filterNull[type] ? 1 : 0);
        }
    }
    if (fieldDef.aggregate) {
        return 1;
    }
    return stat.distinct -
        (stat.missing > 0 && filterNull[type] ? 1 : 0);
}
exports.cardinality = cardinality;
function title(fieldDef) {
    if (isCount(fieldDef)) {
        return exports.COUNT_DISPLAYNAME;
    }
    var fn = fieldDef.aggregate || fieldDef.timeUnit || (fieldDef.bin && 'bin');
    if (fn) {
        return fn.toString().toUpperCase() + '(' + fieldDef.field + ')';
    }
    else {
        return fieldDef.field;
    }
}
exports.title = title;

},{"./aggregate":11,"./timeunit":19,"./type":20,"./util":21}],15:[function(require,module,exports){
(function (Mark) {
    Mark[Mark["AREA"] = 'area'] = "AREA";
    Mark[Mark["BAR"] = 'bar'] = "BAR";
    Mark[Mark["LINE"] = 'line'] = "LINE";
    Mark[Mark["POINT"] = 'point'] = "POINT";
    Mark[Mark["TEXT"] = 'text'] = "TEXT";
    Mark[Mark["TICK"] = 'tick'] = "TICK";
    Mark[Mark["CIRCLE"] = 'circle'] = "CIRCLE";
    Mark[Mark["SQUARE"] = 'square'] = "SQUARE";
})(exports.Mark || (exports.Mark = {}));
var Mark = exports.Mark;
exports.AREA = Mark.AREA;
exports.BAR = Mark.BAR;
exports.LINE = Mark.LINE;
exports.POINT = Mark.POINT;
exports.TEXT = Mark.TEXT;
exports.TICK = Mark.TICK;
exports.CIRCLE = Mark.CIRCLE;
exports.SQUARE = Mark.SQUARE;

},{}],16:[function(require,module,exports){
(function (ScaleType) {
    ScaleType[ScaleType["LINEAR"] = 'linear'] = "LINEAR";
    ScaleType[ScaleType["LOG"] = 'log'] = "LOG";
    ScaleType[ScaleType["POW"] = 'pow'] = "POW";
    ScaleType[ScaleType["SQRT"] = 'sqrt'] = "SQRT";
    ScaleType[ScaleType["QUANTILE"] = 'quantile'] = "QUANTILE";
    ScaleType[ScaleType["QUANTIZE"] = 'quantize'] = "QUANTIZE";
    ScaleType[ScaleType["ORDINAL"] = 'ordinal'] = "ORDINAL";
    ScaleType[ScaleType["TIME"] = 'time'] = "TIME";
    ScaleType[ScaleType["UTC"] = 'utc'] = "UTC";
})(exports.ScaleType || (exports.ScaleType = {}));
var ScaleType = exports.ScaleType;
(function (NiceTime) {
    NiceTime[NiceTime["SECOND"] = 'second'] = "SECOND";
    NiceTime[NiceTime["MINUTE"] = 'minute'] = "MINUTE";
    NiceTime[NiceTime["HOUR"] = 'hour'] = "HOUR";
    NiceTime[NiceTime["DAY"] = 'day'] = "DAY";
    NiceTime[NiceTime["WEEK"] = 'week'] = "WEEK";
    NiceTime[NiceTime["MONTH"] = 'month'] = "MONTH";
    NiceTime[NiceTime["YEAR"] = 'year'] = "YEAR";
})(exports.NiceTime || (exports.NiceTime = {}));
var NiceTime = exports.NiceTime;
exports.defaultScaleConfig = {
    round: true,
    textBandWidth: 90,
    bandSize: 21,
    padding: 1,
    includeRawDomain: false,
    nominalColorRange: 'category10',
    sequentialColorRange: ['#AFC6A3', '#09622A'],
    shapeRange: 'shapes',
    fontSizeRange: [8, 40]
};
exports.defaultFacetScaleConfig = {
    round: true,
    padding: 16
};

},{}],17:[function(require,module,exports){
var aggregate_1 = require('./aggregate');
var timeunit_1 = require('./timeunit');
var type_1 = require('./type');
var vlEncoding = require('./encoding');
var mark_1 = require('./mark');
exports.DELIM = '|';
exports.ASSIGN = '=';
exports.TYPE = ',';
exports.FUNC = '_';
function shorten(spec) {
    return 'mark' + exports.ASSIGN + spec.mark +
        exports.DELIM + shortenEncoding(spec.encoding);
}
exports.shorten = shorten;
function parse(shorthand, data, config) {
    var split = shorthand.split(exports.DELIM), mark = split.shift().split(exports.ASSIGN)[1].trim(), encoding = parseEncoding(split.join(exports.DELIM));
    var spec = {
        mark: mark_1.Mark[mark],
        encoding: encoding
    };
    if (data !== undefined) {
        spec.data = data;
    }
    if (config !== undefined) {
        spec.config = config;
    }
    return spec;
}
exports.parse = parse;
function shortenEncoding(encoding) {
    return vlEncoding.map(encoding, function (fieldDef, channel) {
        return channel + exports.ASSIGN + shortenFieldDef(fieldDef);
    }).join(exports.DELIM);
}
exports.shortenEncoding = shortenEncoding;
function parseEncoding(encodingShorthand) {
    return encodingShorthand.split(exports.DELIM).reduce(function (m, e) {
        var split = e.split(exports.ASSIGN), enctype = split[0].trim(), fieldDefShorthand = split[1];
        m[enctype] = parseFieldDef(fieldDefShorthand);
        return m;
    }, {});
}
exports.parseEncoding = parseEncoding;
function shortenFieldDef(fieldDef) {
    return (fieldDef.aggregate ? fieldDef.aggregate + exports.FUNC : '') +
        (fieldDef.timeUnit ? fieldDef.timeUnit + exports.FUNC : '') +
        (fieldDef.bin ? 'bin' + exports.FUNC : '') +
        (fieldDef.field || '') + exports.TYPE + type_1.SHORT_TYPE[fieldDef.type];
}
exports.shortenFieldDef = shortenFieldDef;
function shortenFieldDefs(fieldDefs, delim) {
    if (delim === void 0) { delim = exports.DELIM; }
    return fieldDefs.map(shortenFieldDef).join(delim);
}
exports.shortenFieldDefs = shortenFieldDefs;
function parseFieldDef(fieldDefShorthand) {
    var split = fieldDefShorthand.split(exports.TYPE);
    var fieldDef = {
        field: split[0].trim(),
        type: type_1.TYPE_FROM_SHORT_TYPE[split[1].trim()]
    };
    for (var i = 0; i < aggregate_1.AGGREGATE_OPS.length; i++) {
        var a = aggregate_1.AGGREGATE_OPS[i];
        if (fieldDef.field.indexOf(a + '_') === 0) {
            fieldDef.field = fieldDef.field.substr(a.toString().length + 1);
            if (a === aggregate_1.AggregateOp.COUNT && fieldDef.field.length === 0) {
                fieldDef.field = '*';
            }
            fieldDef.aggregate = a;
            break;
        }
    }
    for (var i = 0; i < timeunit_1.TIMEUNITS.length; i++) {
        var tu = timeunit_1.TIMEUNITS[i];
        if (fieldDef.field && fieldDef.field.indexOf(tu + '_') === 0) {
            fieldDef.field = fieldDef.field.substr(fieldDef.field.length + 1);
            fieldDef.timeUnit = tu;
            break;
        }
    }
    if (fieldDef.field && fieldDef.field.indexOf('bin_') === 0) {
        fieldDef.field = fieldDef.field.substr(4);
        fieldDef.bin = true;
    }
    return fieldDef;
}
exports.parseFieldDef = parseFieldDef;

},{"./aggregate":11,"./encoding":13,"./mark":15,"./timeunit":19,"./type":20}],18:[function(require,module,exports){
var channel_1 = require('./channel');
var vlEncoding = require('./encoding');
var mark_1 = require('./mark');
var util_1 = require('./util');
function alwaysNoOcclusion(spec) {
    return vlEncoding.isAggregate(spec.encoding);
}
exports.alwaysNoOcclusion = alwaysNoOcclusion;
function fieldDefs(spec) {
    return vlEncoding.fieldDefs(spec.encoding);
}
exports.fieldDefs = fieldDefs;
;
function getCleanSpec(spec) {
    return spec;
}
exports.getCleanSpec = getCleanSpec;
function isStack(spec) {
    return (vlEncoding.has(spec.encoding, channel_1.COLOR) || vlEncoding.has(spec.encoding, channel_1.SHAPE)) &&
        (spec.mark === mark_1.BAR || spec.mark === mark_1.AREA) &&
        (!spec.config || !spec.config.mark.stacked !== false) &&
        vlEncoding.isAggregate(spec.encoding);
}
exports.isStack = isStack;
function transpose(spec) {
    var oldenc = spec.encoding;
    var encoding = util_1.duplicate(spec.encoding);
    encoding.x = oldenc.y;
    encoding.y = oldenc.x;
    encoding.row = oldenc.column;
    encoding.column = oldenc.row;
    spec.encoding = encoding;
    return spec;
}
exports.transpose = transpose;

},{"./channel":12,"./encoding":13,"./mark":15,"./util":21}],19:[function(require,module,exports){
(function (TimeUnit) {
    TimeUnit[TimeUnit["YEAR"] = 'year'] = "YEAR";
    TimeUnit[TimeUnit["MONTH"] = 'month'] = "MONTH";
    TimeUnit[TimeUnit["DAY"] = 'day'] = "DAY";
    TimeUnit[TimeUnit["DATE"] = 'date'] = "DATE";
    TimeUnit[TimeUnit["HOURS"] = 'hours'] = "HOURS";
    TimeUnit[TimeUnit["MINUTES"] = 'minutes'] = "MINUTES";
    TimeUnit[TimeUnit["SECONDS"] = 'seconds'] = "SECONDS";
    TimeUnit[TimeUnit["MILLISECONDS"] = 'milliseconds'] = "MILLISECONDS";
    TimeUnit[TimeUnit["YEARMONTH"] = 'yearmonth'] = "YEARMONTH";
    TimeUnit[TimeUnit["YEARMONTHDAY"] = 'yearmonthday'] = "YEARMONTHDAY";
    TimeUnit[TimeUnit["YEARMONTHDATE"] = 'yearmonthdate'] = "YEARMONTHDATE";
    TimeUnit[TimeUnit["YEARDAY"] = 'yearday'] = "YEARDAY";
    TimeUnit[TimeUnit["YEARDATE"] = 'yeardate'] = "YEARDATE";
    TimeUnit[TimeUnit["YEARMONTHDAYHOURS"] = 'yearmonthdayhours'] = "YEARMONTHDAYHOURS";
    TimeUnit[TimeUnit["YEARMONTHDAYHOURSMINUTES"] = 'yearmonthdayhoursminutes'] = "YEARMONTHDAYHOURSMINUTES";
    TimeUnit[TimeUnit["YEARMONTHDAYHOURSMINUTESSECONDS"] = 'yearmonthdayhoursminutesseconds'] = "YEARMONTHDAYHOURSMINUTESSECONDS";
    TimeUnit[TimeUnit["HOURSMINUTES"] = 'hoursminutes'] = "HOURSMINUTES";
    TimeUnit[TimeUnit["HOURSMINUTESSECONDS"] = 'hoursminutesseconds'] = "HOURSMINUTESSECONDS";
    TimeUnit[TimeUnit["MINUTESSECONDS"] = 'minutesseconds'] = "MINUTESSECONDS";
    TimeUnit[TimeUnit["SECONDSMILLISECONDS"] = 'secondsmilliseconds'] = "SECONDSMILLISECONDS";
})(exports.TimeUnit || (exports.TimeUnit = {}));
var TimeUnit = exports.TimeUnit;
exports.TIMEUNITS = [
    TimeUnit.YEAR,
    TimeUnit.MONTH,
    TimeUnit.DAY,
    TimeUnit.DATE,
    TimeUnit.HOURS,
    TimeUnit.MINUTES,
    TimeUnit.SECONDS,
    TimeUnit.MILLISECONDS,
    TimeUnit.YEARMONTH,
    TimeUnit.YEARMONTHDAY,
    TimeUnit.YEARMONTHDATE,
    TimeUnit.YEARDAY,
    TimeUnit.YEARDATE,
    TimeUnit.YEARMONTHDAYHOURS,
    TimeUnit.YEARMONTHDAYHOURSMINUTES,
    TimeUnit.YEARMONTHDAYHOURSMINUTESSECONDS,
    TimeUnit.HOURSMINUTES,
    TimeUnit.HOURSMINUTESSECONDS,
    TimeUnit.MINUTESSECONDS,
    TimeUnit.SECONDSMILLISECONDS,
];

},{}],20:[function(require,module,exports){
(function (Type) {
    Type[Type["QUANTITATIVE"] = 'quantitative'] = "QUANTITATIVE";
    Type[Type["ORDINAL"] = 'ordinal'] = "ORDINAL";
    Type[Type["TEMPORAL"] = 'temporal'] = "TEMPORAL";
    Type[Type["NOMINAL"] = 'nominal'] = "NOMINAL";
})(exports.Type || (exports.Type = {}));
var Type = exports.Type;
exports.QUANTITATIVE = Type.QUANTITATIVE;
exports.ORDINAL = Type.ORDINAL;
exports.TEMPORAL = Type.TEMPORAL;
exports.NOMINAL = Type.NOMINAL;
exports.SHORT_TYPE = {
    quantitative: 'Q',
    temporal: 'T',
    nominal: 'N',
    ordinal: 'O'
};
exports.TYPE_FROM_SHORT_TYPE = {
    Q: exports.QUANTITATIVE,
    T: exports.TEMPORAL,
    O: exports.ORDINAL,
    N: exports.NOMINAL
};
function getFullName(type) {
    var typeString = type;
    return exports.TYPE_FROM_SHORT_TYPE[typeString.toUpperCase()] ||
        typeString.toLowerCase();
}
exports.getFullName = getFullName;

},{}],21:[function(require,module,exports){
var util_1 = require('datalib/src/util');
exports.keys = util_1.keys;
exports.extend = util_1.extend;
exports.duplicate = util_1.duplicate;
exports.isArray = util_1.isArray;
exports.vals = util_1.vals;
exports.truncate = util_1.truncate;
exports.toMap = util_1.toMap;
exports.isObject = util_1.isObject;
var generate_1 = require('datalib/src/generate');
exports.range = generate_1.range;
function contains(array, item) {
    return array.indexOf(item) > -1;
}
exports.contains = contains;
function without(array, items) {
    return array.filter(function (item) {
        return !contains(items, item);
    });
}
exports.without = without;
function forEach(obj, f, thisArg) {
    if (obj.forEach) {
        obj.forEach.call(thisArg, f);
    }
    else {
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                f.call(thisArg, obj[k], k, obj);
            }
        }
    }
}
exports.forEach = forEach;
function reduce(obj, f, init, thisArg) {
    if (obj.reduce) {
        return obj.reduce.call(thisArg, f, init);
    }
    else {
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                init = f.call(thisArg, init, obj[k], k, obj);
            }
        }
        return init;
    }
}
exports.reduce = reduce;
function map(obj, f, thisArg) {
    if (obj.map) {
        return obj.map.call(thisArg, f);
    }
    else {
        var output = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                output.push(f.call(thisArg, obj[k], k, obj));
            }
        }
        return output;
    }
}
exports.map = map;
function any(arr, f) {
    var i = 0;
    for (var k = 0; k < arr.length; k++) {
        if (f(arr[k], k, i++)) {
            return true;
        }
    }
    return false;
}
exports.any = any;
function all(arr, f) {
    var i = 0;
    for (var k = 0; k < arr.length; k++) {
        if (!f(arr[k], k, i++)) {
            return false;
        }
    }
    return true;
}
exports.all = all;
function mergeDeep(dest) {
    var src = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        src[_i - 1] = arguments[_i];
    }
    for (var i = 0; i < src.length; i++) {
        dest = deepMerge_(dest, src[i]);
    }
    return dest;
}
exports.mergeDeep = mergeDeep;
;
function deepMerge_(dest, src) {
    if (typeof src !== 'object' || src === null) {
        return dest;
    }
    for (var p in src) {
        if (!src.hasOwnProperty(p)) {
            continue;
        }
        if (src[p] === undefined) {
            continue;
        }
        if (typeof src[p] !== 'object' || src[p] === null) {
            dest[p] = src[p];
        }
        else if (typeof dest[p] !== 'object' || dest[p] === null) {
            dest[p] = mergeDeep(src[p].constructor === Array ? [] : {}, src[p]);
        }
        else {
            mergeDeep(dest[p], src[p]);
        }
    }
    return dest;
}
var dlBin = require('datalib/src/bins/bins');
function getbins(stats, maxbins) {
    return dlBin({
        min: stats.min,
        max: stats.max,
        maxbins: maxbins
    });
}
exports.getbins = getbins;
function error(message) {
    console.error('[VL Error]', message);
}
exports.error = error;

},{"datalib/src/bins/bins":7,"datalib/src/generate":8,"datalib/src/util":10}],22:[function(require,module,exports){
var util_1 = require('./util');
var mark_1 = require('./mark');
exports.DEFAULT_REQUIRED_CHANNEL_MAP = {
    text: ['text'],
    line: ['x', 'y'],
    area: ['x', 'y']
};
exports.DEFAULT_SUPPORTED_CHANNEL_TYPE = {
    bar: util_1.toMap(['row', 'column', 'x', 'y', 'size', 'color', 'detail']),
    line: util_1.toMap(['row', 'column', 'x', 'y', 'color', 'detail']),
    area: util_1.toMap(['row', 'column', 'x', 'y', 'color', 'detail']),
    tick: util_1.toMap(['row', 'column', 'x', 'y', 'color', 'detail']),
    circle: util_1.toMap(['row', 'column', 'x', 'y', 'color', 'size', 'detail']),
    square: util_1.toMap(['row', 'column', 'x', 'y', 'color', 'size', 'detail']),
    point: util_1.toMap(['row', 'column', 'x', 'y', 'color', 'size', 'detail', 'shape']),
    text: util_1.toMap(['row', 'column', 'size', 'color', 'text'])
};
function getEncodingMappingError(spec, requiredChannelMap, supportedChannelMap) {
    if (requiredChannelMap === void 0) { requiredChannelMap = exports.DEFAULT_REQUIRED_CHANNEL_MAP; }
    if (supportedChannelMap === void 0) { supportedChannelMap = exports.DEFAULT_SUPPORTED_CHANNEL_TYPE; }
    var mark = spec.mark;
    var encoding = spec.encoding;
    var requiredChannels = requiredChannelMap[mark];
    var supportedChannels = supportedChannelMap[mark];
    for (var i in requiredChannels) {
        if (!(requiredChannels[i] in encoding)) {
            return 'Missing encoding channel \"' + requiredChannels[i] +
                '\" for mark \"' + mark + '\"';
        }
    }
    for (var channel in encoding) {
        if (!supportedChannels[channel]) {
            return 'Encoding channel \"' + channel +
                '\" is not supported by mark type \"' + mark + '\"';
        }
    }
    if (mark === mark_1.BAR && !encoding.x && !encoding.y) {
        return 'Missing both x and y for bar';
    }
    return null;
}
exports.getEncodingMappingError = getEncodingMappingError;

},{"./mark":15,"./util":21}],23:[function(require,module,exports){
var vlShorthand = require('vega-lite/src/shorthand');
var clusterfck = require('clusterfck');
var consts = require('./clusterconsts');
var util = require('../util');
var clDistance = require('./distance');
exports.distance = clDistance;
function cluster(specs, opt) {
    var dist = exports.distance.table(specs);
    var clusterTrees = clusterfck.hcluster(specs, function (e1, e2) {
        var s1 = vlShorthand.shorten(e1), s2 = vlShorthand.shorten(e2);
        return dist[s1][s2];
    }, 'average', consts.CLUSTER_THRESHOLD);
    var clusters = clusterTrees.map(function (tree) {
        return util.traverse(tree, []);
    })
        .map(function (cluster) {
        return cluster.sort(function (spec1, spec2) {
            return spec2._info.score - spec1._info.score;
        });
    }).filter(function (cluster) {
        return cluster.length > 0;
    }).sort(function (cluster1, cluster2) {
        return cluster2[0]._info.score - cluster1[0]._info.score;
    });
    clusters.dist = dist;
    return clusters;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = cluster;

},{"../util":39,"./clusterconsts":24,"./distance":25,"clusterfck":2,"vega-lite/src/shorthand":17}],24:[function(require,module,exports){
'use strict';
exports.SWAPPABLE = 0.05;
exports.DIST_MISSING = 1;
exports.CLUSTER_THRESHOLD = 1;
function reduceTupleToTable(r, x) {
    var a = x[0], b = x[1], d = x[2];
    r[a] = r[a] || {};
    r[b] = r[b] || {};
    r[a][b] = r[b][a] = d;
    return r;
}
exports.DIST_BY_CHANNEL = [
    ['x', 'y', exports.SWAPPABLE],
    ['row', 'column', exports.SWAPPABLE],
    ['color', 'shape', exports.SWAPPABLE],
    ['color', 'detail', exports.SWAPPABLE],
    ['detail', 'shape', exports.SWAPPABLE],
    ['size', 'color', exports.SWAPPABLE]
].reduce(reduceTupleToTable, {});

},{}],25:[function(require,module,exports){
var vlSpec = require('vega-lite/src/spec');
var vlShorthand = require('vega-lite/src/shorthand');
var consts = require('./clusterconsts');
var util = require('../util');
function table(specs) {
    var len = specs.length, extendedSpecs = specs.map(function (e) { return extendSpecWithChannelByColumnName(e); }), shorthands = specs.map(vlShorthand.shorten), diff = {}, i, j;
    for (i = 0; i < len; i++) {
        diff[shorthands[i]] = {};
    }
    for (i = 0; i < len; i++) {
        for (j = i + 1; j < len; j++) {
            var sj = shorthands[j], si = shorthands[i];
            diff[sj][si] = diff[si][sj] = get(extendedSpecs[i], extendedSpecs[j]);
        }
    }
    return diff;
}
exports.table = table;
function get(extendedSpec1, extendedSpec2) {
    var cols = util.union(util.keys(extendedSpec1.channelByField), util.keys(extendedSpec2.channelByField)), dist = 0;
    cols.forEach(function (column) {
        var e1 = extendedSpec1.channelByField[column], e2 = extendedSpec2.channelByField[column];
        if (e1 && e2) {
            if (e1.channel !== e2.channel) {
                dist += (consts.DIST_BY_CHANNEL[e1.channel] || {})[e2.channel] || 1;
            }
        }
        else {
            dist += consts.DIST_MISSING;
        }
    });
    var isStack1 = vlSpec.isStack(extendedSpec1), isStack2 = vlSpec.isStack(extendedSpec2);
    if (isStack1 || isStack2) {
        if (isStack1 && isStack2) {
            if ((extendedSpec1.encoding.color && extendedSpec2.encoding.color &&
                extendedSpec1.encoding.color.field !== extendedSpec2.encoding.color.field) ||
                (extendedSpec1.encoding.detail && extendedSpec2.encoding.detail &&
                    extendedSpec1.encoding.detail.field !== extendedSpec2.encoding.detail.field)) {
                dist += 1;
            }
        }
        else {
            dist += 1;
        }
    }
    return dist;
}
exports.get = get;
function extendSpecWithChannelByColumnName(spec) {
    var _channelByField = {}, encoding = spec.encoding;
    util.keys(encoding).forEach(function (channel) {
        var e = util.duplicate(encoding[channel]);
        e.channel = channel;
        _channelByField[e.field || ''] = e;
        delete e.field;
    });
    return {
        mark: spec.mark,
        channelByField: _channelByField,
        encoding: spec.encoding
    };
}
exports.extendSpecWithChannelByColumnName = extendSpecWithChannelByColumnName;

},{"../util":39,"./clusterconsts":24,"vega-lite/src/shorthand":17,"vega-lite/src/spec":18}],26:[function(require,module,exports){
var channel_1 = require('vega-lite/src/channel');
var mark_1 = require('vega-lite/src/mark');
exports.DEFAULT_PROJECTION_OPT = {
    omitDotPlot: false,
    maxCardinalityForAutoAddOrdinal: 50,
    alwaysAddHistogram: true,
    maxAdditionalVariables: 1
};
(function (TableType) {
    TableType[TableType["BOTH"] = 'both'] = "BOTH";
    TableType[TableType["AGGREGATED"] = 'aggregated'] = "AGGREGATED";
    TableType[TableType["DISAGGREGATED"] = 'disaggregated'] = "DISAGGREGATED";
})(exports.TableType || (exports.TableType = {}));
var TableType = exports.TableType;
(function (QuantitativeDimensionType) {
    QuantitativeDimensionType[QuantitativeDimensionType["AUTO"] = 'auto'] = "AUTO";
    QuantitativeDimensionType[QuantitativeDimensionType["BIN"] = 'bin'] = "BIN";
    QuantitativeDimensionType[QuantitativeDimensionType["CAST"] = 'cast'] = "CAST";
    QuantitativeDimensionType[QuantitativeDimensionType["NONE"] = 'none'] = "NONE";
})(exports.QuantitativeDimensionType || (exports.QuantitativeDimensionType = {}));
var QuantitativeDimensionType = exports.QuantitativeDimensionType;
exports.DEFAULT_AGGREGATION_OPTIONS = {
    tableTypes: TableType.BOTH,
    genDimQ: QuantitativeDimensionType.AUTO,
    minCardinalityForBin: 20,
    omitDotPlot: false,
    omitMeasureOnly: false,
    omitDimensionOnly: true,
    addCountForDimensionOnly: true,
    aggrList: [undefined, 'mean'],
    timeUnitList: ['year'],
    consistentAutoQ: true
};
exports.DEFAULT_SCALE_OPTION = {
    rescaleQuantitative: [undefined]
};
;
exports.DEFAULT_SPEC_OPTION = {
    markList: [mark_1.Mark.POINT, mark_1.Mark.BAR, mark_1.Mark.LINE, mark_1.Mark.AREA, mark_1.Mark.TEXT, mark_1.Mark.TICK],
    channelList: [channel_1.X, channel_1.Y, channel_1.ROW, channel_1.COLUMN, channel_1.SIZE, channel_1.COLOR, channel_1.TEXT, channel_1.DETAIL],
    alwaysGenerateTableAsHeatmap: true,
    maxGoodCardinalityForFacets: 5,
    maxCardinalityForFacets: 20,
    maxGoodCardinalityForColor: 7,
    maxCardinalityForColor: 20,
    maxCardinalityForShape: 6,
    omitDotPlot: false,
    omitDotPlotWithExtraEncoding: true,
    omitDotPlotWithFacet: true,
    omitDotPlotWithOnlyCount: false,
    omitMultipleNonPositionalChannels: true,
    omitNonTextAggrWithAllDimsOnFacets: true,
    omitRawWithXYBothDimension: true,
    omitShapeWithBin: true,
    omitShapeWithTimeDimension: true,
    omitSizeOnBar: true,
    omitLengthForLogScale: true,
    omitStackedAverage: true,
    omitTranspose: true,
};

},{"vega-lite/src/channel":12,"vega-lite/src/mark":15}],27:[function(require,module,exports){
var cpConsts = require('./consts');
var cluster_1 = require('./cluster/cluster');
var cpGen = require('./gen/gen');
var cpRank = require('./rank/rank');
var cpUtil = require('./util');
var cpTrans = require('./trans/trans');
exports.consts = cpConsts;
exports.cluster = cluster_1.default;
exports.gen = cpGen;
exports.rank = cpRank;
exports.util = cpUtil;
exports.trans = cpTrans;
exports.auto = '-, sum';
exports.version = '0.7.0';

},{"./cluster/cluster":23,"./consts":26,"./gen/gen":30,"./rank/rank":34,"./trans/trans":38,"./util":39}],28:[function(require,module,exports){
'use strict';
var vlFieldDef = require('vega-lite/src/fielddef');
var vlShorthand = require('vega-lite/src/shorthand');
var type_1 = require('vega-lite/src/type');
var aggregate_1 = require('vega-lite/src/aggregate');
var util = require('../util');
var consts_1 = require('../consts');
var AUTO = '*';
function genAggregates(output, fieldDefs, stats, opt) {
    if (opt === void 0) { opt = {}; }
    opt = util.extend({}, consts_1.DEFAULT_AGGREGATION_OPTIONS, opt);
    var tf = new Array(fieldDefs.length);
    var hasNorO = util.any(fieldDefs, function (f) {
        return f.type === type_1.Type.NOMINAL || f.type === type_1.Type.ORDINAL;
    });
    function emit(fieldSet) {
        fieldSet = util.duplicate(fieldSet);
        fieldSet.key = fieldSet.map(function (fieldDef) {
            return vlShorthand.shortenFieldDef(fieldDef);
        }).join(vlShorthand.DELIM);
        output.push(fieldSet);
    }
    function checkAndPush() {
        if (opt.omitMeasureOnly || opt.omitDimensionOnly) {
            var hasMeasure = false, hasDimension = false, hasRaw = false;
            tf.forEach(function (f) {
                if (vlFieldDef.isDimension(f)) {
                    hasDimension = true;
                }
                else {
                    hasMeasure = true;
                    if (!f.aggregate) {
                        hasRaw = true;
                    }
                }
            });
            if (!hasDimension && !hasRaw && opt.omitMeasureOnly) {
                return;
            }
            if (!hasMeasure) {
                if (opt.addCountForDimensionOnly) {
                    tf.push(vlFieldDef.count());
                    emit(tf);
                    tf.pop();
                }
                if (opt.omitDimensionOnly) {
                    return;
                }
            }
        }
        if (opt.omitDotPlot && tf.length === 1) {
            return;
        }
        emit(tf);
    }
    function assignAggrQ(i, hasAggr, autoMode, a) {
        var canHaveAggr = hasAggr === true || hasAggr === null, cantHaveAggr = hasAggr === false || hasAggr === null;
        if (a) {
            if (canHaveAggr) {
                tf[i].aggregate = a;
                assignField(i + 1, true, autoMode);
                delete tf[i].aggregate;
            }
        }
        else {
            if (cantHaveAggr) {
                assignField(i + 1, false, autoMode);
            }
        }
    }
    function assignBinQ(i, hasAggr, autoMode) {
        tf[i].bin = true;
        assignField(i + 1, hasAggr, autoMode);
        delete tf[i].bin;
    }
    function assignQ(i, hasAggr, autoMode) {
        var f = fieldDefs[i], canHaveAggr = hasAggr === true || hasAggr === null;
        tf[i] = { field: f.field, type: f.type };
        if (f.aggregate === aggregate_1.AggregateOp.COUNT) {
            if (canHaveAggr) {
                tf[i].aggregate = f.aggregate;
                assignField(i + 1, true, autoMode);
            }
        }
        else if (f._aggregate) {
            assignAggrQ(i, hasAggr, autoMode, f._aggregate);
        }
        else if (f._raw) {
            assignAggrQ(i, hasAggr, autoMode, undefined);
        }
        else if (f._bin) {
            assignBinQ(i, hasAggr, autoMode);
        }
        else {
            opt.aggrList.forEach(function (a) {
                if (!opt.consistentAutoQ || autoMode === AUTO || autoMode === a) {
                    assignAggrQ(i, hasAggr, a, a);
                }
            });
            if ((!opt.consistentAutoQ || util.isin(autoMode, [AUTO, 'bin', 'cast', 'autocast'])) && !hasNorO) {
                var highCardinality = vlFieldDef.cardinality(f, stats) > opt.minCardinalityForBin;
                var isAuto = opt.genDimQ === consts_1.QuantitativeDimensionType.AUTO, genBin = opt.genDimQ === consts_1.QuantitativeDimensionType.BIN || (isAuto && highCardinality), genCast = opt.genDimQ === consts_1.QuantitativeDimensionType.CAST || (isAuto && !highCardinality);
                if (genBin && util.isin(autoMode, [AUTO, 'bin', 'autocast'])) {
                    assignBinQ(i, hasAggr, isAuto ? 'autocast' : 'bin');
                }
                if (genCast && util.isin(autoMode, [AUTO, 'cast', 'autocast'])) {
                    tf[i].type = type_1.Type.ORDINAL;
                    assignField(i + 1, hasAggr, isAuto ? 'autocast' : 'cast');
                    tf[i].type = type_1.Type.QUANTITATIVE;
                }
            }
        }
    }
    function assignTimeUnitT(i, hasAggr, autoMode, timeUnit) {
        tf[i].timeUnit = timeUnit;
        assignField(i + 1, hasAggr, autoMode);
        delete tf[i].timeUnit;
    }
    function assignT(i, hasAggr, autoMode) {
        var f = fieldDefs[i];
        tf[i] = { field: f.field, type: f.type };
        if (f._timeUnit) {
            assignTimeUnitT(i, hasAggr, autoMode, f._timeUnit);
        }
        else {
            opt.timeUnitList.forEach(function (timeUnit) {
                if (timeUnit === undefined) {
                    if (!hasAggr) {
                        assignField(i + 1, false, autoMode);
                    }
                }
                else {
                    assignTimeUnitT(i, hasAggr, autoMode, timeUnit);
                }
            });
        }
    }
    function assignField(i, hasAggr, autoMode) {
        if (i === fieldDefs.length) {
            checkAndPush();
            return;
        }
        var f = fieldDefs[i];
        switch (f.type) {
            case type_1.Type.QUANTITATIVE:
                assignQ(i, hasAggr, autoMode);
                break;
            case type_1.Type.TEMPORAL:
                assignT(i, hasAggr, autoMode);
                break;
            case type_1.Type.ORDINAL:
            case type_1.Type.NOMINAL:
            default:
                tf[i] = f;
                assignField(i + 1, hasAggr, autoMode);
                break;
        }
    }
    var hasAggr = opt.tableTypes === consts_1.TableType.AGGREGATED ? true :
        opt.tableTypes === consts_1.TableType.DISAGGREGATED ? false : null;
    assignField(0, hasAggr, AUTO);
    return output;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genAggregates;

},{"../consts":26,"../util":39,"vega-lite/src/aggregate":11,"vega-lite/src/fielddef":14,"vega-lite/src/shorthand":17,"vega-lite/src/type":20}],29:[function(require,module,exports){
var fielddef_1 = require('vega-lite/src/fielddef');
var encoding_1 = require('vega-lite/src/encoding');
var util_1 = require('../util');
var marks_1 = require('./marks');
var consts_1 = require('../consts');
var aggregate_1 = require('vega-lite/src/aggregate');
var channel_1 = require('vega-lite/src/channel');
var type_1 = require('vega-lite/src/type');
function genEncodings(encodings, fieldDefs, stats, opt) {
    if (opt === void 0) { opt = consts_1.DEFAULT_SPEC_OPTION; }
    var tmpEncoding = {};
    function assignField(i) {
        if (i === fieldDefs.length) {
            if (rule.encoding(tmpEncoding, stats, opt)) {
                encodings.push(util_1.duplicate(tmpEncoding));
            }
            return;
        }
        var fieldDef = fieldDefs[i];
        for (var j in opt.channelList) {
            var channel = opt.channelList[j], isDim = fielddef_1.isDimension(fieldDef);
            var supportedRole = channel_1.getSupportedRole(channel);
            if (!(channel in tmpEncoding) &&
                ((isDim && supportedRole.dimension) || (!isDim && supportedRole.measure)) &&
                rule.channel[channel](tmpEncoding, fieldDef, stats, opt)) {
                tmpEncoding[channel] = fieldDef;
                assignField(i + 1);
                delete tmpEncoding[channel];
            }
        }
    }
    assignField(0);
    return encodings;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genEncodings;
var rule;
(function (rule) {
    var channel;
    (function (channel) {
        channel.x = noRule;
        channel.y = noRule;
        channel.text = noRule;
        channel.detail = noRule;
        channel.size = retinalEncRules;
        channel.row = noRule;
        channel.column = noRule;
        function color(encoding, fieldDef, stats, opt) {
            if (!retinalEncRules(encoding, fieldDef, stats, opt)) {
                return false;
            }
            return fielddef_1.isMeasure(fieldDef) ||
                fielddef_1.cardinality(fieldDef, stats) <= opt.maxCardinalityForColor;
        }
        channel.color = color;
        function shape(encoding, fieldDef, stats, opt) {
            if (!retinalEncRules(encoding, fieldDef, stats, opt)) {
                return false;
            }
            if (opt.omitShapeWithBin && fieldDef.bin && fieldDef.type === type_1.Type.QUANTITATIVE) {
                return false;
            }
            if (opt.omitShapeWithTimeDimension && fieldDef.timeUnit && fieldDef.type === type_1.Type.TEMPORAL) {
                return false;
            }
            return fielddef_1.cardinality(fieldDef, stats) <= opt.maxCardinalityForShape;
        }
        channel.shape = shape;
        function noRule() { return true; }
        function retinalEncRules(encoding, fieldDef, stats, opt) {
            if (opt.omitMultipleNonPositionalChannels) {
                if (encoding.color || encoding.size || encoding.shape) {
                    return false;
                }
            }
            return true;
        }
    })(channel = rule.channel || (rule.channel = {}));
    function dotPlotRules(encoding, stats, opt) {
        if (opt.omitDotPlot) {
            return false;
        }
        if (opt.omitTranspose && encoding.y) {
            return false;
        }
        if (opt.omitDotPlotWithFacet && (encoding.row || encoding.column)) {
            return false;
        }
        if (opt.omitDotPlotWithExtraEncoding && util_1.keys(encoding).length > 1) {
            return false;
        }
        if (opt.omitDotPlotWithOnlyCount) {
            if (encoding.x && encoding.x.aggregate === aggregate_1.AggregateOp.COUNT && !encoding.y) {
                return false;
            }
            if (encoding.y && encoding.y.aggregate === aggregate_1.AggregateOp.COUNT && !encoding.x) {
                return false;
            }
        }
        return true;
    }
    function isAggrWithAllDimOnFacets(encoding) {
        var hasAggr = false, hasOtherO = false;
        for (var c in encoding) {
            var channel_2 = c;
            var fieldDef = encoding[channel_2];
            if (fieldDef.aggregate) {
                hasAggr = true;
            }
            if (fielddef_1.isDimension(fieldDef) && (channel_2 !== channel_1.ROW && channel_2 !== channel_1.COLUMN)) {
                hasOtherO = true;
            }
            if (hasAggr && hasOtherO) {
                break;
            }
        }
        return hasAggr && !hasOtherO;
    }
    ;
    function xyPlotRules(encoding, stats, opt) {
        if (encoding.row || encoding.column) {
            if (opt.omitNonTextAggrWithAllDimsOnFacets) {
                if (isAggrWithAllDimOnFacets(encoding)) {
                    return false;
                }
            }
        }
        var isDimX = fielddef_1.isDimension(encoding.x), isDimY = fielddef_1.isDimension(encoding.y);
        if (opt.omitRawWithXYBothDimension && isDimX && isDimY && !encoding_1.isAggregate(encoding)) {
            return false;
        }
        if (opt.omitTranspose) {
            if (isDimX !== isDimY) {
                if ((encoding.y.type === type_1.Type.NOMINAL || encoding.y.type === type_1.Type.ORDINAL) && fielddef_1.isMeasure(encoding.x)) {
                    return true;
                }
                if (!isDimY && isDimX && !(encoding.x.type === type_1.Type.NOMINAL || encoding.x.type === type_1.Type.ORDINAL)) {
                    return true;
                }
                return false;
            }
            else if (encoding.y.type === type_1.Type.TEMPORAL || encoding.x.type === type_1.Type.TEMPORAL) {
                if (encoding.y.type === type_1.Type.TEMPORAL && encoding.x.type !== type_1.Type.TEMPORAL) {
                    return false;
                }
            }
            else {
                if (encoding.x.field > encoding.y.field) {
                    return false;
                }
            }
        }
        return true;
    }
    function encoding(encoding, stats, opt) {
        if (encoding.text) {
            return marks_1.rule.text(encoding, stats, opt);
        }
        var hasX = !!encoding.x, hasY = !!encoding.y;
        if (hasX !== hasY) {
            return dotPlotRules(encoding, stats, opt);
        }
        else if (hasX && hasY) {
            return xyPlotRules(encoding, stats, opt);
        }
        return false;
    }
    rule.encoding = encoding;
})(rule || (rule = {}));

},{"../consts":26,"../util":39,"./marks":31,"vega-lite/src/aggregate":11,"vega-lite/src/channel":12,"vega-lite/src/encoding":13,"vega-lite/src/fielddef":14,"vega-lite/src/type":20}],30:[function(require,module,exports){
'use strict';
var aggregates_1 = require('./aggregates');
var projections_1 = require('./projections');
var projections_2 = require('./projections');
var specs_1 = require('./specs');
var encodings_1 = require('./encodings');
var marks_1 = require('./marks');
exports.aggregates = aggregates_1.default;
exports.projections = projections_1.default;
exports.projections.key = projections_2.key;
exports.specs = specs_1.default;
exports.encodings = encodings_1.default;
exports.marks = marks_1.default;

},{"./aggregates":28,"./encodings":29,"./marks":31,"./projections":32,"./specs":33}],31:[function(require,module,exports){
var encoding_1 = require('vega-lite/src/encoding');
var fielddef_1 = require('vega-lite/src/fielddef');
var validate_1 = require('vega-lite/src/validate');
var type_1 = require('vega-lite/src/type');
var scale_1 = require('vega-lite/src/scale');
var aggregate_1 = require('vega-lite/src/aggregate');
var util = require('../util');
function genMarks(encoding, stats, opt) {
    return opt.markList.filter(function (mark) {
        var noVlError = validate_1.getEncodingMappingError({
            mark: mark,
            encoding: encoding
        }) === null;
        return noVlError && rule[mark](encoding, stats, opt);
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genMarks;
var rule;
(function (rule) {
    function facetRule(fieldDef, stats, opt) {
        return fielddef_1.cardinality(fieldDef, stats) <= opt.maxCardinalityForFacets;
    }
    function facetsRule(encoding, stats, opt) {
        if (encoding.row && !facetRule(encoding.row, stats, opt))
            return false;
        if (encoding.column && !facetRule(encoding.column, stats, opt))
            return false;
        return true;
    }
    function point(encoding, stats, opt) {
        if (!facetsRule(encoding, stats, opt))
            return false;
        if (encoding.x && encoding.y) {
            var xIsDim = fielddef_1.isDimension(encoding.x), yIsDim = fielddef_1.isDimension(encoding.y);
            if (xIsDim && yIsDim) {
                if (encoding.shape) {
                    return false;
                }
                if (encoding.color && fielddef_1.isDimension(encoding.color)) {
                    return false;
                }
            }
        }
        else {
            if (opt.omitDotPlot)
                return false;
            if (opt.omitTranspose && encoding.y)
                return false;
            if (opt.omitDotPlotWithExtraEncoding && util.keys(encoding).length > 1)
                return false;
        }
        return true;
    }
    rule.point = point;
    function tick(encoding, stats, opt) {
        if (encoding.x || encoding.y) {
            if (encoding_1.isAggregate(encoding))
                return false;
            var xIsDim = fielddef_1.isDimension(encoding.x), yIsDim = fielddef_1.isDimension(encoding.y);
            return (!xIsDim && (!encoding.y || yIsDim)) ||
                (!yIsDim && (!encoding.x || xIsDim));
        }
        return false;
    }
    rule.tick = tick;
    function bar(encoding, stats, opt) {
        if (!facetsRule(encoding, stats, opt))
            return false;
        if (!encoding.x && !encoding.y)
            return false;
        if (opt.omitSizeOnBar && encoding.size !== undefined)
            return false;
        if (opt.omitLengthForLogScale) {
            if (encoding.x && encoding.x.scale && encoding.x.scale.type === scale_1.ScaleType.LOG)
                return false;
            if (encoding.y && encoding.y.scale && encoding.y.scale.type === scale_1.ScaleType.LOG)
                return false;
        }
        var aggEitherXorY = (!encoding.x || encoding.x.aggregate === undefined) !==
            (!encoding.y || encoding.y.aggregate === undefined);
        if (aggEitherXorY) {
            var eitherXorYisDimOrNull = (!encoding.x || fielddef_1.isDimension(encoding.x)) !==
                (!encoding.y || fielddef_1.isDimension(encoding.y));
            if (eitherXorYisDimOrNull) {
                var aggregate;
                if (encoding.x) {
                    aggregate = encoding.x.aggregate;
                }
                else {
                    aggregate = encoding.y.aggregate;
                }
                return !(opt.omitStackedAverage && aggregate === aggregate_1.AggregateOp.MEAN && encoding.color);
            }
        }
        return false;
    }
    rule.bar = bar;
    function line(encoding, stats, opt) {
        if (!facetsRule(encoding, stats, opt))
            return false;
        return encoding.x.type === type_1.Type.TEMPORAL && !!encoding.x.timeUnit &&
            encoding.y.type === type_1.Type.QUANTITATIVE && !!encoding.y.aggregate;
    }
    rule.line = line;
    function area(encoding, stats, opt) {
        if (!facetsRule(encoding, stats, opt))
            return false;
        if (!line(encoding, stats, opt))
            return false;
        if (opt.omitLengthForLogScale) {
            if (encoding.x && encoding.x.scale && encoding.x.scale.type === scale_1.ScaleType.LOG)
                return false;
            if (encoding.y && encoding.y.scale && encoding.y.scale.type === scale_1.ScaleType.LOG)
                return false;
        }
        return !(opt.omitStackedAverage && encoding.y.aggregate === aggregate_1.AggregateOp.MEAN && encoding.color);
    }
    rule.area = area;
    function text(encoding, stats, opt) {
        return (encoding.row || encoding.column) && encoding.text && encoding.text.aggregate && !encoding.x && !encoding.y && !encoding.size &&
            (!opt.alwaysGenerateTableAsHeatmap || !encoding.color);
    }
    rule.text = text;
})(rule = exports.rule || (exports.rule = {}));

},{"../util":39,"vega-lite/src/aggregate":11,"vega-lite/src/encoding":13,"vega-lite/src/fielddef":14,"vega-lite/src/scale":16,"vega-lite/src/type":20,"vega-lite/src/validate":22}],32:[function(require,module,exports){
var vlFieldDef = require('vega-lite/src/fielddef');
var util = require('../util');
var consts_1 = require('../consts');
var type_1 = require('vega-lite/src/type');
var isDimension = vlFieldDef.isDimension;
function projections(fieldDefs, stats, opt) {
    if (opt === void 0) { opt = {}; }
    opt = util.extend({}, consts_1.DEFAULT_PROJECTION_OPT, opt);
    var selected = [], fieldsToAdd = [], fieldSets = [];
    var hasSelectedDimension = false, hasSelectedMeasure = false;
    var indices = {};
    fieldDefs.forEach(function (fieldDef, index) {
        indices[fieldDef.field] = index;
        if (fieldDef.selected) {
            selected.push(fieldDef);
            if (isDimension(fieldDef) ||
                (fieldDef.type === type_1.TEMPORAL)) {
                hasSelectedDimension = true;
            }
            else {
                hasSelectedMeasure = true;
            }
        }
        else if (fieldDef.selected !== false && !vlFieldDef.isCount(fieldDef)) {
            if (vlFieldDef.isDimension(fieldDef) &&
                !opt.maxCardinalityForAutoAddOrdinal &&
                vlFieldDef.cardinality(fieldDef, stats, 15) > opt.maxCardinalityForAutoAddOrdinal) {
                return;
            }
            fieldsToAdd.push(fieldDef);
        }
    });
    fieldsToAdd.sort(compareFieldsToAdd(hasSelectedDimension, hasSelectedMeasure, indices));
    var setsToAdd = util.chooseKorLess(fieldsToAdd, opt.maxAdditionalVariables);
    setsToAdd.forEach(function (setToAdd) {
        var fieldSet = selected.concat(setToAdd);
        if (fieldSet.length > 0) {
            if (opt.omitDotPlot && fieldSet.length === 1) {
                return;
            }
            fieldSets.push(fieldSet);
        }
    });
    fieldSets.forEach(function (fieldSet) {
        fieldSet.key = key(fieldSet);
    });
    return fieldSets;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = projections;
var typeIsMeasureScore = {
    nominal: 0,
    ordinal: 0,
    temporal: 2,
    quantitative: 3
};
function compareFieldsToAdd(hasSelectedDimension, hasSelectedMeasure, indices) {
    return function (a, b) {
        if (a.type !== b.type) {
            if (!hasSelectedDimension) {
                return typeIsMeasureScore[a.type] - typeIsMeasureScore[b.type];
            }
            else {
                return typeIsMeasureScore[b.type] - typeIsMeasureScore[a.type];
            }
        }
        return indices[a.field] - indices[b.field];
    };
}
function key(projection) {
    return projection.map(function (fieldDef) {
        return vlFieldDef.isCount(fieldDef) ? 'count' : fieldDef.field;
    }).join(',');
}
exports.key = key;
;

},{"../consts":26,"../util":39,"vega-lite/src/fielddef":14,"vega-lite/src/type":20}],33:[function(require,module,exports){
'use strict';
var vlFieldDef = require('vega-lite/src/fielddef');
var util = require('../util');
var consts_1 = require('../consts');
var encodings_1 = require('./encodings');
var marks_1 = require('./marks');
var rank = require('../rank/rank');
var shorthand_1 = require('vega-lite/src/shorthand');
function genSpecsFromFieldDefs(output, fieldDefs, stats, opt, nested) {
    if (opt === void 0) { opt = {}; }
    opt = util.extend({}, consts_1.DEFAULT_SPEC_OPTION, opt);
    var encodings = encodings_1.default([], fieldDefs, stats, opt);
    if (nested) {
        return encodings.reduce(function (dict, encoding) {
            var encodingShorthand = shorthand_1.shortenEncoding(encoding);
            dict[encodingShorthand] = genSpecsFromEncodings([], encoding, stats, opt);
            return dict;
        }, {});
    }
    else {
        return encodings.reduce(function (list, encoding) {
            return genSpecsFromEncodings(list, encoding, stats, opt);
        }, output);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genSpecsFromFieldDefs;
function genSpecsFromEncodings(output, encoding, stats, opt) {
    marks_1.default(encoding, stats, opt)
        .forEach(function (mark) {
        var spec = util.duplicate({
            encoding: encoding,
            config: opt.config
        });
        spec.mark = mark;
        spec.data = opt.data;
        spec = finalTouch(spec, stats, opt);
        var score = rank.encoding(spec, stats, opt);
        spec._info = score;
        output.push(spec);
    });
    return output;
}
function finalTouch(spec, stats, opt) {
    if (spec.mark === 'text' && opt.alwaysGenerateTableAsHeatmap) {
        spec.encoding.color = spec.encoding.text;
    }
    var encoding = spec.encoding;
    ['x', 'y'].forEach(function (channel) {
        var fieldDef = encoding[channel];
        if (fieldDef && vlFieldDef.isMeasure(fieldDef) && !vlFieldDef.isCount(fieldDef)) {
            var stat = stats[fieldDef.field];
            if (stat && stat.stdev / stat.mean < 0.01) {
                fieldDef.scale = { zero: false };
            }
        }
    });
    return spec;
}

},{"../consts":26,"../rank/rank":34,"../util":39,"./encodings":29,"./marks":31,"vega-lite/src/fielddef":14,"vega-lite/src/shorthand":17}],34:[function(require,module,exports){
var rankEncodings_1 = require('./rankEncodings');
exports.encoding = rankEncodings_1.default;

},{"./rankEncodings":35}],35:[function(require,module,exports){
'use strict';
var vlEncoding = require('vega-lite/src/encoding');
var vlFieldDef = require('vega-lite/src/fielddef');
var vlChannel = require('vega-lite/src/channel');
var isDimension = vlFieldDef.isDimension;
var util = require('../util');
var vlShorthand = require('vega-lite/src/shorthand');
var type_1 = require('vega-lite/src/type');
var mark_1 = require('vega-lite/src/mark');
var UNUSED_POSITION = 0.5;
var MARK_SCORE = {
    line: 0.99,
    area: 0.98,
    bar: 0.97,
    tick: 0.96,
    point: 0.95,
    circle: 0.94,
    square: 0.94,
    text: 0.8
};
var D = {}, M = {}, BAD = 0.1, TERRIBLE = 0.01;
D.minor = 0.01;
D.pos = 1;
D.Y_T = 0.8;
D.facet_text = 1;
D.facet_good = 0.675;
D.facet_ok = 0.55;
D.facet_bad = 0.4;
D.color_good = 0.7;
D.color_ok = 0.65;
D.color_bad = 0.3;
D.color_stack = 0.6;
D.shape = 0.6;
D.detail = 0.5;
D.bad = BAD;
D.terrible = TERRIBLE;
M.pos = 1;
M.size = 0.6;
M.color = 0.5;
M.text = 0.4;
M.bad = BAD;
M.terrible = TERRIBLE;
exports.dimensionScore = function (fieldDef, channel, mark, stats, opt) {
    var cardinality = vlFieldDef.cardinality(fieldDef, stats);
    switch (channel) {
        case vlChannel.X:
            if (fieldDef.type === type_1.Type.NOMINAL || fieldDef.type === type_1.Type.ORDINAL) {
                return D.pos - D.minor;
            }
            return D.pos;
        case vlChannel.Y:
            if (fieldDef.type === type_1.Type.NOMINAL || fieldDef.type === type_1.Type.ORDINAL) {
                return D.pos - D.minor;
            }
            if (fieldDef.type === type_1.Type.TEMPORAL) {
                return D.Y_T;
            }
            return D.pos - D.minor;
        case vlChannel.COLUMN:
            if (mark === 'text')
                return D.facet_text;
            return cardinality <= opt.maxGoodCardinalityForFacets ? D.facet_good :
                cardinality <= opt.maxCardinalityForFacets ? D.facet_ok : D.facet_bad;
        case vlChannel.ROW:
            if (mark === 'text')
                return D.facet_text;
            return (cardinality <= opt.maxGoodCardinalityForFacets ? D.facet_good :
                cardinality <= opt.maxCardinalityForFacets ? D.facet_ok : D.facet_bad) - D.minor;
        case vlChannel.COLOR:
            var hasOrder = (fieldDef.bin && fieldDef.type === type_1.Type.QUANTITATIVE) || (fieldDef.timeUnit && fieldDef.type === type_1.Type.TEMPORAL);
            var isStacked = mark === mark_1.Mark.BAR || mark === mark_1.Mark.AREA;
            if (hasOrder)
                return D.color_bad;
            if (isStacked)
                return D.color_stack;
            return cardinality <= opt.maxGoodCardinalityForColor ? D.color_good : cardinality <= opt.maxCardinalityForColor ? D.color_ok : D.color_bad;
        case vlChannel.SHAPE:
            return cardinality <= opt.maxCardinalityForShape ? D.shape : TERRIBLE;
        case vlChannel.DETAIL:
            return D.detail;
    }
    return TERRIBLE;
};
exports.dimensionScore.consts = D;
exports.measureScore = function (fieldDef, channel, mark, stats, opt) {
    switch (channel) {
        case vlChannel.X: return M.pos;
        case vlChannel.Y: return M.pos;
        case vlChannel.SIZE:
            if (mark === mark_1.Mark.BAR || mark === mark_1.Mark.TEXT || mark === mark_1.Mark.LINE) {
                return BAD;
            }
            return M.size;
        case vlChannel.COLOR: return M.color;
        case vlChannel.TEXT: return M.text;
    }
    return BAD;
};
exports.measureScore.consts = M;
function rankEncodings(spec, stats, opt, selected) {
    var features = [], channels = util.keys(spec.encoding), mark = spec.mark, encoding = spec.encoding;
    var encodingMappingByField = vlEncoding.reduce(spec.encoding, function (o, fieldDef, channel) {
        var key = vlShorthand.shortenFieldDef(fieldDef);
        var mappings = o[key] = o[key] || [];
        mappings.push({ channel: channel, fieldDef: fieldDef });
        return o;
    }, {});
    util.forEach(encodingMappingByField, function (mappings) {
        var reasons = mappings.map(function (m) {
            return m.channel + vlShorthand.ASSIGN + vlShorthand.shortenFieldDef(m.fieldDef) +
                ' ' + (selected && selected[m.fieldDef.field] ? '[x]' : '[ ]');
        }), scores = mappings.map(function (m) {
            var roleScore = vlFieldDef.isDimension(m.fieldDef) ?
                exports.dimensionScore : exports.measureScore;
            var score = roleScore(m.fieldDef, m.channel, spec.mark, stats, opt);
            return !selected || selected[m.fieldDef.field] ? score : Math.pow(score, 0.125);
        });
        features.push({
            reason: reasons.join(' | '),
            score: Math.max.apply(null, scores)
        });
    });
    if (mark === 'text') {
    }
    else {
        if (encoding.x && encoding.y) {
            if (isDimension(encoding.x) !== isDimension(encoding.y)) {
                features.push({
                    reason: 'OxQ plot',
                    score: 0.8
                });
            }
        }
    }
    if (channels.length > 1 && mark !== mark_1.Mark.TEXT) {
        if ((!encoding.x || !encoding.y) && !encoding.geo && !encoding.text) {
            features.push({
                reason: 'unused position',
                score: UNUSED_POSITION
            });
        }
    }
    features.push({
        reason: 'mark=' + mark,
        score: MARK_SCORE[mark]
    });
    return {
        score: features.reduce(function (p, f) {
            return p * f.score;
        }, 1),
        features: features
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = rankEncodings;

},{"../util":39,"vega-lite/src/channel":12,"vega-lite/src/encoding":13,"vega-lite/src/fielddef":14,"vega-lite/src/mark":15,"vega-lite/src/shorthand":17,"vega-lite/src/type":20}],36:[function(require,module,exports){
exports.DEFAULT_MARKTYPE_TRANSITIONS = {
    AREA_BAR: { name: 'AREA_BAR', cost: 1 },
    AREA_LINE: { name: 'AREA_LINE', cost: 1 },
    AREA_POINT: { name: 'AREA_POINT', cost: 1 },
    AREA_TEXT: { name: 'AREA_TEXT', cost: 1 },
    AREA_TICK: { name: 'AREA_TICK', cost: 1 },
    BAR_LINE: { name: 'BAR_LINE', cost: 1 },
    BAR_POINT: { name: 'BAR_POINT', cost: 1 },
    BAR_TEXT: { name: 'BAR_TEXT', cost: 1 },
    BAR_TICK: { name: 'BAR_TICK', cost: 1 },
    LINE_POINT: { name: 'LINE_POINT', cost: 1 },
    LINE_TEXT: { name: 'LINE_TEXT', cost: 1 },
    LINE_TICK: { name: 'LINE_TICK', cost: 1 },
    POINT_TEXT: { name: 'POINT_TEXT', cost: 1 },
    POINT_TICK: { name: 'POINT_TICK', cost: 1 },
    TEXT_TICK: { name: 'TEXT_TICK', cost: 1 }
};
exports.DEFAULT_MARKTYPE_TRANSITION_LIST = [
    "AREA_BAR",
    "AREA_LINE",
    "AREA_POINT",
    "AREA_TEXT",
    "AREA_TICK",
    "BAR_LINE",
    "BAR_POINT",
    "BAR_TEXT",
    "BAR_TICK",
    "LINE_POINT",
    "LINE_TEXT",
    "LINE_TICK",
    "POINT_TEXT",
    "POINT_TICK",
    "TEXT_TICK"];
exports.DEFAULT_TRANSFORM_TRANSITIONS = {
    SCALE: { name: 'SCALE', cost: 1 },
    SORT: { name: 'SORT', cost: 1 },
    BIN: { name: 'BIN', cost: 1 },
    AGGREGATE: { name: 'AGGREGATE', cost: 1 },
    FILTER: { name: 'FILTER', cost: 1 },
    SETTYPE: { name: 'SETTYPE', cost: 1 }
};
exports.DEFAULT_TRANSFORM_TRANSITION_LIST = [
    "SCALE",
    "SORT",
    "BIN",
    "AGGREGATE",
    "FILTER",
    "SETTYPE"
];
exports.CHANNELS_WITH_TRANSITION_ORDER = [
    "x", "y", "color", "shape", "size", "row", "column", "text"
];
exports.DEFAULT_ENCODING_TRANSITIONS = {
    ADD_X: { name: 'ADD_X', cost: 1 },
    ADD_Y: { name: 'ADD_Y', cost: 1 },
    ADD_COLOR: { name: 'ADD_COLOR', cost: 1 },
    ADD_SHAPE: { name: 'ADD_SHAPE', cost: 1 },
    ADD_SIZE: { name: 'ADD_SIZE', cost: 1 },
    ADD_ROW: { name: 'ADD_ROW', cost: 1 },
    ADD_COLUMN: { name: 'ADD_COLUMN', cost: 1 },
    ADD_X_COUNT: { name: 'ADD_X_COUNT', cost: 1 },
    ADD_Y_COUNT: { name: 'ADD_Y_COUNT', cost: 1 },
    ADD_COLOR_COUNT: { name: 'ADD_COLOR_COUNT', cost: 1 },
    ADD_SHAPE_COUNT: { name: 'ADD_SHAPE_COUNT', cost: 1 },
    ADD_SIZE_COUNT: { name: 'ADD_SIZE_COUNT', cost: 1 },
    ADD_ROW_COUNT: { name: 'ADD_ROW_COUNT', cost: 1 },
    ADD_COLUMN_COUNT: { name: 'ADD_COLUMN_COUNT', cost: 1 },
    REMOVE_X_COUNT: { name: 'REMOVE_X_COUNT', cost: 1 },
    REMOVE_Y_COUNT: { name: 'REMOVE_Y_COUNT', cost: 1 },
    REMOVE_COLOR_COUNT: { name: 'REMOVE_COLOR_COUNT', cost: 1 },
    REMOVE_SHAPE_COUNT: { name: 'REMOVE_SHAPE_COUNT', cost: 1 },
    REMOVE_SIZE_COUNT: { name: 'REMOVE_SIZE_COUNT', cost: 1 },
    REMOVE_ROW_COUNT: { name: 'REMOVE_ROW_COUNT', cost: 1 },
    REMOVE_COLUMN_COUNT: { name: 'REMOVE_COLUMN_COUNT', cost: 1 },
    REMOVE_X: { name: 'REMOVE_X', cost: 1 },
    REMOVE_Y: { name: 'REMOVE_Y', cost: 1 },
    REMOVE_COLOR: { name: 'REMOVE_COLOR', cost: 1 },
    REMOVE_SHAPE: { name: 'REMOVE_SHAPE', cost: 1 },
    REMOVE_SIZE: { name: 'REMOVE_SIZE', cost: 1 },
    REMOVE_ROW: { name: 'REMOVE_ROW', cost: 1 },
    REMOVE_COLUMN: { name: 'REMOVE_COLUMN', cost: 1 },
    MODIFY_X: { name: 'MODIFY_X', cost: 1 },
    MODIFY_Y: { name: 'MODIFY_Y', cost: 1 },
    MODIFY_COLOR: { name: 'MODIFY_COLOR', cost: 1 },
    MODIFY_SHAPE: { name: 'MODIFY_SHAPE', cost: 1 },
    MODIFY_SIZE: { name: 'MODIFY_SIZE', cost: 1 },
    MODIFY_ROW: { name: 'MODIFY_ROW', cost: 1 },
    MODIFY_COLUMN: { name: 'MODIFY_COLUMN', cost: 1 },
    MODIFY_X_ADD_COUNT: { name: 'MODIFY_X_ADD_COUNT', cost: 1 },
    MODIFY_Y_ADD_COUNT: { name: 'MODIFY_Y_ADD_COUNT', cost: 1 },
    MODIFY_COLOR_ADD_COUNT: { name: 'MODIFY_COLOR_ADD_COUNT', cost: 1 },
    MODIFY_SHAPE_ADD_COUNT: { name: 'MODIFY_SHAPE_ADD_COUNT', cost: 1 },
    MODIFY_SIZE_ADD_COUNT: { name: 'MODIFY_SIZE_ADD_COUNT', cost: 1 },
    MODIFY_ROW_ADD_COUNT: { name: 'MODIFY_ROW_ADD_COUNT', cost: 1 },
    MODIFY_COLUMN_ADD_COUNT: { name: 'MODIFY_COLUMN_ADD_COUNT', cost: 1 },
    MODIFY_X_REMOVE_COUNT: { name: 'MODIFY_X_REMOVE_COUNT', cost: 1 },
    MODIFY_Y_REMOVE_COUNT: { name: 'MODIFY_Y_REMOVE_COUNT', cost: 1 },
    MODIFY_COLOR_REMOVE_COUNT: { name: 'MODIFY_COLOR_REMOVE_COUNT', cost: 1 },
    MODIFY_SHAPE_REMOVE_COUNT: { name: 'MODIFY_SHAPE_REMOVE_COUNT', cost: 1 },
    MODIFY_SIZE_REMOVE_COUNT: { name: 'MODIFY_SIZE_REMOVE_COUNT', cost: 1 },
    MODIFY_ROW_REMOVE_COUNT: { name: 'MODIFY_ROW_REMOVE_COUNT', cost: 1 },
    MODIFY_COLUMN_REMOVE_COUNT: { name: 'MODIFY_COLUMN_REMOVE_COUNT', cost: 1 },
    MOVE_X_COLUMN: { name: 'MOVE_X_COLUMN', cost: 1 },
    MOVE_X_ROW: { name: 'MOVE_X_ROW', cost: 1 },
    MOVE_X_SIZE: { name: 'MOVE_X_SIZE', cost: 1 },
    MOVE_X_SHAPE: { name: 'MOVE_X_SHAPE', cost: 1 },
    MOVE_X_COLOR: { name: 'MOVE_X_COLOR', cost: 1 },
    MOVE_X_Y: { name: 'MOVE_X_Y', cost: 1 },
    MOVE_Y_COLUMN: { name: 'MOVE_Y_COLUMN', cost: 1 },
    MOVE_Y_ROW: { name: 'MOVE_Y_ROW', cost: 1 },
    MOVE_Y_SIZE: { name: 'MOVE_Y_SIZE', cost: 1 },
    MOVE_Y_SHAPE: { name: 'MOVE_Y_SHAPE', cost: 1 },
    MOVE_Y_COLOR: { name: 'MOVE_Y_COLOR', cost: 1 },
    MOVE_Y_X: { name: 'MOVE_Y_X', cost: 1 },
    MOVE_COLOR_COLUMN: { name: 'MOVE_COLOR_COLUMN', cost: 1 },
    MOVE_COLOR_ROW: { name: 'MOVE_COLOR_ROW', cost: 1 },
    MOVE_COLOR_SIZE: { name: 'MOVE_COLOR_SIZE', cost: 1 },
    MOVE_COLOR_SHAPE: { name: 'MOVE_COLOR_SHAPE', cost: 1 },
    MOVE_COLOR_Y: { name: 'MOVE_COLOR_Y', cost: 1 },
    MOVE_COLOR_X: { name: 'MOVE_COLOR_X', cost: 1 },
    MOVE_SHAPE_COLUMN: { name: 'MOVE_SHAPE_COLUMN', cost: 1 },
    MOVE_SHAPE_ROW: { name: 'MOVE_SHAPE_ROW', cost: 1 },
    MOVE_SHAPE_SIZE: { name: 'MOVE_SHAPE_SIZE', cost: 1 },
    MOVE_SHAPE_COLOR: { name: 'MOVE_SHAPE_COLOR', cost: 1 },
    MOVE_SHAPE_Y: { name: 'MOVE_SHAPE_Y', cost: 1 },
    MOVE_SHAPE_X: { name: 'MOVE_SHAPE_X', cost: 1 },
    MOVE_SIZE_COLUMN: { name: 'MOVE_SIZE_COLUMN', cost: 1 },
    MOVE_SIZE_ROW: { name: 'MOVE_SIZE_ROW', cost: 1 },
    MOVE_SIZE_SHAPE: { name: 'MOVE_SIZE_SHAPE', cost: 1 },
    MOVE_SIZE_COLOR: { name: 'MOVE_SIZE_COLOR', cost: 1 },
    MOVE_SIZE_Y: { name: 'MOVE_SIZE_Y', cost: 1 },
    MOVE_SIZE_X: { name: 'MOVE_SIZE_X', cost: 1 },
    MOVE_ROW_COLUMN: { name: 'MOVE_ROW_COLUMN', cost: 1 },
    MOVE_ROW_SIZE: { name: 'MOVE_ROW_SIZE', cost: 1 },
    MOVE_ROW_SHAPE: { name: 'MOVE_ROW_SHAPE', cost: 1 },
    MOVE_ROW_COLOR: { name: 'MOVE_ROW_COLOR', cost: 1 },
    MOVE_ROW_Y: { name: 'MOVE_ROW_Y', cost: 1 },
    MOVE_ROW_X: { name: 'MOVE_ROW_X', cost: 1 },
    MOVE_COLUMN_ROW: { name: 'MOVE_COLUMN_ROW', cost: 1 },
    MOVE_COLUMN_SIZE: { name: 'MOVE_COLUMN_SIZE', cost: 1 },
    MOVE_COLUMN_SHAPE: { name: 'MOVE_COLUMN_SHAPE', cost: 1 },
    MOVE_COLUMN_COLOR: { name: 'MOVE_COLUMN_COLOR', cost: 1 },
    MOVE_COLUMN_Y: { name: 'MOVE_COLUMN_Y', cost: 1 },
    MOVE_COLUMN_X: { name: 'MOVE_COLUMN_X', cost: 1 },
    SWAP_X_Y: { name: 'SWAP_X_Y', cost: 1 },
    SWAP_ROW_COLUMN: { name: 'SWAP_ROW_COLUMN', cost: 1 }
};
exports.TRANSITIONS = { marktypeTransitions: exports.DEFAULT_MARKTYPE_TRANSITIONS, transformTransitions: exports.DEFAULT_TRANSFORM_TRANSITIONS, encodingTransitions: exports.DEFAULT_ENCODING_TRANSITIONS };

},{}],37:[function(require,module,exports){
var util = require('../util');
var def = require('./def');
function neighbors(spec, additionalFields, additionalChannels, importedEncodingTransitions) {
    var neighbors = [];
    var encodingTransitions = importedEncodingTransitions || def.DEFAULT_ENCODING_TRANSITIONS;
    var inChannels = util.keys(spec.encoding);
    var exChannels = additionalChannels;
    inChannels.forEach(function (channel) {
        var newNeighbor = util.duplicate(spec);
        var transitionType = "REMOVE_" + channel.toUpperCase();
        transitionType += (spec.encoding[channel].field === "*") ? "_COUNT" : "";
        var transition = encodingTransitions[transitionType];
        var newAdditionalFields = util.duplicate(additionalFields);
        newAdditionalFields.push(newNeighbor.encoding[channel]);
        var newAdditionalChannels = util.duplicate(additionalChannels);
        newAdditionalChannels.push(channel);
        delete newNeighbor.encoding[channel];
        if (validate(newNeighbor)) {
            newNeighbor.transition = transition;
            newNeighbor.additionalFields = newAdditionalFields;
            newNeighbor.additionalChannels = newAdditionalChannels;
            neighbors.push(newNeighbor);
        }
        ;
        additionalFields.forEach(function (field, index) {
            newNeighbor = util.duplicate(spec);
            transitionType = "MODIFY_" + channel.toUpperCase();
            if (spec.encoding[channel].field === "*" && field.field !== "*") {
                transitionType += "_REMOVE_COUNT";
            }
            else if (spec.encoding[channel].field !== "*" && field.field === "*") {
                transitionType += "_ADD_COUNT";
            }
            transition = encodingTransitions[transitionType];
            newAdditionalFields = util.duplicate(additionalFields);
            newAdditionalFields.splice(index, 1);
            newAdditionalFields.push(newNeighbor.encoding[channel]);
            newAdditionalChannels = util.duplicate(additionalChannels);
            newNeighbor.encoding[channel] = field;
            if (validate(newNeighbor)) {
                newNeighbor.transition = transition;
                newNeighbor.additionalFields = newAdditionalFields;
                newNeighbor.additionalChannels = newAdditionalChannels;
                neighbors.push(newNeighbor);
            }
            ;
        });
        inChannels.forEach(function (anotherChannel) {
            if (anotherChannel === channel
                || (["x", "y"].indexOf(channel) < 0 || ["x", "y"].indexOf(anotherChannel) < 0)) {
                return;
            }
            newNeighbor = util.duplicate(spec);
            transition = encodingTransitions["SWAP_X_Y"];
            newAdditionalFields = util.duplicate(additionalFields);
            newAdditionalChannels = util.duplicate(additionalChannels);
            var tempChannel = util.duplicate(newNeighbor.encoding[channel]);
            newNeighbor.encoding[channel] = newNeighbor.encoding[anotherChannel];
            newNeighbor.encoding[anotherChannel] = tempChannel;
            if (validate(newNeighbor)) {
                newNeighbor.transition = transition;
                newNeighbor.additionalFields = newAdditionalFields;
                newNeighbor.additionalChannels = newAdditionalChannels;
                neighbors.push(newNeighbor);
            }
            ;
        });
        exChannels.forEach(function (exChannel, index) {
            newNeighbor = util.duplicate(spec);
            var newNeighborChannels = (channel + "_" + exChannel).toUpperCase();
            transition = encodingTransitions["MOVE_" + newNeighborChannels];
            newAdditionalFields = util.duplicate(additionalFields);
            newAdditionalChannels = util.duplicate(additionalChannels);
            newAdditionalChannels.splice(index, 1);
            newAdditionalChannels.push(channel);
            newNeighbor.encoding[exChannel] = util.duplicate(newNeighbor.encoding[channel]);
            delete newNeighbor.encoding[channel];
            if (validate(newNeighbor)) {
                newNeighbor.transition = transition;
                newNeighbor.additionalFields = newAdditionalFields;
                newNeighbor.additionalChannels = newAdditionalChannels;
                neighbors.push(newNeighbor);
            }
            ;
        });
    });
    exChannels.forEach(function (channel, chIndex) {
        additionalFields.forEach(function (field, index) {
            var newNeighbor = util.duplicate(spec);
            var transitionType = "ADD_" + channel.toUpperCase();
            transitionType += (field.field === "*") ? "_COUNT" : "";
            var transition = encodingTransitions[transitionType];
            var newAdditionalFields = util.duplicate(additionalFields);
            var newAdditionalChannels = util.duplicate(additionalChannels);
            newAdditionalFields.splice(index, 1);
            newNeighbor.encoding[channel] = field;
            newAdditionalChannels.splice(chIndex, 1);
            if (validate(newNeighbor)) {
                newNeighbor.transition = transition;
                newNeighbor.additionalFields = newAdditionalFields;
                newNeighbor.additionalChannels = newAdditionalChannels;
                neighbors.push(newNeighbor);
            }
            ;
        });
    });
    for (var i = 0; i < neighbors.length; i += 1) {
        for (var j = i + 1; j < neighbors.length; j += 1) {
            if (sameEncoding(neighbors[i].encoding, neighbors[j].encoding)) {
                neighbors.splice(j, 1);
                j -= 1;
            }
        }
    }
    return neighbors;
}
exports.neighbors = neighbors;
function validate(spec) {
    return true;
}
function sameEncoding(a, b) {
    var aKeys = util.keys(a);
    var bKeys = util.keys(b);
    if (aKeys.length !== bKeys.length) {
        return false;
    }
    var allKeys = util.union(aKeys, bKeys);
    for (var i = 0; i < allKeys.length; i += 1) {
        var key = allKeys[i];
        if (!(a[key] && b[key])) {
            return false;
        }
        if (a[key].field !== b[key].field) {
            return false;
        }
    }
    return true;
}
exports.sameEncoding = sameEncoding;

},{"../util":39,"./def":36}],38:[function(require,module,exports){
"use strict";
var channel_1 = require('vega-lite/src/channel');
var util = require('../util');
var def = require('./def');
var nb = require('./neighbor');
function transitionCost(s, d, importedTransitionCosts) {
    var transitions = transitionSet(s, d, importedTransitionCosts);
    var cost = 0;
    cost = transitions.marktype.reduce(function (prev, transition) {
        prev += transition.cost;
        return prev;
    }, cost);
    cost = transitions.transform.reduce(function (prev, transition) {
        prev += transition.cost;
        return prev;
    }, cost);
    cost = transitions.encoding.reduce(function (prev, transition) {
        prev += transition.cost;
        return prev;
    }, cost);
    return cost;
}
exports.transitionCost = transitionCost;
function transitionSet(s, d, importedTransitionCosts, transOptions) {
    var importedMarktypeTransitions = importedTransitionCosts ? importedTransitionCosts.marktypeTransitions : def.DEFAULT_MARKTYPE_TRANSITIONS;
    var importedTransformTransitions = importedTransitionCosts ? importedTransitionCosts.transformTransitions : def.DEFAULT_TRANSFORM_TRANSITIONS;
    var importedEncodingTransitions = importedTransitionCosts ? importedTransitionCosts.encodingTransitions : def.DEFAULT_ENCODING_TRANSITIONS;
    var transitions = {
        marktype: marktypeTransitionSet(s, d, importedMarktypeTransitions),
        transform: transformTransitionSet(s, d, importedTransformTransitions, transOptions),
        encoding: encodingTransitionSet(s, d, importedEncodingTransitions)
    };
    var cost = 0;
    cost = transitions.marktype.reduce(function (prev, transition) {
        prev += transition.cost;
        return prev;
    }, cost);
    cost = transitions.transform.reduce(function (prev, transition) {
        prev += transition.cost;
        return prev;
    }, cost);
    cost = transitions.encoding.reduce(function (prev, transition) {
        prev += transition.cost;
        return prev;
    }, cost);
    transitions["cost"] = cost;
    return transitions;
}
exports.transitionSet = transitionSet;
function marktypeTransitionSet(s, d, importedMarktypeTransitions) {
    var transSet = [];
    var marktypeTransitions = importedMarktypeTransitions || def.DEFAULT_MARKTYPE_TRANSITIONS;
    if (s.mark === d.mark) {
        return transSet;
    }
    else {
        var trName = [s.mark.toUpperCase(), d.mark.toUpperCase()].sort().join("_");
        transSet.push(util.duplicate(marktypeTransitions[trName]));
    }
    return transSet;
}
exports.marktypeTransitionSet = marktypeTransitionSet;
function transformTransitionSet(s, d, importedTransformTransitions, transOptions) {
    var transformTransitions = importedTransformTransitions || transformTransitions;
    var transSet = [];
    var trans;
    var already;
    if (transformTransitions["FILTER"]) {
        if (trans = transformFilter(s, d, transformTransitions)) {
            transSet.push(trans);
        }
    }
    channel_1.CHANNELS.forEach(function (channel) {
        ["SCALE", "SORT", "AGGREGATE", "BIN", "SETTYPE"].map(function (transformType) {
            if (transformType === "SETTYPE" && transformTransitions[transformType]) {
                trans = transformSettype(s, d, channel, transformTransitions);
            }
            else {
                if (transformTransitions[transformType]) {
                    trans = transformBasic(s, d, channel, transformType, transformTransitions, transOptions);
                }
            }
            if (trans) {
                already = util.find(transSet, function (item) { return item.name; }, trans);
                if (already >= 0) {
                    transSet[already].details.push(trans.detail);
                }
                else {
                    transSet.push(trans);
                    transSet[transSet.length - 1].details = [];
                    transSet[transSet.length - 1].details.push(trans.detail);
                    delete transSet[transSet.length - 1].detail;
                }
            }
        });
    });
    return transSet;
}
exports.transformTransitionSet = transformTransitionSet;
function transformBasic(s, d, channel, transform, transformTransitions, transOptions) {
    var sHas = false;
    var dHas = false;
    var transistion;
    var sTransform, dTransform;
    if (s.encoding[channel] && s.encoding[channel][transform.toLowerCase()]) {
        sHas = true;
        sTransform = s.encoding[channel][transform.toLowerCase()];
    }
    if (d.encoding[channel] && d.encoding[channel][transform.toLowerCase()]) {
        dHas = true;
        dTransform = d.encoding[channel][transform.toLowerCase()];
    }
    if (transOptions && transOptions.omitIncludeRawDomain && transform === "SCALE") {
        if (sTransform && sTransform.includeRawDomain) {
            delete sTransform.includeRawDomain;
            if (Object.keys(sTransform).length === 0 && JSON.stringify(sTransform) === JSON.stringify({})) {
                sHas = false;
            }
        }
        if (dTransform && dTransform.includeRawDomain) {
            delete dTransform.includeRawDomain;
            if (Object.keys(dTransform).length === 0 && JSON.stringify(dTransform) === JSON.stringify({})) {
                dHas = false;
            }
        }
    }
    if (sHas && dHas && (!util.rawEqual(sTransform, dTransform))) {
        transistion = util.duplicate(transformTransitions[transform]);
        transistion.detail = { "type": "modified", "channel": channel };
        return transistion;
    }
    else if (sHas && !dHas) {
        transistion = util.duplicate(transformTransitions[transform]);
        transistion.detail = { "type": "removed", "channel": channel };
        return transistion;
    }
    else if (!sHas && dHas) {
        transistion = util.duplicate(transformTransitions[transform]);
        transistion.detail = { "type": "added", "channel": channel };
        return transistion;
    }
}
exports.transformBasic = transformBasic;
function transformFilter(s, d, transformTransitions) {
    var uHasFilter = false;
    var vHasFilter = false;
    var transistion;
    if (s.transform && s.transform.filter) {
        uHasFilter = true;
    }
    if (d.transform && d.transform.filter) {
        vHasFilter = true;
    }
    if (uHasFilter && vHasFilter && (!util.rawEqual(s.transform.filter, d.transform.filter))) {
        transistion = util.duplicate(transformTransitions["FILTER"]);
        transistion.detail = { "type": "modified" };
        return transistion;
    }
    else if (uHasFilter && !vHasFilter) {
        transistion = util.duplicate(transformTransitions["FILTER"]);
        transistion.detail = { "type": "removed" };
        return transistion;
    }
    else if (!uHasFilter && vHasFilter) {
        transistion = util.duplicate(transformTransitions["FILTER"]);
        transistion.detail = { "type": "added" };
        return transistion;
    }
}
exports.transformFilter = transformFilter;
function transformSettype(s, d, channel, transformTransitions) {
    var sHas = false;
    var dHas = false;
    var transistion;
    if (s.encoding[channel] && d.encoding[channel]
        && (d.encoding[channel]["field"] === s.encoding[channel]["field"])
        && (d.encoding[channel]["type"] !== s.encoding[channel]["type"])) {
        transistion = util.duplicate(transformTransitions["SETTYPE"]);
        transistion.detail = {
            "type": s.encoding[channel]["type"] + "_" + d.encoding[channel]["type"],
            "channel": channel
        };
        return transistion;
    }
}
exports.transformSettype = transformSettype;
function encodingTransitionSet(s, d, importedEncodingTransitions) {
    if (nb.sameEncoding(s.encoding, d.encoding)) {
        return [];
    }
    var sChannels = util.keys(s.encoding);
    var sFields = sChannels.map(function (key) {
        return s.encoding[key];
    });
    var dChannels = util.keys(d.encoding);
    var dFields = dChannels.map(function (key) {
        return d.encoding[key];
    });
    var additionalFields = util.arrayDiff(dFields, sFields, function (field) { return field.field + "_" + field.type; });
    var additionalChannels = util.arrayDiff(dChannels, sChannels);
    var u;
    function nearestNode(nodes) {
        var minD = Infinity;
        var argMinD = -1;
        nodes.forEach(function (node, index) {
            if (node.distance < minD) {
                minD = node.distance;
                argMinD = index;
            }
        });
        return nodes.splice(argMinD, 1)[0];
    }
    var nodes = nb.neighbors(s, additionalFields, additionalChannels, importedEncodingTransitions)
        .map(function (neighbor) {
        neighbor.distance = neighbor.transition.cost,
            neighbor.prev = [s];
        return neighbor;
    });
    s.distance = 0;
    s.prev = [];
    var doneNodes = [s];
    while (nodes.length > 0) {
        u = nearestNode(nodes);
        if (nb.sameEncoding(u.encoding, d.encoding)) {
            break;
        }
        var alreadyDone = false;
        var newNodes = nb.neighbors(u, u.additionalFields, u.additionalChannels, importedEncodingTransitions);
        newNodes.forEach(function (newNode) {
            var node;
            for (var i = 0; i < doneNodes.length; i += 1) {
                if (nb.sameEncoding(doneNodes[i].encoding, newNode.encoding)) {
                    return;
                }
            }
            for (var i = 0; i < nodes.length; i += 1) {
                if (nb.sameEncoding(nodes[i].encoding, newNode.encoding)) {
                    node = nodes[i];
                    break;
                }
            }
            if (node) {
                if (node.distance > u.distance + newNode.transition.cost) {
                    node.distance = u.distance + newNode.transition.cost;
                    node.prev = u.prev.concat([u]);
                }
            }
            else {
                newNode.distance = u.distance + newNode.transition.cost;
                newNode.prev = u.prev.concat([u]);
                nodes.push(newNode);
            }
        });
        doneNodes.push(u);
    }
    if (!nb.sameEncoding(u.encoding, d.encoding) && nodes.length === 0) {
        return [{ name: "UNREACHABLE", cost: 999 }];
    }
    var result = u.prev.map(function (node) {
        return node.transition;
    }).filter(function (transition) { return transition; });
    result.push(u.transition);
    return result;
}
exports.encodingTransitionSet = encodingTransitionSet;

},{"../util":39,"./def":36,"./neighbor":37,"vega-lite/src/channel":12}],39:[function(require,module,exports){
exports.isArray = Array.isArray || function (obj) {
    return {}.toString.call(obj) === '[object Array]';
};
function isin(item, array) {
    return array.indexOf(item) !== -1;
}
exports.isin = isin;
;
function json(s, sp) {
    return JSON.stringify(s, null, sp);
}
exports.json = json;
;
function keys(obj) {
    var k = [], x;
    for (x in obj) {
        k.push(x);
    }
    return k;
}
exports.keys = keys;
;
function duplicate(obj) {
    return JSON.parse(JSON.stringify(obj));
}
exports.duplicate = duplicate;
;
function forEach(obj, f, thisArg) {
    if (obj.forEach) {
        obj.forEach.call(thisArg, f);
    }
    else {
        for (var k in obj) {
            f.call(thisArg, obj[k], k, obj);
        }
    }
}
exports.forEach = forEach;
;
function any(arr, f) {
    var i = 0, k;
    for (k in arr) {
        if (f(arr[k], k, i++)) {
            return true;
        }
    }
    return false;
}
exports.any = any;
;
function nestedMap(collection, f, level, filter) {
    return level === 0 ?
        collection.map(f) :
        collection.map(function (v) {
            var r = nestedMap(v, f, level - 1);
            return filter ? r.filter(nonEmpty) : r;
        });
}
exports.nestedMap = nestedMap;
;
function nestedReduce(collection, f, level, filter) {
    return level === 0 ?
        collection.reduce(f, []) :
        collection.map(function (v) {
            var r = nestedReduce(v, f, level - 1);
            return filter ? r.filter(nonEmpty) : r;
        });
}
exports.nestedReduce = nestedReduce;
;
function nonEmpty(grp) {
    return !exports.isArray(grp) || grp.length > 0;
}
exports.nonEmpty = nonEmpty;
;
function traverse(node, arr) {
    if (node.value !== undefined) {
        arr.push(node.value);
    }
    else {
        if (node.left) {
            traverse(node.left, arr);
        }
        if (node.right) {
            traverse(node.right, arr);
        }
    }
    return arr;
}
exports.traverse = traverse;
;
function extend(obj, b) {
    var rest = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        rest[_i - 2] = arguments[_i];
    }
    for (var x, name, i = 1, len = arguments.length; i < len; ++i) {
        x = arguments[i];
        for (name in x) {
            obj[name] = x[name];
        }
    }
    return obj;
}
exports.extend = extend;
;
function union(a, b) {
    var o = {};
    a.forEach(function (x) { o[x] = true; });
    b.forEach(function (x) { o[x] = true; });
    return keys(o);
}
exports.union = union;
;
var gen;
(function (gen) {
    function getOpt(opt) {
        return (opt ? keys(opt) : []).reduce(function (c, k) {
            c[k] = opt[k];
            return c;
        }, Object.create({}));
    }
    gen.getOpt = getOpt;
    ;
})(gen = exports.gen || (exports.gen = {}));
function powerset(list) {
    var ps = [
        []
    ];
    for (var i = 0; i < list.length; i++) {
        for (var j = 0, len = ps.length; j < len; j++) {
            ps.push(ps[j].concat(list[i]));
        }
    }
    return ps;
}
exports.powerset = powerset;
;
function chooseKorLess(list, k) {
    var subset = [[]];
    for (var i = 0; i < list.length; i++) {
        for (var j = 0, len = subset.length; j < len; j++) {
            var sub = subset[j].concat(list[i]);
            if (sub.length <= k) {
                subset.push(sub);
            }
        }
    }
    return subset;
}
exports.chooseKorLess = chooseKorLess;
;
function chooseK(list, k) {
    var subset = [[]];
    var kArray = [];
    for (var i = 0; i < list.length; i++) {
        for (var j = 0, len = subset.length; j < len; j++) {
            var sub = subset[j].concat(list[i]);
            if (sub.length < k) {
                subset.push(sub);
            }
            else if (sub.length === k) {
                kArray.push(sub);
            }
        }
    }
    return kArray;
}
exports.chooseK = chooseK;
;
function cross(a, b) {
    var x = [];
    for (var i = 0; i < a.length; i++) {
        for (var j = 0; j < b.length; j++) {
            x.push(a[i].concat(b[j]));
        }
    }
    return x;
}
exports.cross = cross;
;
function find(array, f, obj) {
    for (var i = 0; i < array.length; i += 1) {
        if (f(obj) === f(array[i])) {
            return i;
        }
    }
    return -1;
}
exports.find = find;
function rawEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}
exports.rawEqual = rawEqual;
function arrayDiff(a, b, f) {
    return a.filter(function (x) {
        if (!f) {
            return find(b, JSON.stringify, x) < 0;
        }
        else
            return find(b, f, x) < 0;
    });
}
exports.arrayDiff = arrayDiff;

},{}]},{},[27])(27)
});
//# sourceMappingURL=compass.js.map
