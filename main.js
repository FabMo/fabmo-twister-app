WIDTH = 400
HEIGHT = 400
BIT_DIAMETER = 30
STOCK_DIAMETER = 2
TURNS = 1
LENGTH = 6.0

var DEG2RAD = 0.0174533
var RAD2DEG = 1.0/DEG2RAD
var TWOPI = 2.0*Math.PI

var scene, camera, renderer;

function write(s) {
  document.getElementById('output').innerHTML += (s + '</br>')
}

function getOptions() {
	var els = document.getElementsByClassName('opt-num');
	options = {}
	for(var i=0; i<els.length; i++){
		options[els[i].id.replace(/^(option-)/,"")] = parseFloat(els[i].value);
	}
	return options;
}

function setupUI() {
	var tabs = document.getElementsByClassName("view-tab");
		for(var i=0; i<tabs.length; i++) {
			var tab = tabs[i];
			tab.addEventListener('click', function(evt) {
				[].forEach.call(document.querySelectorAll('.view-pane'), function (el) {
				  el.style.display = 'none';
				});

				console.log(evt.target.dataset)
				var el = document.getElementById(evt.target.dataset.target);
				el.style.display = 'block'
			});
		}
}

function makePart(options) {
	var canvas = document.getElementById('cvs')
	canvas.width = WIDTH
	canvas.height = HEIGHT
	var center = {
		x : canvas.width/2,
		y : canvas.height/2
	}
	// Draw the profile on the canvas
	var ctx = canvas.getContext('2d')

	// Double Helix
	ctx.arc(center.x-40, center.y, 70, 0, TWOPI)
	ctx.arc(center.x+40, center.y, 70, 0, TWOPI)
	ctx.fill()
	

	// Square
	//ctx.fillRect(center.x-100, center.y-100, 200, 200);


	/*
	ctx.beginPath()
	ctx.fillRect(center.x-5, center.y-40, 10, 80)
	ctx.fillRect(center.x-40, center.y-5, 80, 10)
	ctx.arc(center.x, center.y, 15, 0, TWOPI)
	ctx.fill()
*/
/*
	R = 50
	ctx.beginPath()
	ctx.moveTo(center.x + R*Math.sin(DEG2RAD*120.0), center.y + R*Math.cos(DEG2RAD*120.0))
	ctx.arc(center.x + R*Math.sin(DEG2RAD*120.0), center.y + R*Math.cos(DEG2RAD*120.0), 10, 0, TWOPI)

	ctx.moveTo(center.x + R*Math.sin(DEG2RAD*240.0), center.y + R*Math.cos(DEG2RAD*240.0))
	ctx.arc(center.x + R*Math.sin(DEG2RAD*240.0), center.y + R*Math.cos(DEG2RAD*240.0), 10, 0, TWOPI)
	ctx.fill()

	ctx.moveTo(center.x + R*Math.sin(DEG2RAD*0), center.y + R*Math.cos(DEG2RAD*0))
	ctx.arc(center.x + R*Math.sin(DEG2RAD*0), center.y + R*Math.cos(DEG2RAD*0), 10, 0, TWOPI)
	ctx.fill()
*/
	var t = new TurningMachine(canvas, options);


	t.render(document.getElementById('bitcvs'))
	var geom = make3DModel(t);

	//var meshMaterial = new THREE.MeshLambertMaterial({ color: 0xc6aa79, side:THREE.DoubleSide})
	//var meshMaterial = new THREE.MeshToonMaterial({color: 0xc6aa79, side:THREE.DoubleSide})
	var meshMaterial = new THREE.MeshPhongMaterial({color: 0xc6aa79, side:THREE.DoubleSide})

	var meshObject = new THREE.Mesh(geom, meshMaterial);

	scene.add(meshObject);
	//scene.add(pointsObject);

	var object = meshObject;
	object.rotation.x = TWOPI/4
	var animate = function () {
	        requestAnimationFrame( animate );

	        //object.rotation.x += 0.01;
	        //object.rotation.y += 0.01;

	        renderer.render(scene, camera);
	};

	function animateControls() {

		requestAnimationFrame( animateControls );

		// required if controls.enableDamping or controls.autoRotate are set to true
		controls.update();

		renderer.render( scene, camera );

	}

	renderer.render(scene, camera)
	camera.position.z = t.length*0.75;

	//animateControls();
	animate()

}

