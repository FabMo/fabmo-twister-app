var DEG2RAD = 0.0174533;
var RAD2DEG = 1.0/DEG2RAD;
var TWOPI = 2.0*Math.PI;

/*
 * The turning machine is an object that takes a source canvas, which contains a black and white image
 * describing the cross section of a turned part, and turns it into a toolpath, which can then be extruded
 * along a linear axis, while being rotated.  The TurningMachine doesn't need to operate on a canvas
 * that is displayed, but you can display the canvas to get an idea of what is going on.
 * 
 * The algorithm that does the toolpath calculation accounts for bit size and shape in doing its computations.
 * A ball-nose cutter is assumed for now, but the algorithm supports any shape of cutter.
 *
 * options
 *  - bitDiameter   [0.125]  The diameter of the bit being used.  A ball-nose cutter is assumed, for now.
 *  - stockDiameter [1.0]    The diameter of the stock to be turned.  For toolpathing purposes, the z-zero location
 *                           is assumed to be at the center of the stock.
 *  - turns                  The number of turns to rotate the cross section along the length of the turning.  Can be fractional.
 *  - length [6.0]           The length of the stock (in inches)
 *  - linearAxis [Y]         The axis to use as the linear axis 
 *  - rotaryAxis [B]         The axis to use as the rotary axis
 */
function TurningMachine(sourceCanvas, options) {
  var options = options || {};
  console.info(options)
  this.sourceCanvas = sourceCanvas;
  this.bitCanvas = options['bitCanvas'];

  this.bitDiameter = options['bitDiameter'] || 0.125
  this.stockDiameter = options['stockDiameter'] || 1.0
  this.turns = options['turns'] || 0
  this.length = options['length'] || 6.0
  this.linearAxis = options['linearAxis'] || 'Y'
  this.rotaryAxis = options['rotaryAxis'] || 'B'

  this._center = {x:this.sourceCanvas.width/2, y:this.sourceCanvas.height/2}
  this._sourceDiameter = this._getSourceDiameter()
  this._pixelsPerInch = this._sourceDiameter/this.stockDiameter
  this._bitDiameterPx = this.bitDiameter*this._pixelsPerInch

  this.crossSection = this._computeCrossSectionToolpath();
}

/*
 * This function performs a "test cut" by overlaying the image of a bit with the image of the material 
 * cross section at the provided depth.  It is this method that allows us to use any bit diameter we like.
 * The bit image used here is simply the cross section of a ball-nose cutter, but a straight cutter, or a 
 * V-Bit or any other shape could be generated and used here just as easily.
 *
 * Returns true if the bit overlaps the material, false otherwise.
 */
TurningMachine.prototype._testCut = function(cvs, bitDiameterPx, depth) {

  // Create a bit canvas if one does not exist and set its dimensions
    var bitCanvas = document.createElement('canvas') || this.bitCanvas;
    bitCanvas.width = this._bitDiameterPx
    bitCanvas.height = cvs.height/2
  
    this.bitCanvas = bitCanvas;
    var bitContext = bitCanvas.getContext('2d');

  // Compute the center of the canvas (material canvas)
  var center = {
    x : cvs.width/2,
    y : cvs.height/2
  }

  // Draw the bit silhouette onto the bit canvas
  // This is where the shape of the bit could be modulated (and a vee or rectangular shape could be used, for example)
  bitContext.globalCompositeOperation = 'source-over'
  if(depth > bitDiameterPx/2) {
    bitContext.fillRect(0,0,bitDiameterPx,depth-this._bitDiameterPx/2)
  }
  bitContext.arc(bitDiameterPx/2,depth-bitDiameterPx/2,bitDiameterPx/2,0,TWOPI)
  bitContext.fill()
  
  // Draw the original image, with the composition set to only keep pixels where there's overlap
  bitContext.globalCompositeOperation = 'source-in'
  bitContext.drawImage(cvs, center.x-bitDiameterPx/2, 0, bitDiameterPx, cvs.height/2, 0,0,bitDiameterPx, cvs.height/2)

  // Test for *any* pixels in the image.  If so, there is overlap, and the bit is in the material
  var imgData = bitContext.getImageData(0,0, bitDiameterPx, depth);
  for(var i=3; i<imgData.data.length; i+=4) {
    if(imgData.data[i] > 128) {
      return true; // Bail out of the loop at the first overlapping pixel found.  No need to test them all.
    }
  }
  return false;
}


