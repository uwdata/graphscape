// Universal Set

//Included factors
Fields = [ { "type": "Q", "name": "Q1" },
           { "type": "Q", "name": "Q2" },
           { "type": "O", "name": "O1" },
           { "type": "O", "name": "O2" },
           { "type": "T", "name": "T1" },
         ];

Marks = ['bar','point','line','area', 'tick'];
Channels = ['x','y','shape','color','size','row','column'];
Properties = [
            { 'bin' : [ true, undefined ] },
            { 'scale': [{"type":"log"}, undefined ] },
            { 'aggregate': ["mean", undefined ] },
            { 'sort': ["natural", "descending"] }
            ]

DataTransforms = [ 'filter', undefined ];


// Explicit Constraints
maxAdditonalVariables : 4
markList: [Mark.POINT, Mark.BAR, Mark.LINE, Mark.AREA, Mark.TEXT, Mark.TICK],
channelList: [X, Y, ROW, COLUMN, SIZE, COLOR, TEXT, DETAIL],

alwaysGenerateTableAsHeatmap: true,
maxGoodCardinalityForFacets: 5,
maxCardinalityForFacets: 20,
maxGoodCardinalityForColor: 7,
maxCardinalityForColor: 20,
maxCardinalityForShape: 6,
omitDotPlot: false,
omitDotPlotWithExtraEncoding: false,
omitDotPlotWithFacet: false,
omitDotPlotWithOnlyCount: false, // TODO: revise if this should be true
omitMultipleNonPositionalChannels: false, // TODO: revise if we penalize this in ranking
omitNonTextAggrWithAllDimsOnFacets: false,
omitRawWithXYBothDimension: true,
omitShapeWithBin: true,
omitShapeWithTimeDimension: true,
omitSizeOnBar: true,
omitLengthForLogScale: true,
omitStackedAverage: true,
omitTranspose: false,


//Excluded factors
Themes = ["NYT", "Excel", "ggplot2", ... ];
Viewport = [ { "type": "zoom", "level": [-2,-1,0,1,2] },
             { "type": "shift", "level": [-2,-1,0,1,2] },
            ... ];
