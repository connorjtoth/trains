



function Map (  )
{
  this.dashboard = null;
  this.draw      = null;



  this.diagram = null;
  this.obstacles = [];
  this.stations = [];
  this.junctions = [];
  this.adjList = null;
  this.paths = [];
  this.trains = [];

  this.gridSize = 300;
  this.boundingBox = null;
  this.boundedVerts = [];

  this.interval = null;
  this.intervalFns = {};
  this.playing = false;
  this.selectedVerts = [];
  this.mode = -1;

  this.config = {
    min_num_stations: 3,
    max_num_stations: 4,
    min_station_dist: 8,
    station_size: 10,

    min_num_junctions: 2,
    max_num_junctions: 5,
    min_junction_dist: 3,
    junction_size: 5,

    min_num_obstacles: 100,
    max_num_obstacles: 100,
    min_obstacle_dist: 0,

    path_size: 3,

    margin: 50,
  }
}


// -----------------------------------------------------------------------------
// Setting up the Map
// -----------------------------------------------------------------------------

Map.prototype.setDashboard = function ( dash )
{
  this.dashboard = dash;
}

Map.prototype.updateBoundingBox = function ( )
{  
  this.boundingBox = {
    xl: MARGIN + (draw.canvas.width * 0.2),
    xr: draw.canvas.width - MARGIN,
    yt: MARGIN,
    yb: draw.canvas.height - MARGIN
  };
}










Map.prototype.generateRandCoords = function ( )
{
  var x, y;
  x = generateBoundedInteger(this.boundingBox.xl, this.boundingBox.xr);
  y = generateBoundedInteger(this.boundingBox.yt, this.boundingBox.yb);
  return new Vector2(x, y);
}


Map.prototype.detectCollisions = function ( )
{
  // TODO: add collisions in stations at capacity
  // this is bad...
  var positions = [];
  for (train of this.trains)
  {
    Array.prototype.push.apply(positions, train.actualPositions);
  }

  for (pos_i = 0; pos_i < positions.length; pos_i++)
  {
    for (pos2_i = 0; pos2_i < pos_i; pos2_i++)
    {
      var pos = positions[pos_i];
      var pos2 = positions[pos2_i];

      if (dist(pos, pos2) < 7)
      {
        console.log('Collision found!');
        return true;
      }
    }
  }

  return false;
}


Map.prototype.addTrain = function  (train)
{
  this.trains.push(train);
  this.dashboard.addControlsFor(train);
}





function bfs (V, A, s, t)
{
  var parent = {};
  var queue = [s];
  var hits = [s];

  while (queue.length > 0)
  {
    let current = queue.shift();
    if (current == t)
    {
      return parent;
    }
    for (node of A[current])
    {
      var flag = hits.includes(node);
      if (!flag)
      {
        hits.unshift(node);
        parent[node] = current;
        queue.push(node);
      }
    }
  }
  throw 'breadth first search error, no connection to s and t';
}

Map.prototype.createUniqueVertexList = function (count, min_dist, otherList)
{
  var temp = [];
  for ( var pointNum = 0; pointNum < count; pointNum++)
  {
    var newPoint;
    var wholeList = [];

    do
    {
      whole_list = [];
      newPoint = generateBoundedInteger(0, diagram.vertices.length - 1);
      Array.prototype.push.apply(wholeList, temp);
      if (otherList)
      {
        Array.prototype.push.apply(wholeList, otherList);
      }
    }
    while (wholeList.includes(newPoint));

    temp.push(newPoint);
  }

  return temp;
}




Map.prototype.generateObstacles = function ( )
{
  var num_obstacles = generateBoundedInteger(this.config.min_num_obstacles, this.config.max_num_obstacles);
  for (var obstacleIndex = 0; obstacleIndex < num_obstacles; obstacleIndex++)
  {
    var randomCoord = this.generateRandCoords();
    this.obstacles.push(randomCoord);
  }
}

Map.prototype.generateStations = function  ( )
{
  var upperBound = Math.min(this.diagram.vertices.length, this.config.max_num_stations);
  var numStations = generateBoundedInteger(this.config.min_num_stations, upperBound);

  this.stations = this.createUniqueVertexList(numStations, undefined, undefined);
}

Map.prototype.generateJunctions = function ( )
{
  var upperBound = this.stations.length;
  var numJunctions = generateBoundedInteger(this.config.min_num_junctions, upperBound);

  this.junctions = this.createUniqueVertexList(numJunctions, undefined, this.stations);
}

