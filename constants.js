var NUM_OBSTACLES = 50; // the number of points for generating the voronoi diagram
var MARGIN = 50;
var BOUNDING_BOX = {
  xl: MARGIN,
  xr: canvas.width - MARGIN,
  yt: MARGIN,
  yb: canvas.height - MARGIN
};


var GRID_NUMBER = 32;
//drawGrid(cxt,GRID_NUMBER);

// meet station count rule
var MAX_NUM_STATIONS = 3;
var MIN_NUM_STATIONS = 1;
var MIN_JUNCTION_DIST = 3;
var MIN_NUM_JUNCTIONS = 1;
var MAX_NUM_JUNCTIONS = 5;
var MIN_STATION_DIST = 8;

var VARONIS_MIN = 30;
var VARONIS_MAX = 50;

var stations = [];
var number_of_stations;

var junctions = [];
var number_of_junctions;