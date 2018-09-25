//ctrlCanvas
//ctrlDraw

function Dashboard ( id )
{
  this.HTMLElement = document.getElementById(id);
  this.controlSets = [];

  var title = document.createElement('h2');
  title.appendChild(document.createTextNode('Dashboard'));
  this.HTMLElement.appendChild(title);

  this.HTMLElement.style.backgroundColor = draw.colors.TANGO;
  this.HTMLElement.style.width = window.innerWidth * 0.2;
  this.HTMLElement.style.height = window.innerHeight;

}

Dashboard.prototype.addControlsFor = function( train )
{
  var controls = document.createElement('div');

  var label = document.createTextNode('Train ' + (this.controlSets.length + 1));
  controls.appendChild(label);

  var plusButton = document.createElement('button');
  plusButton.appendChild(document.createTextNode('+'));
  plusButton.addEventListener('click', function ( ) {
    train.speed += 5;
  });
  controls.appendChild(plusButton);

  var minusButton = document.createElement('button');
  minusButton.appendChild(document.createTextNode('-'));
  minusButton.addEventListener('click', function ( ) {
    train.speed -= 5;
  });
  controls.appendChild(minusButton);

  this.HTMLElement.appendChild(controls);
  this.controlSets.push(controls);
}