// Get the diameter of a silhouette drawn on a canvas (starting at the middle of the canvas)
TurningMachine.prototype._getSourceDiameter = function() {
	var ctx = this.sourceCanvas.getContext('2d');
  var imgData = ctx.getImageData(0,0,this.sourceCanvas.width, this.sourceCanvas.height);
  var radius = 0;

  // Find the maximum distance of any opaque pixel to the center of the image.  This is the max radius.
  // i starts at 3 and increments by 4 because that's the index of the alpha value of each pixel which is the only
  // one we're examining for the purposes of evaluating "a hit"
  for(var i=3; i<imgData.data.length; i+=4) {
  	if(imgData.data[i] >= 128) {
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

/*
 * Starting with the depth at the shallowest, perform a _testCut 
 * in a binary search fashion to find the depth where the bit just intesects
 * with the surface of the material.
 */
TurningMachine.prototype._findDepth = function(cvs, bitDiameter) {
  
  var l = 1
  var r = (cvs.height/2 + 1)
  // Binary search for a bit hit
  while(true) {
    if(l > r) {
      return (cvs.height/2 - (m-1))
    }
    var m = Math.floor((l+r)/2)
    if(this._testCut(cvs, bitDiameter, m)) {
      r = m - 1
    } else {
      l = m + 1
    }
  }
}

/*
 * Perform the full toolpath cross-section computation, by the following process:
 * 1) Create a copy of the source canvas to work with in memory.
 * 2) Set angle=0
 * 3) Draw the source canvas onto the memory canvas, rotated by angle
 * 4) Call _findDepth to determine how deep the bit needs to plunge to produce the desired cross section 
      at the current rotation.  Store that depth and the rotation angle from which it was calculated.
 * 5) Increment the rotation angle by a small amount
 * 6) If angle >= 360 return the map of angles to depths, otherwise:
 * 7) Repeat from step 3, storing the new depth with the new angle
 */
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

  while(angle < 360) {
    var rot = angle*DEG2RAD;

    // Clear the transform state and all the pixels on the canvas each iteration
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0,0,memoryCanvas.width,memoryCanvas.height)

    //Translate to the origin, rotate, translate back
    ctx.translate(this._center.x,this._center.y)
    ctx.rotate(rot);
    ctx.translate(-this._center.x,-this._center.y)
    ctx.drawImage(this.sourceCanvas,0,0,this.sourceCanvas.width, this.sourceCanvas.height)

    // Actually compute the depth and add it to the "toolpath"
    var depth = this._findDepth(memoryCanvas, this._bitDiameterPx)/this._pixelsPerInch;
    result.push({theta:angle*DEG2RAD, r:depth})

    // Increment the angle
    angle += as;
  }
  return result;
}

/*
 * Using the map of values provided (mapping angle to depth)
 * perform a linear interpolation to get the depth value for the provided angle.
 */
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

// Generate an OpenSBP M5 command from a map of axes to locations
var m5 = function(axisLocations) {
  result = ['M5'];
  var axes = ["X","Y","Z","A","B"];
  axes.forEach(axis => {
    if(axis in axisLocations) {
      result.push(axisLocations[axis].toFixed(5));
    } else {
      result.push('');
    }
  });
  return result.join(',');
}

// Given the already-computed values for this TurningMachine, create an actual OpenSBP file.
// This is equivalent to the post-processor step in any CAM sotware
// 
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
      file.push("M" + this.rotaryAxis + "," + (degrees).toFixed(4) + "  ' Step")
      file.push("MZ," + d.toFixed(4) + "  ' Plunge");

      // the m5 function is used here to handle the fact that axes are adjustable
      file.push(m5({
        [this.linearAxis] : this.length,
        [this.rotaryAxis] : (degrees + this.turns)*360.0
      }));

      file.push(m5({
        [this.linearAxis] : 0,
        [this.rotaryAxis] : degrees
      }));
      theta += stepOverAngle;
    }
  } catch(e) {
    console.warn(e)
  }

  file.push("JZ," + (this.crossSection[0].r + 0.5).toFixed(3) + " ' Pull up to clear")

  // Go home
  file.push(m5({
    [this.linearAxis] : 0,
    [this.rotaryAxis] : 0
  }));
  return file
}

/*
 * Draw the "computed cross section" to the provided canvas.
 * 
 * The computed cross section is the cross section of the part as actually achievable 
 * with the selected bit.  In most cases, it looks like the source cross section, but with
 * sharp corners and undercuts that are not achievable with the provided toolpathing strategy sort of "filed off"
 *
 * This is actually done by using the angle->depth map computed in the toolpathing process to render the bit
 * over and over again on a canvas that is carried through one full rotation.
 */
