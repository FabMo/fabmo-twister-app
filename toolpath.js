
var DEG2RAD = 0.0174533;
var RAD2DEG = 1.0/DEG2RAD;
var TWOPI = 2.0*Math.PI;

function TurningMachine(sourceCanvas, options) {
  var options = options || {};

  this.sourceCanvas = sourceCanvas;
  this.bitCanvas = options['bitCanvas'];

  this.bitDiameter = options['bitDiameter'] || 0.125
  this.stockDiameter = options['stockDiameter'] || 1.15
  this.turns = options['turns'] || 0.5
  this.length = options['length'] || 6.0

  this._center = {x:this.sourceCanvas.width/2, y:this.sourceCanvas.height/2}
  this._sourceDiameter = this._getSourceDiameter()
  this._pixelsPerInch = this._sourceDiameter/this.stockDiameter
  this._bitDiameterPx = this.bitDiameter*this._pixelsPerInch

  console.log(this._center)
  console.log(this._sourceDiameter)
  console.log(this._pixelsPerInch)
  console.log(this._bitDiameterPx)

  this.crossSection = this._computeCrossSectionToolpath();
}

TurningMachine.prototype._testCut = function(bitDiameterPx, depth) {

  // Get the canvas element and set its dimensions
  var bitCanvas = this.bitCanvas || document.createElement('canvas');
  bitCanvas.width = this._bitDiameterPx
  bitCanvas.height = this.sourceCanvas.height/2
  var bitContext = bitCanvas.getContext('2d')
  
  var center = {
    x : this.sourceCanvas.width/2,
    y : this.sourceCanvas.height/2
  }

  // Draw the bit silhouette
  bitContext.globalCompositeOperation = 'source-over'
  if(depth > bitDiameterPx/2) {
    bitContext.fillRect(0,0,bitDiameterPx,depth-this._bitDiameterPx/2)
  }
  bitContext.arc(bitDiameterPx/2,depth-bitDiameterPx/2,bitDiameterPx/2,0,TWOPI)
  bitContext.fill()
  
  // Draw the original image, with the composition set to only keep pixels where there's overlap
  bitContext.globalCompositeOperation = 'source-in'
  bitContext.drawImage(this.sourceCanvas, center.x-bitDiameterPx/2, 0, bitDiameterPx, this.sourceCanvas.height/2, 0,0,bitDiameterPx, this.sourceCanvas.height/2)

  // Test for *any* pixels in the image.  If so, there is overlap, and the bit is in the material
  var imgData = bitContext.getImageData(0,0, bitDiameterPx, depth);
  for(var i=3; i<imgData.data.length; i+=4) {
    if(imgData.data[i] !== 0) {
      return true;
    }
  }
  return false;
}


// Get the diameter of a silhouette drawn on a canvas (starting at the middle of the canvas)
TurningMachine.prototype._getSourceDiameter = function() {
  //console.log(this._center)
	var ctx = this.sourceCanvas.getContext('2d');
  var imgData = ctx.getImageData(0,0,this.sourceCanvas.width, this.sourceCanvas.height);
  var radius = 0;
  for(var i=3; i<imgData.data.length; i+=4) {
  	if(imgData.data[i] !== 0) {
    	var pos = (i-4);
      var x = (pos / 4) % this.sourceCanvas.width;
			var y = Math.floor((pos / 4) / this.sourceCanvas.width);
      var dist = Math.sqrt((x-this._center.x)*(x-this._center.x) + (y-this._center.y)*(y-this._center.y));
    	if(dist > radius) {
      	radius = dist;
      }
    }
  }
  return 2*radius;
}

TurningMachine.prototype._findDepth = function(bitDiameter) {
  
  var l = 1
  var r = (this.sourceCanvas.height/2 + 1)
  // Binary search for a bit hit
  while(true) {
    if(l > r) {
      return (this.sourceCanvas.height/2 - (m-1))
    }
    var m = Math.floor((l+r)/2)
    if(this._testCut(bitDiameter, m)) {
      r = m - 1
    } else {
      l = m + 1
    }
  }
}

TurningMachine.prototype._computeCrossSectionToolpath = function() {

  // Create a memory canvas and copy off the cross section
  var memoryCanvas = document.createElement('canvas')
  memoryCanvas.width = this.sourceCanvas.width
  memoryCanvas.height = this.sourceCanvas.height
  memoryCanvas.getContext("2d").drawImage(this.sourceCanvas, 0, 0, this.sourceCanvas.width, this.sourceCanvas.height)

  var ctx = memoryCanvas.getContext("2d");
  var result = []
  var angle = 0;
  var as = 0.5;
  console.log("Center", this._center)

  while(angle < 360) {
    var rot = angle*DEG2RAD;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0,0,this.sourceCanvas.width,this.sourceCanvas.height)

    //Translate to the origin, rotate, translate back
    ctx.translate(this._center.x,this._center.y)
    ctx.rotate(rot);
    ctx.translate(-this._center.x,-this._center.y)
    ctx.drawImage(memoryCanvas,0,0,this.sourceCanvas.width, this.sourceCanvas.height)
    result.push({theta:angle*DEG2RAD, r:this._findDepth(this._bitDiameterPx)/this._pixelsPerInch})
    angle += as;
  }
  return result;
}

