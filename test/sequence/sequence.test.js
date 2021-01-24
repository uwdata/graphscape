"use strict";
var expect = require('chai').expect;
var editOpSet = require('../editOpSetForTest');
var sq = require('../../src/sequence/sequence').sequence;


describe('sequence.sequence check', function () {
  this.timeout(60000);
  it('Case 6',async function () {
    var charts = [
      {
        "data": {"url": "data/movies.json","formatType": "json"},
        "transform": [
            {
              "filter": {
              "field": "Major_Genre",
              "oneOf": [
                "Action",
                "Adventure",
                "Comedy",
                "Documentary",
                "Drama",
                "Horror",
                "Thriller/Suspense"
              ]
            }
          },
            {
              "filter": {
              "field": "Source",
              "oneOf": [
                "Disney Ride",
                "Based on Game",
                "Remake",
                "Spin-Off",
                "Based on TV",
                "Based on Tody",
                "Based on Book/Short Story"
              ]
            }
          },

          {
            "filter": {
              "field": "Creative_Type",
              "oneOf": [
                "Contemporary Fiction",
                "Dramatization",
                "Factual",
                "Fantasy",
                "Historical Fiction",
                "Kids Fiction",
                "Science Fiction",
                "Super Hero"
              ]
            }
          }
          ],
        "mark": "bar",
        "encoding": {
          "x": {
            "field": "IMDB_Rating",
            "type": "quantitative",
            "aggregate": "mean",
            "axis":{"title":"Avg. IMDB Rating"}
          },
          "y": {"field": "Creative_Type","type": "nominal", "axis":{"title":"Creative Type"}}
        }
      },
      {
        "data": {"url": "data/movies.json","formatType": "json"},
        "transform": [
            {
              "filter": {
              "field": "Major_Genre",
              "oneOf": [
                "Action",
                "Adventure",
                "Comedy",
                "Documentary",
                "Drama",
                "Horror",
                "Thriller/Suspense"
              ]
            }
          },
            {
              "filter": {
              "field": "Source",
              "oneOf": [
                "Disney Ride",
                "Based on Game",
                "Remake",
                "Spin-Off",
                "Based on TV",
                "Based on Tody",
                "Based on Book/Short Story"
              ]
            }
          },

          {
            "filter": {
              "field": "Creative_Type",
              "oneOf": [
                "Contemporary Fiction",
                "Dramatization",
                "Factual",
                "Fantasy",
                "Historical Fiction",
                "Kids Fiction",
                "Science Fiction",
                "Super Hero"
              ]
            }
          }
          ],
        "mark": "bar",
        "encoding": {
          "x": {
            "field": "IMDB_Rating",
            "type": "quantitative",
            "aggregate": "mean",
            "axis":{"title":"Avg. IMDB Rating"}
          },
          "y": {"field": "Major_Genre","type": "nominal", "axis":{"title":"Major Genre"}}
        }
      },
      {
        "data": {"url": "data/movies.json","formatType": "json"},
        "transform": [
            {
              "filter": {
              "field": "Major_Genre",
              "oneOf": [
                "Action",
                "Adventure",
                "Comedy",
                "Documentary",
                "Drama",
                "Horror",
                "Thriller/Suspense"
              ]
            }
          },
            {
              "filter": {
              "field": "Source",
              "oneOf": [
                "Disney Ride",
                "Based on Game",
                "Remake",
                "Spin-Off",
                "Based on TV",
                "Based on Tody",
                "Based on Book/Short Story"
              ]
            }
          },

          {
            "filter": {
              "field": "Creative_Type",
              "oneOf": [
                "Contemporary Fiction",
                "Dramatization",
                "Factual",
                "Fantasy",
                "Historical Fiction",
                "Kids Fiction",
                "Science Fiction",
                "Super Hero"
              ]
            }
          }
          ],
        "mark": "bar",
        "encoding": {
          "x": {
            "field": "IMDB_Rating",
            "type": "quantitative",
            "aggregate": "mean",
            "axis":{"title":"Avg. IMDB Rating"}
          },
          "y": {"field": "Source","type": "nominal"}
        }
      },
      {
        "data": {"url": "data/movies.json","formatType": "json"},
        "transform": [
            {
              "filter": {
              "field": "Major_Genre",
              "oneOf": [
                "Action",
                "Adventure",
                "Comedy",
                "Documentary",
                "Drama",
                "Horror",
                "Thriller/Suspense"
              ]
            }
          },
            {
              "filter": {
              "field": "Source",
              "oneOf": [
                "Disney Ride",
                "Based on Game",
                "Remake",
                "Spin-Off",
                "Based on TV",
                "Based on Tody",
                "Based on Book/Short Story"
              ]
            }
          },

          {
            "filter": {
              "field": "Creative_Type",
              "oneOf": [
                "Contemporary Fiction",
                "Dramatization",
                "Factual",
                "Fantasy",
                "Historical Fiction",
                "Kids Fiction",
                "Science Fiction",
                "Super Hero"
              ]
            }
          }
          ],
        "mark": "bar",
        "encoding": {
          "x": {
            "field": "Worldwide_Gross",
            "type": "quantitative",
            "aggregate": "mean",
            "axis":{"title":"Avg. Worldwide Gross"}
          },
          "y": {"field": "Creative_Type","type": "nominal", "axis":{"title":"Creative Type"}}
        }
      },
      {
        "data": {"url": "data/movies.json","formatType": "json"},
        "transform": [
            {
              "filter": {
              "field": "Major_Genre",
              "oneOf": [
                "Action",
                "Adventure",
                "Comedy",
                "Documentary",
                "Drama",
                "Horror",
                "Thriller/Suspense"
              ]
            }
          },
            {
              "filter": {
              "field": "Source",
              "oneOf": [
                "Disney Ride",
                "Based on Game",
                "Remake",
                "Spin-Off",
                "Based on TV",
                "Based on Tody",
                "Based on Book/Short Story"
              ]
            }
          },

          {
            "filter": {
              "field": "Creative_Type",
              "oneOf": [
                "Contemporary Fiction",
                "Dramatization",
                "Factual",
                "Fantasy",
                "Historical Fiction",
                "Kids Fiction",
                "Science Fiction",
                "Super Hero"
              ]
            }
          }
          ],
        "mark": "bar",
        "encoding": {
          "x": {
            "field": "Worldwide_Gross",
            "type": "quantitative",
            "aggregate": "mean",
            "axis":{"title":"Avg. Worldwide Gross"}
          },
          "y": {"field": "Major_Genre","type": "nominal", "axis":{"title":"Major Genre"}}
        }
      },
      {
        "data": {"url": "data/movies.json","formatType": "json"},
        "transform": [
            {
              "filter": {
              "field": "Major_Genre",
              "oneOf": [
                "Action",
                "Adventure",
                "Comedy",
                "Documentary",
                "Drama",
                "Horror",
                "Thriller/Suspense"
              ]
            }
          },
          {
            "filter": {
              "field": "Source",
              "oneOf": [
                "Disney Ride",
                "Based on Game",
                "Remake",
                "Spin-Off",
                "Based on TV",
                "Based on Tody",
                "Based on Book/Short Story"
              ]
            }
          },

          {
            "filter": {
              "field": "Creative_Type",
              "oneOf": [
                "Contemporary Fiction",
                "Dramatization",
                "Factual",
                "Fantasy",
                "Historical Fiction",
                "Kids Fiction",
                "Science Fiction",
                "Super Hero"
              ]
            }
          }
          ],
        "mark": "bar",
        "encoding": {
          "x": {
            "field": "Worldwide_Gross",
            "type": "quantitative",
            "aggregate": "mean",
            "axis":{"title":"Avg. Worldwide Gross"}
          },
          "y": {"field": "Source","type": "nominal"}
        }
      }
    ];

    var result = await sq(charts, {"fixFirst":false}, editOpSet.DEFAULT_EDIT_OPS);

    expect(result.length).to.eq(720);
    expect(result[0].sumOfTransitionCosts).to.eq(40.02);
    expect(result[0].globalWeightingTerm).to.eq( 1- 0.6666666666666666);
    expect(result[0].sequenceCost).to.eq(13.340000000000003);


  });

  it('Case 5',async function () {
    var charts = [
      {
        "data": {"url": "data/movies.json","formatType": "json"},
        "transform": [
          {
            "filter": {
              "field": "Major_Genre",
              "oneOf": [
                "Action",
                "Adventure",
                "Comedy",
                "Documentary",
                "Drama",
                "Horror",
                "Thriller/Suspense"
              ]
            }

          },
          {
            "filter": {
              "field": "Source",
              "oneOf": [
                "Disney Ride",
                "Based on Game",
                "Remake",
                "Spin-Off",
                "Based on TV",
                "Based on Tody",
                "Based on Book/Short Story"
              ]
            }

          }
        ],
        "mark": "bar",
        "encoding": {
          "x": {
            "field": "Worldwide_Gross",
            "type": "quantitative",
            "aggregate": "mean",
            "axis": {"title": "Avg. Worldwide Gross ($)"}
          },
          "y": {"field": "Major_Genre","type": "nominal", "axis": {"title": "Major Genre"}}
        }
      },
      {
          "data": {"url": "data/movies.json","formatType": "json"},
          "transform": [
              {"filter": {
                "field": "Major_Genre",
                "oneOf": [
                  "Action",
                  "Adventure",
                  "Comedy",
                  "Documentary",
                  "Drama",
                  "Horror",
                  "Thriller/Suspense"
                ]
              }
            },
              {
                "filter":
                {
                "field": "Source",
                "oneOf": [
                  "Disney Ride",
                  "Based on Game",
                  "Remake",
                  "Spin-Off",
                  "Based on TV",
                  "Based on Tody",
                  "Based on Book/Short Story"
                ]
              }
            }
            ],
          "mark": "bar",
          "encoding": {
            "x": {
              "field": "IMDB_Rating",
              "type": "quantitative",
              "aggregate": "mean",
              "axis": {"title": "Avg. IMDB Rating"}
            },
            "y": {"field": "Major_Genre","type": "nominal", "axis": {"title": "Major Genre"}}
          }
      },
      {
          "data": {"url": "data/movies.json","formatType": "json"},
          "transform": [
              {"filter": {
                "field": "Major_Genre",
                "oneOf": [
                  "Action",
                  "Adventure",
                  "Comedy",
                  "Documentary",
                  "Drama",
                  "Horror",
                  "Thriller/Suspense"
                ]
              }
            },
              {
                "filter":
                {
                "field": "Source",
                "oneOf": [
                  "Disney Ride",
                  "Based on Game",
                  "Remake",
                  "Spin-Off",
                  "Based on TV",
                  "Based on Tody",
                  "Based on Book/Short Story"
                ]
              }
            }
            ],
          "mark": "bar",
          "encoding": {
            "x": {
              "field": "Production_Budget",
              "type": "quantitative",
              "aggregate": "mean",
              "axis": {"title": "Avg. Production Budget ($)"}
            },
            "y": {"field": "Major_Genre","type": "nominal", "axis": {"title": "Major Genre"}}
          }
      },
      {
          "data": {"url": "data/movies.json","formatType": "json"},
          "transform": [
              {"filter": {
                "field": "Major_Genre",
                "oneOf": [
                  "Action",
                  "Adventure",
                  "Comedy",
                  "Documentary",
                  "Drama",
                  "Horror",
                  "Thriller/Suspense"
                ]
              }
            },
              {
                "filter":
                {
                "field": "Source",
                "oneOf": [
                  "Disney Ride",
                  "Based on Game",
                  "Remake",
                  "Spin-Off",
                  "Based on TV",
                  "Based on Tody",
                  "Based on Book/Short Story"
                ]
              }
            }
            ],
          "mark": "bar",
          "encoding": {
            "x": {
              "field": "Worldwide_Gross",
              "type": "quantitative",
              "aggregate": "mean",
              "axis": {"title": "Avg. Worldwide Gross ($)"}
            },
            "y": {"field": "Source","type": "nominal"}
          }
      },
      {
          "data": {"url": "data/movies.json","formatType": "json"},
          "transform": [
              {"filter": {
                "field": "Major_Genre",
                "oneOf": [
                  "Action",
                  "Adventure",
                  "Comedy",
                  "Documentary",
                  "Drama",
                  "Horror",
                  "Thriller/Suspense"
                ]
              }
            },
              {
                "filter":
                {
                "field": "Source",
                "oneOf": [
                  "Disney Ride",
                  "Based on Game",
                  "Remake",
                  "Spin-Off",
                  "Based on TV",
                  "Based on Tody",
                  "Based on Book/Short Story"
                ]
              }
            }
            ],
          "mark": "bar",
          "encoding": {
            "x": {
              "field": "IMDB_Rating",
              "type": "quantitative",
              "aggregate": "mean",
              "axis": {"title": "Avg. IMDB Rating"}
            },
            "y": {"field": "Source","type": "nominal"}
          }
      },
      {
          "data": {"url": "data/movies.json","formatType": "json"},
          "transform": [
              {"filter": {
                "field": "Major_Genre",
                "oneOf": [
                  "Action",
                  "Adventure",
                  "Comedy",
                  "Documentary",
                  "Drama",
                  "Horror",
                  "Thriller/Suspense"
                ]
              }
            },
              {
                "filter":
                {
                "field": "Source",
                "oneOf": [
                  "Disney Ride",
                  "Based on Game",
                  "Remake",
                  "Spin-Off",
                  "Based on TV",
                  "Based on Tody",
                  "Based on Book/Short Story"
                ]
              }
            }
            ],
          "mark": "bar",
          "encoding": {
            "x": {
              "field": "Production_Budget",
              "type": "quantitative",
              "aggregate": "mean",
              "axis": {"title": "Avg. Production Budget ($)"}
            },
            "y": {"field": "Source","type": "nominal"}
          }
      }
    ];

    var result = await sq(charts, {"fixFirst":false}, editOpSet.DEFAULT_EDIT_OPS);
    // var result = gs.sequence.sequence(charts,options)
    expect(result.length).to.eq(720);
    expect(result[0].sumOfTransitionCosts).to.eq(39.37);
    expect(result[0].globalWeightingTerm).to.eq( 0.33333333333333337);
    expect(result[0].sequenceCost).to.eq(13.123333333333333);


  });

  it('Case 4',async function () {
    var charts = [
      {
        "description": "IT Companies Stock Price",
        "data": {"formatType": "csv","url": "data/stocks.csv"},
        "mark": "area",
        "encoding": {
          "x": {
            "field": "date",
            "type": "temporal",
            "axis": {"title": "Date", "format":"%Y-%m", "labelAngle":0}
          },
          "y": {
            "field": "price",
            "type": "quantitative",
            "aggregate":"mean",
            "scale": {"domain":[0,240]},
            "axis": {"title":"Avg. Price"}
          }
        },
        "config": {"cell": {"width": 400,"height": 200}}
      },
      {
        "description": "Apple Inc. Stock Price",
        "data": {"formatType": "csv","url": "data/stocks.csv"},
        "mark": "area",
        "transform": [{"filter":"datum.symbol=='AAPL'"}],
        "encoding": {
          "x": {
            "field": "date",
            "type": "temporal",
            "axis": {"title": "Date", "format":"%Y-%m", "labelAngle":0}
          },
          "y": {
            "field": "price",
            "type": "quantitative",
            "aggregate":"mean",
            "scale": {"domain":[0,240]},
            "axis": {"title":"Price"}
          }
        },
        "config": {"cell": {"width": 400,"height": 200}}
      },
      {
        "description": "Apple Inc. Stock Price",
        "data": {"formatType": "csv","url": "data/stocks.csv"},
        "mark": "point",
        "transform": [{"filter":"datum.symbol=='AAPL'"}],
        "encoding": {
          "x": {"field": "date","type": "temporal",
            "axis": {"title": "Date", "format":"%Y-%m", "labelAngle":0}},
          "y": {
            "field": "price",
            "type": "quantitative",
            "aggregate":"mean",
            "scale": {"domain":[0,240]},
            "axis": {"title":"Price"}
          }
        },
        "config": {
          "cell": {"width": 400,"height": 200}
        }
      },
      {
        "description": "Apple Inc. Stock Price",
        "data": {"formatType": "csv","url": "data/stocks.csv"},
        "mark": "line",
        "transform": [{"filter":"datum.symbol=='AAPL'"}],
        "encoding": {
          "x": {"field": "date","type": "temporal",
            "axis": {"title": "Date", "format":"%Y-%m", "labelAngle":0}},
          "y": {
            "field": "price",
            "type": "quantitative",
            "aggregate":"mean",
            "scale": {"domain":[0,240]},
            "axis": {"title":"Price"}
          }
        },
        "config": {
          "cell": {"width": 400,"height": 200}
        }
      },
      {
        "description": "Apple Inc. Stock Price",
        "data": {"formatType": "csv","url": "data/stocks.csv"},
        "mark": "point",
        "transform": [{"filter":"datum.symbol=='AAPL'"}],
        "encoding": {
          "x": {"field": "date","type": "temporal",
            "axis": {"title": "Date", "format":"%Y-%m", "labelAngle":0}},
          "y": {
            "field": "price",
            "type": "quantitative",
            "aggregate":"mean",
            "scale": {"type": "log"},
            "axis": {"title":"Price"}
          }
        },
        "config": {
          "cell": {"width": 400,"height": 200}
        }
      },
      {
        "description": "Apple Inc. Stock Price",
        "data": {"formatType": "csv","url": "data/stocks.csv"},
        "mark": "line",
        "transform": [{"filter":"datum.symbol=='AAPL'"}],
        "encoding": {
          "x": {"field": "date","type": "temporal",
            "axis": {"title": "Date", "format":"%Y-%m", "labelAngle":0}},
          "y": {
            "field": "price",
            "type": "quantitative",
            "aggregate":"mean",
            "scale": {"type": "log"},
            "axis": {"title":"Price"}
          }
        },
        "config": {
          "cell": {"width": 400,"height": 200}
        }
      }
    ];

    var result = await sq(charts, {"fixFirst":false}, editOpSet.DEFAULT_EDIT_OPS);

    expect(result.length).to.eq(720);
    expect(result[0].sumOfTransitionCosts).to.eq(11.17);
    expect(result[0].globalWeightingTerm).to.eq( 1-0.3333333333333333);
    expect(result[0].sequenceCost).to.eq(7.446666666666667);


  });

  it('Case 3', async function () {
    var charts = [
      {
        "description": "Cars in 1973",
        "data": {"url": "data/cars.json", "formatType": "json"},
        "transform": [
          { "filter": { "field":"Year", "equal": "1973-01-01"} }
        ],
        "mark": "point",
        "encoding": {
          "x": {
            "field": "Horsepower",
            "type": "quantitative",
            "scale": {"domain": [0,240]},
            "axis": {"title": "Horsepower"}
          },
          "y": {
            "field": "Weight_in_lbs",
            "type": "quantitative",
            "aggregate": "mean",
            "scale": {"domain": [0,5000]},
            "axis": {"title": "Avg. Weight (lbs)"}
          },
          "size": {
            "field": "*",
            "type": "quantitative",
            "aggregate": "count",
            "scale": {"domain": [0,10]},
            "legend": {"title": "# of Cars"}
          }
        }
      },
      {
        "description": "Cars in 1978",
        "data": {"url": "data/cars.json", "formatType": "json"},
        "transform": [{
          "filter": { "field":"Year", "equal": "1978-01-01"}}
        ],
        "mark": "point",
        "encoding": {
          "x": {
            "field": "Horsepower",
            "type": "quantitative",
            "scale": {"domain": [0,240]},
            "axis": {"title": "Horsepower"}
          },
          "y": {
            "field": "Weight_in_lbs",
            "type": "quantitative",
            "aggregate": "mean",
            "scale": {"domain": [0,5000]},
            "axis": {"title": "Avg. Weight (lbs)"}
          },
          "size": {
            "field": "*",
            "type": "quantitative",
            "aggregate": "count",
            "scale": {"domain": [0,10]},
            "legend": {"title": "# of Cars"}
          }
        }
      },
      {
        "description": "Cars in 1982",
        "data": {"url": "data/cars.json", "formatType": "json"},
        "transform": [{
          "filter": { "field":"Year", "equal": "1982-01-01"}}
        ],
        "mark": "point",
        "encoding": {
          "x": {
            "field": "Horsepower",
            "type": "quantitative",
            "scale": {"domain": [0,240]},
            "axis": {"title": "Horsepower"}
          },
          "y": {
            "field": "Weight_in_lbs",
            "type": "quantitative",
            "aggregate": "mean",
            "scale": {"domain": [0,5000]},
            "axis": {"title": "Avg. Weight (lbs)"}
          },
          "size": {
            "field": "*",
            "type": "quantitative",
            "aggregate": "count",
            "scale": {"domain": [0,10]},
            "legend": {"title": "# of Cars"}
          }
        }
      },
      {
        "description": "USA Cars in 1978",
        "data": {"url": "data/cars.json", "formatType": "json"},
        "transform": [
            {"filter": { "field":"Year", "equal": "1978-01-01"}},
            {"filter":{ "field":"Origin", "equal": "USA"}}
          ],
        "mark": "point",
        "encoding": {
          "x": {
            "field": "Horsepower",
            "type": "quantitative",
            "scale": {"domain": [0,240]},
            "axis": {"title": "Horsepower"}
          },
          "y": {
            "field": "Weight_in_lbs",
            "type": "quantitative",
            "aggregate": "mean",
            "scale": {"domain": [0,5000]},
            "axis": {"title": "Avg. Weight (lbs)"}
          },
          "size": {
            "field": "*",
            "type": "quantitative",
            "aggregate": "count",
            "scale": {"domain": [0,10]},
            "legend": {"title": "# of Cars"}
          }
        }
      },
      {
        "description": "Japan Cars in 1978",
        "data": {"url": "data/cars.json", "formatType": "json"},
        "transform": [
          {"filter": { "field":"Year", "equal": "1978-01-01"}},
          {"filter":{ "field":"Origin", "equal": "Japan"}}
        ],
        "mark": "point",
        "encoding": {
          "x": {
            "field": "Horsepower",
            "type": "quantitative",
            "scale": {"domain": [0,240]},
            "axis": {"title": "Horsepower"}
          },
          "y": {
            "field": "Weight_in_lbs",
            "type": "quantitative",
            "aggregate": "mean",
            "scale": {"domain": [0,5000]},
            "axis": {"title": "Avg. Weight (lbs)"}
          },
          "size": {
            "field": "*",
            "type": "quantitative",
            "aggregate": "count",
            "scale": {"domain": [0,10]},
            "legend": {"title": "# of Cars"}
          }
        }
      },
      {
        "description": "Europe Cars in 1978",
        "data": {"url": "data/cars.json", "formatType": "json"},
        "transform": [
          {"filter": { "field":"Year", "equal": "1978-01-01"}},
          {"filter":{ "field":"Origin", "equal": "Europe"}}
        ],
        "mark": "point",
        "encoding": {
          "x": {
            "field": "Horsepower",
            "type": "quantitative",
            "scale": {"domain": [0,240]},
            "axis": {"title": "Horsepower"}
          },
          "y": {
            "field": "Weight_in_lbs",
            "type": "quantitative",
            "aggregate": "mean",
            "scale": {"domain": [0,5000]},
            "axis": {"title": "Avg. Weight (lbs)"}
          },
          "size": {
            "field": "*",
            "type": "quantitative",
            "aggregate": "count",
            "scale": {"domain": [0,10]},
            "legend": {"title": "# of Cars"}
          }
        }
      }
    ];

    var result = await sq(charts, {"fixFirst":false}, editOpSet.DEFAULT_EDIT_OPS);

    expect(result.length).to.eq(720);
    expect(result[0].sumOfTransitionCosts).to.eq(18.19);
    expect(result[0].globalWeightingTerm).to.eq( 1 - 0.3333333333333333);
    expect(result[0].sequenceCost).to.eq(12.126993464052289);

  });

  it('Case 2',async function () {
    var charts = [
      {
        "data": {"url": "data/cameras.json"},
        "mark": "bar",
        "transform": [{
          "filter": "datum.Storage_included <= 64 && datum.Zoom_wide>0"
        }],
        "encoding": {
          "x": {
            "field": "Price",
            "type": "quantitative",
            "bin": true,
            "axis": {"title": "Price (USA Dollar)"}
          },
          "y": {
            "field": "*",
            "type": "quantitative",
            "aggregate": "count",
            "axis": {"title": "Number of Cameras"}
          }
        }
      },
      {
        "data": {"url": "data/cameras.json"},
        "mark": "bar",
        "transform": [{
          "filter": "datum.Storage_included <= 64 && datum.Zoom_wide>0"
        }],
        "encoding": {
          "x": {
            "field": "Max_resolution",
            "type": "quantitative",
            "bin": true,
            "axis": {"title": "Max Resolution (Megapixel)"}
          },
          "y": {
            "field": "*",
            "type": "quantitative",
            "aggregate": "count",
            "axis": {"title": "Number of Cameras"}
          }
        }
      },
      {
        "data": {"url": "data/cameras.json"},
        "mark": "bar",
        "transform": [{
          "filter": "datum.Storage_included <= 64 && datum.Zoom_wide>0"
        }],
        "encoding": {
          "x": {"field": "Weight","type": "quantitative","bin": true,
            "axis": {"title": "Weight (g)","format":",.3d"}},
          "y": {
            "field": "*",
            "type": "quantitative",
            "aggregate": "count",
            "axis": {"title": "Number of Cameras"}
          }
        }
      },
      {
        "data": {"url": "data/cameras.json"},
        "mark": "point",
        "transform": [{
          "filter": "datum.Storage_included <= 64 && datum.Zoom_wide>0"
        }],
        "encoding": {
          "y": {
            "field": "Price",
            "type": "quantitative",
            "axis": {"title": "Price (USA Dollar)"}
          },
          "x": {
            "field": "Max_resolution",
            "type": "quantitative",
            "axis": {"title": "Max Resolution (Megapixel)"}
          }
        }
      },
      {
        "data": {"url": "data/cameras.json"},
        "mark": "point",
        "transform": [{
          "filter": "datum.Storage_included <= 64 && datum.Zoom_wide>0"
        }],
        "encoding": {
          "y": {
            "field": "Price",
            "type": "quantitative",
            "axis": {"title": "Price (USA Dollar)"}
          },
          "x": {"field": "Weight","type": "quantitative",
            "axis": {"title": "Weight (g)","format":",.3d"}}
        }
      },
      {
        "data": {"url": "data/cameras.json"},
        "mark": "point",
        "transform": [{
          "filter": "datum.Storage_included <= 64 && datum.Zoom_wide>0"
        }],
        "encoding": {
          "y": {
            "field": "Max_resolution",
            "type": "quantitative",
            "axis": {"title": "Max Resolution (Megapixel)"}
          },
          "x": {"field": "Weight","type": "quantitative",
            "axis": {"title": "Weight (g)","format":",.3d"}}
        }
      }
    ];

    var result = await sq(charts, {"fixFirst":false}, editOpSet.DEFAULT_EDIT_OPS);
    // [
    //   0, 1, 2, 4,
    //   6, 3, 5
    // ]

    expect(result.length).to.eq(720);
    expect(result[0].sumOfTransitionCosts).to.eq(38.47);
    expect(result[0].globalWeightingTerm).to.eq( 1 - 0.3333333333333333);
    expect(result[0].sequenceCost).to.eq(25.64666666666667);


  });

  it('Case 1',async function () {
    var charts = [
      {
        "data": {
          "url": "data/cars.json",
          "formatType": "json"
        },
        "mark": "point",
        "encoding": {
          "x": {
            "field": "Miles_per_Gallon",
            "axis": {"title": "Miles per Gallon"},
            "type": "quantitative"
          },
          "y": {
            "field": "Origin",
            "type": "nominal"
          }
        }
      },
      {
        "data": {
          "url": "data/cars.json",
          "formatType": "json"
        },
        "mark": "point",
        "encoding": {
          "x": {
            "field": "Miles_per_Gallon",
            "axis": {"title": "Avg. Miles per Gallon"},
            "type": "quantitative",
            "aggregate": "mean"
          },
          "y": {
            "field": "Origin",
            "type": "nominal"
          }
        }
      },
      {
        "data": {
          "url": "data/cars.json",
          "formatType": "json"
        },
        "mark": "point",
        "encoding": {
          "x": {
            "field": "Miles_per_Gallon",
            "axis": {"title": "Miles per Gallon"},
            "type": "quantitative"
          },
          "y": {
            "field": "Cylinders",
            "type": "nominal"
          }
        }
      },
      {
        "data": {
          "url": "data/cars.json",
          "formatType": "json"
        },
        "mark": "point",
        "encoding": {
          "x": {
            "field": "Miles_per_Gallon",
            "axis": {"title": "Avg. Miles per Gallon"},
            "type": "quantitative",
            "aggregate": "mean"
          },
          "y": {
            "field": "Cylinders",
            "type": "nominal"
          }
        }
      },
      {
        "data": {
          "url": "data/cars.json",
          "formatType": "json"
        },
        "mark": "point",
        "encoding": {
          "x": {
            "field": "Miles_per_Gallon",
            "axis": {"title": "Miles per Gallon"},
            "type": "quantitative"
          },
          "y": {
            "field": "Cylinders",
            "type": "nominal"
          },
          "color": {
            "field": "Origin",
            "type": "nominal"
          }
        }
      },
      {
        "data": {
          "url": "data/cars.json",
          "formatType": "json"
        },
        "mark": "point",
        "encoding": {
          "x": {
            "field": "Miles_per_Gallon",
            "axis": {"title": "Avg. Miles per Gallon"},
            "type": "quantitative",
            "aggregate": "mean"
          },
          "y": {
            "field": "Cylinders",
            "type": "nominal"
          },
          "color": {
            "field": "Origin",
            "type": "nominal"
          }
        }
      }
    ];

    var result = await sq(charts, {"fixFirst":false}, editOpSet.DEFAULT_EDIT_OPS);

    expect(result.length).to.eq(720);
    expect(result[0].sumOfTransitionCosts).to.eq(21.59);
    expect(result[0].globalWeightingTerm).to.eq( 0.5);
    expect(result[0].sequenceCost).to.eq(10.795);


  });

})
