function Train ( )
{
  this.numCars = 1;
  this.speed = 5;
  this.currentPath = null;
  this.currentDist = null;
  this.moving = false;
  this.docked = true;
  this.actualPositions = [];
}

Train.prototype.setPath = function(path)
{
  this.currentPath = path;
  this.currentDist = 0;
  this.moving = false;
  this.docked = true;
}

Train.prototype.renderable = function ( )
{
  if (this.currentPath == null)
    return false;

  if (this.currentDist == null)
    return false;

  if (this.currentDist == this.currentPath.getLength() + 20 * this.numCars)
    return false;

  if (this.currentDist > 0 && this.docked)
    return false;

  return true;
}

Train.prototype.start = function ( ) {
  return this.currentDist;
}

Train.prototype.end  = function ( ) {
  return this.currentDist + this.numCars * 20 + 7;
}

Train.prototype.render = function ( )
{
  var CAR_OFFSET = 20;
  if (!this.renderable())
  {
    //throw "cannot render without a path!"
    return;
  }

  var pathLength = this.currentPath.getLength();
  var trainLength = CAR_OFFSET * this.numCars;

  var finalDist = pathLength + trainLength;

  var SIZE_OF_TRAIN = 7;

  var carLocs = [];
  for (var car = 0; car < this.numCars; car++)
  {
    var localLength = this.currentDist - 20 * car;
    if (localLength > 0 && localLength < pathLength)
    {
      carLocs.push([this.currentPath.getLocationAt(localLength), this.currentPath.getDirectionAt(localLength)]);
    }
  }
  this.actualPositions = [];
  for (loc of carLocs)
  { 
    var temp = Vector2.from(loc[0]);
    // y is width, x is length
    draw.rectV2(loc[0], {x: SIZE_OF_TRAIN * 2, y: SIZE_OF_TRAIN}, loc[1]);
    
    this.actualPositions.push( temp );

  }
}

Train.prototype.move = function ( num )
{
  this.currentDist += num;
  var endLength = this.currentPath.getLength() + 20 * this.numCars;
  if (this.currentDist < endLength)
  {
    this.moving = true;
    this.docked = false;
  }
  else
  {
    this.moving = false;
    this.docked = true;
  }
}