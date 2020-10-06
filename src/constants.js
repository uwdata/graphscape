exports.TYPES = {
  QUANTITATIVE: 'quantitative',
  ORDINAL: 'ordinal',
  TEMPORAL: 'temporal',
  NOMINAL: 'nominal',
  GEOJSON: 'geojson'
};

exports.CHANNELS = ["x", "y", "color", "shape", "size", "text", "row", "column"];
exports.OPS  = ["equal", "lt", "lte", "gt", "gte", "range", "oneOf", "valid"];
exports.LOGIC_OPS = ["and", "or", "not"];