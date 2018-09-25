function Path ( a, b, gameMap )
{
  this.vertices = [];
  this.edges = [];
  this.parent = {};
  this.child = {};
  this.endpoints = [a,b];
  this.map = gameMap;
}

Path.prototype.loadFromParentMap = function ( parent )
{
  var runner = this.endpoints[1];
  this.parent[this.endpoints[0]] = null;
  this.child[this.endpoints[1]] = null;

  do
  {
    this.vertices.push(runner);
    var temp = parent[runner];
    this.edges.push([runner, temp]);
    this.parent[runner] = temp;
    this.child[temp] = runner;
    runner = temp;
  }
  while ( runner != this.endpoints[0] );
}


Path.prototype.getLength = function ( )
{
  var counter = 0;
  for (edge of this.edges)
  {
    counter += this.map.distBetween(edge[0], edge[1]);
  }
  return counter;
}

Path.prototype.getDirectionAt = function ( length )
{
  var counter = 0;
  var runner = this.endpoints[0];
  var amt = this.map.distBetween(runner, this.child[runner]);

  while (counter + amt < length)
  {
    counter += amt;
    runner = this.child[runner];
    amt = this.map.distBetween(runner, this.child[runner]);
  }

  var child = this.child[runner];
  if (counter + amt == length)
  {
    return new Vector2.zero();
  }
  else
  {
    var runnerVert = this.map.getVert(runner);
    var childVert = this.map.getVert(child);

    // get slope from child-runner
    var delta = Vector2.from(childVert);
    delta.minus(runnerVert).unit();

    return delta;
  }

}


Path.prototype.getLocationAt = function ( length )
{
  var counter = 0;
  var runner = this.endpoints[0];
  var amt = this.map.distBetween(runner, this.child[runner]);
  while (counter + amt < length)
  {
    // if the new segment will not put us over our limit, we continue
    counter += amt;
    runner = this.child[runner];
      amt = this.map.distBetween(runner, this.child[runner]);
  }

  var child = this.child[runner];
  if (counter + amt == length)
  {
    return this.map.getVert(child);
  }
  else
  {
    var runnerVert = this.map.getVert(runner);
    var childVert = this.map.getVert(child);

    // get slope from child - runner
    var delta = Vector2.from(childVert)
    delta.minus(runnerVert);

    var percent = (length - counter) / amt;

    // get the proper percent through the total length of the slope
    delta.times(percent);

    // get appropriate offset from runnerVert
    delta.add(runnerVert);

    return delta;
  }
}

Path.prototype.drawPath = function ( )
{

  var runner = this.endpoints[0];
  while (runner != this.endpoints[1])
  {
    var temp = this.child[runner];
    var v1 = this.map.getVert(runner);
    var v2 = this.map.getVert(temp);

    draw.cxnV2(v1, v2, 3);

    runner = temp;
  }
}