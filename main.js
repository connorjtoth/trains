
var gameMap = new Map();
var dashboard = new Dashboard('dashboard');

gameMap.setDashboard(dashboard);

gameMap.updateBoundingBox();

gameMap.initialize();


gameMap.render();
// {data: {x,y}, adjacent: [indices of neighbors]}
// convert into a more manageable format (i hate the library's)


// now we tween
// t: current time, b: begInnIng value, c: change In value, d: duration
function tween(t, b, c, d)
{
  return c * ( t / d ) + b;
}

function tweenV2(t, b, c, d)
{
  var x = tween(t, b.x, c.x, d);
  var y = tween(t, b.y, c.y, d);
  return new Vector2(x,y);
}

/*
  var lastInfo;
function followEdge(v1, v2, callback)
{
  var RATE = 5;
  var delta_x = v2.x - v1.x;
  var delta_y = v2.y - v1.y;
  var total_dist = dist(v2, v1);
  var tween_div = Math.ceil(total_dist / RATE);

  if (tween_div == 0) // bad math = bad time
  {
    return callback();
  }

  var i = 1;
  var interval = window.setInterval( function ( ) {

    if (lastInfo)
    {
      cxt.putImageData(lastInfo.data, lastInfo.bounds.xl, lastInfo.bounds.yt);
      delete lastInfo;
    }
    var pos_x = tween(i, v1.x, delta_x, tween_div);
    var pos_y = tween(i, v1.y, delta_y, tween_div);

    lastInfo = getImageDataAbout(pos_x, pos_y, 20);

    createCircle(cxt, pos_x, pos_y, 5, true);
    
    if (tween_div == i)
    {
      clearInterval(interval);
      return callback();
    }
    else
    {
      i++;
    }
  }, 100);
}


/*


function pathRepeater(i, list)
{
  if (i < list.length - 1)
  {
    var v1 = verts[list[i]];
    var v2 = verts[list[i+1]];
    followEdge(v1, v2, function() {
      pathRepeater(i+1, list); 
    });
  }
}


function followPath(path, i, callback)
{
  var runner = path.endpoints[1];

  var path_inorder = [];
  while (runner != path.endpoints[0])
  { 
    path_inorder.push(runner);
    runner = path.parent[runner];
  }
  path_inorder.push(path.endpoints[0]);

  pathRepeater(0, path_inorder);
}

///followPath(newPath[0]);



function drawTrain(path, dist, numCars)
{
  var SIZE_OF_TRAIN = 7;
  var total_length = path.getLength();
  var length = total_length * dist;
  var carLocs = [];
  for (var car = 0; car < numCars; car++)
  {
    var localLength = length - 20 * car;
    if (localLength > 0 && localLength < total_length)
      carLocs.push([path.getLocationAt(localLength),path.getDirectionAt(localLength)]);
  }

  for (loc of carLocs)
  {
    drawRectangleV2(cxt, loc[0], {x:SIZE_OF_TRAIN*2, y:SIZE_OF_TRAIN}, loc[1]);
  }
}


function trainPath ( path, numCars, callback )
{

  // width between train cars
  var CAR_OFFSET = 20;

  // time to redraw frames
  var TIME_BETWEEN_REDRAW = 100;

  // speed at which the train is travelling in pixels/iteration
  var speed = 5;
  
  // pixel length of the path to traverse
  var pathLength = path.getLength();
  
  // pixel length of the train
  var trainLength = CAR_OFFSET * numCars;

  // iterations for a point-object to traverse the path
  var pointIterations = Math.ceil( pathLength / speed );

  // iterations for the last train car to complete traversal
  var trainIterations = Math.ceil( (pathLength + trainLength ) / speed);

  // accumulator tracking how many iterations have occured
  var currentIteration = 1;

  // if there is no distance to travel, do not even try rendering
  // an image
  if (pointIterations <= 0)
  {
    return callback();
  }


  var interval = window.setInterval( function ( ) {

    // redraw the map and remove the train that is on the map now
    gameMap.render();

    // move the train to the next position (determined by percent of poinIterations completed)
    // when percent is under 100, then the train is drawn along the path,
    // when percent is 100, the train's lead car is drawn at the end of the path
    // when percent is over 100, the train's tail is being drawn going into the end of the path
    drawTrain(path, currentIteration/pointIterations, numCars);
    
    // if the train has not been completely enveloped by the endpoint, continue
    // otherwise, we callback and stop
    if (trainIterations == currentIteration)
    {
      clearInterval(interval);
      return callback();
    }
    else
    {
      currentIteration++;
    }
  }, TIME_BETWEEN_REDRAW);
}
*/





var mainTrain = new Train();
mainTrain.speed = 10;
mainTrain.setPath(gameMap.paths[0]);
var secondTrain = new Train();
secondTrain.numCars = 10;
secondTrain.setPath(gameMap.paths[1]);

gameMap.addTrain(mainTrain);
gameMap.addTrain(secondTrain);


gameMap.addToInterval(function ( ) {

  gameMap.render();
  var cont = false;

  for (train of gameMap.trains)
  {
    if (train.renderable())
    {
      cont = true;
      train.render();
      train.move(train.speed);
    }
  }

  if (!cont)
  {
    gameMap.removeInterval(5454);
    console.log('All done!');
    console.log(gameMap.trains);
  }

  gameMap.detectCollisions();

}, 5454);


function onCanvasClicked ( event )
{
  var pos = new Vector2(event.offsetX, event.offsetY);
  
  for (station of gameMap.stations)
  {
    var tempDist = dist(pos, gameMap.getVert(station));
    if (tempDist < gameMap.config.station_size)
    {
      return onStationClicked(station);
    }
  }

  for (junction of gameMap.junctions)
  {
    var tempDist = dist(pos, gameMap.getVert(junction));
    if (tempDist < gameMap.config.junction_size)
    {
      return onJunctionClicked(junction);
    }
  }

  gameMap.selectedVerts.splice(0);

  return false;

}


function onStationClicked (station)
{
  // if it is already in the map, then we remove it
  if (gameMap.selectedVerts.includes(station))
  {
    gameMap.selectedVerts.splice(gameMap.selectedVerts.indexOf(station), 1);
    return;
  }

  // if it is not in the map, then it must only be selected with other stations
  // otherwise empty the selection
  if (!gameMap.stations.includes(gameMap.selectedVerts[0]) )
    gameMap.selectedVerts.splice(0);

  // if we only have other stations, we can only select up to two
  if ( gameMap.selectedVerts.length == 2 )
    gameMap.selectedVerts.splice(1);

  gameMap.selectedVerts.push(station);
  draw.circleV2(gameMap.getVert(station), gameMap.config.station_size * 1.5);
}

function onJunctionClicked (junction)
{
  if (gameMap.selectedVerts.includes(junction))
  {
    gameMap.selectedVerts.splice(0);
    return;
  }
  gameMap.selectedVerts.splice(0);
  gameMap.selectedVerts.push(junction);
  draw.circleV2(gameMap.getVert(junction), gameMap.config.junction_size * 1.5);
}


canvas.addEventListener('click', onCanvasClicked, false);

//trainPath(gameMap.paths[0], 12);

var onResize = function ( ) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  gameMap.updateBoundingBox();
}

onResize();
//window.addEventListener('resize', onResize);



gameMap.play();