//function makeHelix(options) {
	var options = options || {}
	var strands = options['strands'] || 2;

	// Setup the display canvas

//}



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

/*
R = 50
ctx.beginPath()
ctx.moveTo(center.x + R*Math.sin(DEG2RAD*120.0), center.y + R*Math.cos(DEG2RAD*120.0))
ctx.arc(center.x + R*Math.sin(DEG2RAD*120.0), center.y + R*Math.cos(DEG2RAD*120.0), 10, 0, TWOPI)

ctx.moveTo(center.x + R*Math.sin(DEG2RAD*240.0), center.y + R*Math.cos(DEG2RAD*240.0))
ctx.arc(center.x + R*Math.sin(DEG2RAD*240.0), center.y + R*Math.cos(DEG2RAD*240.0), 10, 0, TWOPI)
ctx.fill()

ctx.moveTo(center.x + R*Math.sin(DEG2RAD*0), center.y + R*Math.cos(DEG2RAD*0))
ctx.arc(center.x + R*Math.sin(DEG2RAD*0), center.y + R*Math.cos(DEG2RAD*0), 10, 0, TWOPI)
ctx.fill()
*/

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

function setup3DView() {
	var container = document.getElementById('canvas3d');
	
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 75, container.offsetWidth/container.offsetHeight, 0.1, 1000 );
	renderer = new THREE.WebGLRenderer({antialias : true});
	renderer.setClearColor( 0xffffff, 1 );

	var ambientLight = new THREE.AmbientLight( 0x404040, 1.0); // soft white light
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 2.0 );
	var pointLight = new THREE.PointLight( 0xffffff, 2, 100 );

	camera.add(pointLight)

	scene.add(pointLight)
	scene.add(ambientLight);
	scene.add(directionalLight);


	var controls = new THREE.OrbitControls( camera );

	renderer.setSize( container.offsetWidth, container.offsetHeight );
	container.appendChild( renderer.domElement );


}

function make3DModel(t) {
	var points = t.getBoundaryPoints()
	var points3d = []

	var STEPS = 100
	var dt = TWOPI*TURNS/STEPS
	var dl = t.length/STEPS

	function rotate(pt, t) {
		return {
			x : pt.x*Math.cos(t) - pt.y*Math.sin(t),
			y : pt.y*Math.cos(t) + pt.x*Math.sin(t)
		}
	}

	for(var i =0; i<STEPS; i++) {
		points.forEach(function(point) {
			var p = rotate(point, dt*i)
			var z = i*dl
			points3d.push(new THREE.Vector3(p.x,p.y,z));
		});
	}

	var geom = new THREE.Geometry(); 


	points3d.forEach(function(point) {
		geom.vertices.push(point)
	});

	function createFaces(s, q,r) {
		var a = (s*points.length) + q
		var b = (s*points.length) + r
		var c = (s+1)*points.length + q
		var d = (s+1)*points.length + r
		return [
			new THREE.Face3(b,a,c),
			new THREE.Face3(c,d,b)
		]
	}
	
	for(var s=0; s<STEPS-1; s++) {
		for(var i=0; i<points.length-1; i++) {
			var faces = createFaces(s, i, i+1);
			geom.faces.push(faces[0])
			geom.faces.push(faces[1])
		}
		faces = createFaces(s, 0, points.length-1)
		geom.faces.push(faces[0])
		geom.faces.push(faces[1])
	}

	geom.computeFaceNormals()
	geom.computeVertexNormals()
	geom.translate(0,0,-t.length/2.0)

	return geom
}

setupUI();
setup3DView();

document.getElementById('btn-update').addEventListener('click', function() {
	makePart(getOptions());
});


makePart(getOptions());