function getDepth(values, angle) {
  while(angle > TWOPI) {angle -= TWOPI;}
  for(var i=0; i<values.length; i++) {
    if(values[i].theta >= angle) {
      var x = angle;
      var v0 = values[i]
      var v1 = values[i-1 < 0 ? values.length-1 : i-1]
      var y = v0.r + (x-v0.theta)*((v1.r-v0.r)/(v1.theta-v0.theta))
      //write(i + " " + angle + " " + values[i].theta)
      return y;
    }
  }
  throw new Error("Couldn't get depth for " + angle);
}

TurningMachine.prototype.postSBP = function(options) {
  options = options || {}
  var stepOverLinear = options['stepOver'] || 0.005

  var circumference = Math.PI*this.stockDiameter
  var steps = Math.ceil(circumference/stepOverLinear)
  var stepOverAngle = TWOPI/steps

  var theta = 0
  var file = []

  file.push("MS,4,,,270 ' Set Speeds")
  file.push("SO,1,1 ' Spindle on")
  file.push("PAUSE 3 ' Spin up")
  file.push("JZ," + (this.crossSection[0].r + 0.5).toFixed(3) + " ' Pull up to clear")
  file.push("J5,0,0,,,0 ' Jog home")

  try {
    while(theta < TWOPI) {
      var d = getDepth(this.crossSection, theta);
      var degrees = RAD2DEG*theta;
      file.push("MB," + (degrees).toFixed(4) + "  ' Step")
      file.push("MZ," + d.toFixed(4) + "  ' Plunge");
      file.push("M5,," + this.length.toFixed(4) + ",,," + (degrees + this.turns*360.0).toFixed(4) + "  ' Down")
      file.push("M5,," + 0 + ",,," + (degrees).toFixed(4) + "  ' Back")
      theta += stepOverAngle;
    }
  } catch(e) {
    console.error(e)
  }

  file.push("JZ," + (this.crossSection[0].r + 0.5).toFixed(3) + " ' Pull up to clear")
  file.push("J5,0,0,,,0 ' Jog home")
  return file
}

TurningMachine.prototype.render = function(canvas) {

  canvas = canvas || document.createElement('canvas')
  canvas.width = this.sourceCanvas.width
  canvas.height = this.sourceCanvas.height 

  var ctx = canvas.getContext("2d");

  var theta = 0
  while(theta < TWOPI) {
    var depth = this._pixelsPerInch*getDepth(this.crossSection, theta);
    //console.log(depth)
    ctx.fillStyle = 'rgba(0,0,64,255)'
    ctx.fillRect(this._center.x-this._bitDiameterPx/2,
      this._center.y + depth + this._bitDiameterPx/2,this._bitDiameterPx,2*this._center.y)
    ctx.beginPath()
    ctx.arc(this._center.x,this._center.y + depth + this._bitDiameterPx/2,this._bitDiameterPx/2,0,TWOPI)
    ctx.fill()
    ctx.translate(this._center.x,this._center.y)
    ctx.rotate(0.5*DEG2RAD);
    ctx.translate(-this._center.x,-this._center.y)
    theta += 0.5*DEG2RAD;
  }
  return canvas
}

TurningMachine.prototype.getBoundaryPoints = function(canvas) {
  var cvs = this.render(canvas);
  //console.log(cvs)
  var ctx = cvs.getContext('2d')
  var imgData = ctx.getImageData(0,0,cvs.width, cvs.height);
  var result = {}
  //var pxCount = 0
  var startPoint = null;
  //console.log("imgdata length", imgData.data.length)
  for(var x = 1; x<cvs.width-1; x++) {
    for(var y = 1; y<cvs.height-1; y++) {
        var aidx = y * (cvs.width * 4) + x * 4 + 3    
        var neighbors = [
            y * (cvs.width * 4) + (x-1) * 4 + 3,
            y * (cvs.width * 4) + (x+1) * 4 + 3,
            (y+1) * (cvs.width * 4) + (x) * 4 + 3,
            (y-1) * (cvs.width * 4) + (x) * 4 + 3
        ]
        if(imgData.data[aidx] !== 0) {
          var hit = false;
          for(var j=0; j<4; j++) {
            if(imgData.data[neighbors[j]] === 0) {
              hit = true;
            }
          }
          if(hit) { 
            if(!startPoint) {
              startPoint = [x,y];
            }
            result[[x,y]] = 1;
          }
        }
    }
  }

  var currentPoint = startPoint;
  var seen = {}
  var ordered_points = []
  while(true) {
    ordered_points.push(currentPoint);
    var neighbors = [
      [currentPoint[0]+1, currentPoint[1]],
      [currentPoint[0]-1, currentPoint[1]],
      [currentPoint[0], currentPoint[1]+1],
      [currentPoint[0], currentPoint[1]-1],
      [currentPoint[0]+1, currentPoint[1]+1],
      [currentPoint[0]-1, currentPoint[1]-1],
      [currentPoint[0]+1, currentPoint[1]-1],
      [currentPoint[0]-1, currentPoint[1]+1],
    ]
    var hit = false
    for(var i=0; i<8; i++) {
      if(result[neighbors[i]]) {
        //ordered_points neighbors[i];
        delete result[neighbors[i]];
        currentPoint = neighbors[i];
        hit = true;
        break;
      }
    }
    if(!hit) {break;}
  }
  //console.log(ordered_points.length + " Ordered points");
  var sorted =  ordered_points.map(function(pt) { 
    return { 
      x : (pt[0]-cvs.width/2)/this._pixelsPerInch,
      y : (pt[1]-cvs.height/2)/this._pixelsPerInch
    }
  }.bind(this));
  //console.log(sorted)
  return sorted
}