Map.prototype.generatePaths = function ( )
{
  for (var i = 0; i < this.stations.length - 2; i++)
  {
    var a= this.stations[i];
    var b = this.stations[i+1];
    var path = new Path ( a, b, this );
    path.loadFromParentMap( bfs( this.adjList.verts, this.adjList.adjacent, a, b));
    this.paths.push(path);
  }
}

function get_all_vertices_connected(diagram, s)
{
  var hits = [s];
  var queue = [s];
  while (queue.length > 0)
  {
    let current = queue.shift();
    for (edge of diagram.edges)
    {
      var next = null;
      if (current == edge.va)
        next = edge.vb;

      if (current == edge.vb)
        next = edge.va;
      
      if (next != null)
      {
        if (!hits.includes(next))
        {
          hits.push(next);
          queue.push(next);
        }
      }
    }
  }
  return hits;
}


Map.prototype.removeBorderCellsFromDiagram = function ( )
{
  diagram = this.diagram;
  // TODO: update Vertices and Cells
  // Already gets good Edges!
  // remove the bounding box

  var internalCells = [];
  var borderCells = [];

  var borderEdges = [];
  var internalEdges = [];

  // edges with an rSite null are automatically border edges (by definition)
  for (var edge of diagram.edges)
  {
    if (edge.rSite != null)
      internalEdges.push(edge);
    else
      borderEdges.push(edge);
  }


  // any cell that contains an edge classified as a borderEdge is
  // a border cell automatically (by definition)
  for (cell of diagram.cells)
  {
    var isBorderCell = false;

    for (halfEdge of cell.halfedges)
    {
      if (halfEdge.edge.rSite == null)
      {
        isBorderCell = true;
        break; // no need to search further
      }
    }

    if ( isBorderCell )
      borderCells.push(cell);
    else
      internalCells.push(cell);
  }


  // any cell that is enclosed in border cells
  // is not useful for the purposes of generating
  // the grid (isolated cycle) so we classify
  // them as border cells as well
  for (var cell_i = 0; cell_i < internalCells.length; cell_i++)
  {
    let cell = internalCells[cell_i];

    var isCellEnclosedByBorderCells = true;
    
    for (halfEdge of cell.halfedges)
    {
      // adjacentSite is the site that is not the current cell
      var adjacentSite = halfEdge.edge.lSite;
      if (adjacentSite == cell.site)
        adjacentSite = halfEdge.edge.rSite;

      var isAdjacentBorderCell = false;

      // if the adjacentSite corresponds to a border cell, then we know
      // it is a border cell
      for (testCell of borderCells)
      {
        if (testCell.site == adjacentSite)
        {
          // matches and is a border cell
          isAdjacentBorderCell = true;
          break;
        }
      }

      if (!isAdjacentBorderCell)
      {
        isCellEnclosedByBorderCells = false;
        break;
      }
    }

    if (isCellEnclosedByBorderCells)
    {
      for (halfedge of cell.halfedges)
      {
        borderEdges.push(halfedge.edge);
      }

      borderCells.push(cell);
      internalCells.splice(cell_i, 1);
      cell_i--;
    }
  }

  // for those edges that were not on the bounding box, we determine if the
  // edge divides two border cells, if so, we push it to the border edges

  for (var edge_i = 0; edge_i < internalEdges.length; edge_i++)
  {
    let edge = internalEdges[edge_i];
    var isLeftBorderCell = false;
    var isRightBorderCell = false;
    var isNearBoundingBox = false;
    
    for (cell of borderCells)
    {
      // the left side is a border cell
      if (edge.lSite == cell.site)
        isLeftBorderCell = true;

      // the right side is a border cell
      if (edge.rSite == cell.site)
        isRightBorderCell = true;
    }

    for ( vert of [edge.va, edge.vb] )
    {
      if (approx(vert.x,this.boundingBox.xr) || approx(vert.x, this.boundingBox.xl) || approx(vert.y, this.boundingBox.yt) || approx(vert.y, this.boundingBox.yb))
        isNearBoundingBox = true;
    }

    if ((isRightBorderCell && isLeftBorderCell) || isNearBoundingBox)
    {
      borderEdges.push(edge);
      internalEdges.splice(edge_i, 1);
      edge_i--;
    }
  }

  this.diagram.edges = internalEdges;

  diagram.vertices = diagram.vertices.filter(function ( vert ) {
    
    var isBoundary = true;
    for (edge of this.diagram.edges)
    {
      if (edge.va == vert || edge.vb == vert)
      {
        isBoundary = false;
        break;
      }
    }

    return !isBoundary;

  });


  var tempVerts = diagram.vertices.slice(0);
  var clumps = [];
  var num = 0;
  var first;
  var largest = 0;
  
  while (tempVerts.length > 0 && num < 50)
  {
    first = tempVerts[0];
    clumps[num] = get_all_vertices_connected(this.diagram, first);
    tempVerts = tempVerts.filter(function(vert) {
      return !clumps[num].includes(vert);
    });
    
    if (clumps[largest] < clumps[num])
    {
      largest = num;
    }

    num++;

  }

  diagram.vertices = clumps[largest];

  diagram.edges = diagram.edges.filter(function ( edge ) {
    for (vert of diagram.vertices)
    {
      if (vert == edge.va || vert == edge.vb)
      {
        return true;
      }
    }
    return false;
  });
}