TurningMachine.prototype.render = function(canvas) {

  canvas = canvas || document.createElement('canvas')
  canvas.width = this.sourceCanvas.width
  canvas.height = this.sourceCanvas.height 

  var ctx = canvas.getContext("2d");

  // Just rotate 0.5 degrees at a time for 360 degrees.  Fine for rendering purposes.
  var theta = 0
  while(theta < TWOPI) {

    // Get the depth at the current rotation (assumes cross section has already been computed)
    var depth = this._pixelsPerInch*getDepth(this.crossSection, theta);

    // Render the bit
    // Like _findDepth(), this function is assuming a ball-nose bit, and would have to be adjusted for other geometries.
    ctx.fillStyle = 'rgba(255,255,255,255)'
    ctx.fillRect(this._center.x-this._bitDiameterPx/2,
    this._center.y + depth + this._bitDiameterPx/2,this._bitDiameterPx,2*this._center.y)
    ctx.beginPath()
    ctx.arc(this._center.x,this._center.y + depth + this._bitDiameterPx/2,this._bitDiameterPx/2,0,TWOPI)
    ctx.fill()
    // Rotate the canvas (translate center to 0,0, rotate, translate back)
    ctx.translate(this._center.x,this._center.y)
    ctx.rotate(0.5*DEG2RAD);
    ctx.translate(-this._center.x,-this._center.y)
    theta += 0.5*DEG2RAD;
  }

  return canvas
}

/* 
 * Given the canvas provided with a rendered cross section, get all the "boundary" points.
 * The boundary points are the outermost points on the cross section.  They are needed to build a 3D model
 * that represents the final turned part.  Typically, the computed cross section (not the source cross-section)
 * is used as the input to this function.  
 * (Although you could use either - it might make an interesting activity to compare the two)
 */
TurningMachine.prototype.getBoundaryPoints = function(canvas) {
  var cvs = this.render(canvas);
  var ctx = cvs.getContext('2d')
  var imgData = ctx.getImageData(0,0,cvs.width, cvs.height);
  var result = {}
  var startPoint = null;

  // Iterate over every pixel in the image, and look at it's neighbors.
  // If this pixel is opaque, and any of its neighbors are transparent,
  // it is a "boundary pixel" - record its location in the result index
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

  // The points selected in the process above are not in any useful order.
  // In the next step, we order them by adjacency, which means to
  // make a list of pixels where adjacent pixels in the list are adjacent in the image too.
  // Choose a start pixel from among those determined to be "boundary pixels" above
  // Look at all the locations in the neighborhood of that pixel until we encounter another one on the boundary
  // Transfer the start pixel to the list of ordered pixels, and repeat the process with the adacent pixel 
  // until all the pixels have been added in this way.  The resulting list is ordered by adjacency.
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

  // Scale all the pixel locations to actual locations
  var sorted =  ordered_points.map(function(pt) { 
    return { 
      x : (pt[0]-cvs.width/2)/this._pixelsPerInch,
      y : (pt[1]-cvs.height/2)/this._pixelsPerInch
    }
  }.bind(this));

  // Smooth things out:
  var start = sorted[0]

  // Since this is a circular path, we want to make sure the smoothing "wraps" so we take the list of points
  // and concatenate it to itself 3 times for simplification
  sorted = sorted.slice(0, sorted.length-1).concat(sorted.slice(0, sorted.length-1)).concat(sorted.slice(0, sorted.length-1))
  
  // Actually simplify the path using simplify.js
  var simp = simplify(sorted, 0.005);
  var start_idx = Math.floor(simp.length/6);

  // Now recover the path from the middle third of the 3x concatenated path by finding
  // the point in the second and fourth sixth of the path that is closest to the start point
  
  // Start point
  var min_dist = 1000000
  for(var i=Math.floor(simp.length/6); i<Math.floor(simp.length/2); i++) {
    var a = simp[i]
    var dist = Math.sqrt((a.x-start.x)*(a.x-start.x) + (a.y-start.y)*(a.y-start.y));
    if(dist < min_dist) {
      min_dist = dist;
      start_idx = i
    }
  }

  // End point
  var end_idx = Math.floor(simp.length/2);
  var min_dist = 1000000
  for(var i=Math.floor(simp.length/2); i<simp.length-Math.floor(simp.length/6); i++) {
    var a = simp[i]
    var dist = Math.sqrt((a.x-start.x)*(a.x-start.x) + (a.y-start.y)*(a.y-start.y));
    if(dist < min_dist) {
      min_dist = dist;
      end_idx = i
    }
  }

  // Return the "middle third" of the simplified path
  var s = simp.slice(start_idx, end_idx)
  return s
}