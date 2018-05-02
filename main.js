WIDTH = 400
HEIGHT = 400
BIT_DIAMETER = 30
STOCK_DIAMETER = 2

function write(s) {
  document.getElementById('output').innerHTML += (s + '</br>')
}

// Setup the display canvas
var canvas = document.getElementById('cvs')
canvas.width = WIDTH
canvas.height = HEIGHT

// Draw the profile on the canvas
var ctx = canvas.getContext('2d')
//ctx.moveTo(center.x, center.y-30)
//ctx.arc(center.x, center.y-30, 20, 0, TWOPI)
//ctx.moveTo(center.x, center.y)
//ctx.arc(center.x, center.y, 20, 0, TWOPI)
//ctx.moveTo(center.x, center.y+30)
//ctx.arc(center.x, center.y+30, 20, 0, TWOPI)
//ctx.fillRect(center.x-40, center.y-40, 80, 80)

/*
ctx.beginPath()
ctx.fillRect(center.x-5, center.y-40, 10, 80)
ctx.fillRect(center.x-40, center.y-5, 80, 10)
ctx.arc(center.x, center.y, 15, 0, TWOPI)
ctx.fill()
*/

var center = {x:canvas.width/2, y:canvas.height/2}

ctx.beginPath()
ctx.moveTo(center.x + 30*Math.sin(DEG2RAD*120.0), center.y + 30*Math.cos(DEG2RAD*120.0))
ctx.arc(center.x + 30*Math.sin(DEG2RAD*120.0), center.y + 30*Math.cos(DEG2RAD*120.0), 10, 0, TWOPI)

ctx.moveTo(center.x + 30*Math.sin(DEG2RAD*240.0), center.y + 30*Math.cos(DEG2RAD*240.0))
ctx.arc(center.x + 30*Math.sin(DEG2RAD*240.0), center.y + 30*Math.cos(DEG2RAD*240.0), 10, 0, TWOPI)
ctx.fill()


ctx.moveTo(center.x + 30*Math.sin(DEG2RAD*0), center.y + 30*Math.cos(DEG2RAD*0))
ctx.arc(center.x + 30*Math.sin(DEG2RAD*0), center.y + 30*Math.cos(DEG2RAD*0), 10, 0, TWOPI)
ctx.fill()

/*ctx.beginPath()
ctx.fillStyle = 'black'
ctx.moveTo(center.x, center.y)
ctx.arc(center.x, center.y-40, 40, -Math.PI/2, Math.PI/2)
//ctx.arc(center.x, center.y+40, 40, Math.PI/2, -Math.PI/2)
ctx.arc(center.x, center.y, 30, 0,TWOPI)
ctx.fill()

ctx.beginPath()
ctx.fillStyle = 'black'
ctx.arc(center.x, center.y-45, 15, 0, TWOPI)
ctx.fill()
*/
/*
ctx.fillRect(center.x,center.y-5,80,10)
ctx.fillRect(center.x+70, center.y-20, 10, 40)
ctx.arc(center.x, center.y, 10, 0, TWOPI)
//ctx.arc(center.x+80, center.y, 20, 0, TWOPI)
ctx.fill()
*/

var t = new TurningMachine(canvas, {
  bitDiameter : 0.125,
  stockDiameter : 1.15,
  length : 6.0

});


t.render(document.getElementById('bitcvs'))
write(t.postSBP().join('<br />'))