Map.prototype.generateMap = function ( )
{

  // generate a voronoi map of potential train routes
  var voronoi = new Voronoi();
  this.generateObstacles();
  this.diagram = voronoi.compute(this.obstacles, this.boundingBox);
  return this.diagram;
}


Map.prototype.initialize = function ( )
{
  this.generateMap();
  this.removeBorderCellsFromDiagram();

  this.generateStations();
  this.generateJunctions();

  this.diagramToAdjacencyList();

  this.generatePaths();

}

Map.prototype.distBetween = function(a, b)
{
  return dist(this.getVert(a), this.getVert(b));
}

Map.prototype.diagramToAdjacencyList = function ( )
{
  var adjList = {verts: [], adjacent: {}};

  var opposite = function (indicator)
  {
    if (indicator == 'a')
      return 'b';
    else
      return 'a';
  }

  for (var edge of diagram.edges)
  {
    
    var vert_ia = adjList.verts.indexOf(edge.va);
    var vert_ib = adjList.verts.indexOf(edge.vb);

    if (vert_ia < 0)
    {
      adjList.verts.push(edge.va);
      vert_ia = adjList.verts.indexOf(edge.va);
      adjList.adjacent[vert_ia] = [];
    }

    if (vert_ib < 0)
    {
      adjList.verts.push(edge.vb);
      vert_ib = adjList.verts.indexOf(edge.vb);
      adjList.adjacent[vert_ib] = [];
    }
    
    adjList.adjacent[vert_ia].push(vert_ib);
    adjList.adjacent[vert_ib].push(vert_ia);
  }
   

  this.adjList = adjList;
}

Map.prototype.getVert = function ( i )
{
  return this.adjList.verts[i];
}

Map.prototype.getAdj = function ( i )
{
  return this.adjList.adjacent[i];
}


// Drawing Functions
Map.prototype.drawEdges = function ( )
{
  for (var edge of this.diagram.edges)
  {
    draw.cxnV2(edge.va, edge.vb);
  }
}


Map.prototype.drawStations = function ( )
{
  for (station of this.stations)
  {
    draw.circleV2( this.getVert(station), this.config.station_size);
    if (this.selectedVerts.includes(station))
    {
      draw.circleV2(this.getVert(station), this.config.station_size * 1.5);
    }
  }
}

Map.prototype.drawJunctions = function ( )
{
  for (junction of this.junctions)
  {
    draw.circleV2(this.getVert(junction), this.config.junction_size);
    if (this.selectedVerts.includes(junction))
    {
      draw.circleV2(this.getVert(junction), this.config.junction_size * 1.5);
    }
  }
}

Map.prototype.drawPaths = function ( )
{
  for (path of this.paths)
  {
    path.drawPath();
  }
}

Map.prototype.render = function ( )
{
  draw.clear();
  this.drawEdges();
  this.drawStations();
  this.drawJunctions();
  this.drawPaths();
}


Map.prototype.addToInterval = function ( fn, code )
{
  this.intervalFns[code] = fn;
}

Map.prototype.removeInterval = function ( code )
{
  delete this.intervalFns[code];
}

Map.prototype.play = function ( )
{
  var self = this;
  if (this.interval != null)
  {
    return;
  }

  this.interval = window.setInterval(function ( ) {
    if (Object.keys(self.intervalFns).length == 0)
    {
      self.render();
    }
    else
    {
      for (funct of Object.keys(self.intervalFns))
      {
        self.intervalFns[funct]();
      }
    }
  }, 100)
}

Map.prototype.end = function ( )
{
  clearInterval(this.interval);
}