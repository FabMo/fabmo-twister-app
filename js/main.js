WIDTH = 400
HEIGHT = 400

var DEG2RAD = 0.0174533
var RAD2DEG = 1.0/DEG2RAD
var TWOPI = 2.0*Math.PI

var scene, camera, renderer;
var turningMachine;
var currentPane = 'canvas3d';

var fabmo = new FabMoDashboard();

// Writes a string to the "code" tab
function write(s) {
	console.info(s);
  document.getElementById('output').innerHTML = s
}

/*
 * Get the user selected options from the UI
 * This is done by selecting all of the elements that have the class opt-num or opt-select
 * and extracting their values.  The id of each option found in this way determines the key
 * that is used in the map returned by that option.  So:
 * <input id="option-width" class="opt-num" />
 * would produce
 * {width : 0.5} // (if the value of the input was 0.5)
 */
function getOptions() {
	var els = document.getElementsByClassName('opt-num');
	options = {}
	for(var i=0; i<els.length; i++){
		options[els[i].id.replace(/^(option-)/,"")] = parseFloat(els[i].value);
	}

	var els = document.getElementsByClassName('opt-select');
	for(var i=0; i<els.length; i++){
		options[els[i].id.replace(/^(option-)/,"")] = els[i].value;
	}

	console.info(options)
	return options;
}

/*
 * Show the specified view pane. (by element id) The right side of the UI is organized into panes, 
 * and only one of them is visible at a time. 
 */
function showViewPane(name) {
	currentPane = name;
	[].forEach.call(document.querySelectorAll('.view-pane'), function (el) {
	  el.style.display = 'none';
	});
	var el = document.getElementById(name);
	el.style.display = 'block'
}

/*
 * Show the specified settings pane. (by element id) The left side of the UI is organized into panes, 
 * and only one of them is visible at a time. 
 */
function showSettingsPane(name) {
	currentPane = name;
	[].forEach.call(document.querySelectorAll('.settings-pane'), function (el) {
	  el.style.display = 'none';
	});
	var el = document.getElementById(name);
	el.style.display = 'block'
}

/* 
 * One-time setup of events for the UI
 */
function setupUI() {
	// Add a click listener for each tab to show the corresponding view pane.  (Set by the data-target for each pane)
	var tabs = document.getElementsByClassName("view-tab");
		for(var i=0; i<tabs.length; i++) {
			var tab = tabs[i];
			tab.addEventListener('click', function(evt) {
			showViewPane(evt.target.dataset.target);
			[].forEach.call(document.querySelectorAll('.view-tab'), function (el) {
				el.classList.remove('is-active');							
			});
			evt.target.parentElement.classList.add('is-active');		
		});
	}
	tabs = document.getElementsByClassName("settings-tab");
		for(var i=0; i<tabs.length; i++) {
			var tab = tabs[i];
			tab.addEventListener('click', function(evt) {
			showSettingsPane(evt.target.dataset.target);
			[].forEach.call(document.querySelectorAll('.settings-tab'), function (el) {
				el.classList.remove('is-active');							
			});
			evt.target.parentElement.classList.add('is-active');		
		});
	}
}

function makePart(options) {
	var options = options || {}
	options.type = options['type'] || 'helix'

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
	switch(options.type) {
		case 'helix':
			ctx.arc(center.x, center.y-50, 55, 0, TWOPI)
			ctx.arc(center.x, center.y+50, 55, 0, TWOPI)
			ctx.fill()
			break;
		case 'twist':
			ctx.arc(center.x, center.y-50, 55, 0, TWOPI);
			ctx.fill();
			break;
		case 'square':
			ctx.fillRect(center.x-100, center.y-100, 200, 200);
			break;
		case 'corkscrew':
			ctx.fillRect(center.x-100, center.y-10, 200, 20);
			break;
		case 'naca63412':
			var img=document.getElementById("naca63412-img");
    		ctx.drawImage(img,0,0);
    		break;
		case 'naca4415':
			var img=document.getElementById("naca4415-img");
    		ctx.drawImage(img,0,0);
    		break;
	}
	

	turningMachine = new TurningMachine(canvas, options);


	turningMachine.render(document.getElementById('bitcvs'))
	var geom = make3DModel(turningMachine);

    var selectedObject = scene.getObjectByName('subject');
    scene.remove( selectedObject );

	//var meshMaterial = new THREE.MeshLambertMaterial({ color: 0xc6aa79, side:THREE.DoubleSide})
	//var meshMaterial = new THREE.MeshToonMaterial({color: 0xc6aa79, side:THREE.DoubleSide})
	var meshMaterial = new THREE.MeshLambertMaterial({color: 0xc6aa79, side:THREE.DoubleSide})
	var meshObject = new THREE.Mesh(geom, meshMaterial);
	meshObject.name = 'subject'
	scene.add(meshObject);
	//scene.add(pointsObject);

	var object = meshObject;
	object.rotation.x = TWOPI/4
	var animate = function () {
	        requestAnimationFrame( animate );

	        object.rotation.x += 0.01;
	        object.rotation.y += 0.01;

	        renderer.render(scene, camera);
	};

	function animateControls() {

		requestAnimationFrame( animateControls );

		// required if controls.enableDamping or controls.autoRotate are set to true
		//controls.update();

		renderer.render( scene, camera );

	}

	renderer.render(scene, camera)
	camera.position.z = turningMachine.length*0.75;

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
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
	var pointLight = new THREE.PointLight( 0xffffff, 2, 100 );
	var hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820);

	camera.add(pointLight)

	//scene.add(pointLight)
	//scene.add(ambientLight);
	scene.add(directionalLight);
	scene.add(hemisphereLight);


	//var controls = new THREE.OrbitControls( camera );

	renderer.setSize( container.offsetWidth, container.offsetHeight );
	container.appendChild( renderer.domElement );


}

function make3DModel(t) {
	var points = t.getBoundaryPoints()
	var points3d = []

	var STEPS = 100
	var dt = TWOPI*t.turns/STEPS
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
		faces = createFaces(s, points.length-1,0)
		geom.faces.push(faces[0])
		geom.faces.push(faces[1])
	}

	geom.computeFaceNormals()
	geom.computeVertexNormals()
	//geom.uvsNeedUpdate = true;

	geom.translate(0,0,-t.length/2.0)
	//geom.updateMatrix();

	var endcapRadius = 1.01*t.stockDiameter/2.0;
	var endcapThickness = endcapRadius/2.0;

	var c1 = new THREE.CylinderGeometry( endcapRadius, endcapRadius, endcapThickness, 64 );
	c1.rotateX(Math.PI/2);
	c1.translate(0,0,t.length/2 - 0.01*endcapThickness)
	c1.faceVertexUvs = [[]]

	var c2 = new THREE.CylinderGeometry( endcapRadius, endcapRadius, endcapThickness, 64 );
	c2.rotateX(-Math.PI/2);
	c2.translate(0,0,-t.length/2 + 0.01*endcapThickness)
	c2.faceVertexUvs = [[]]

	//c1.uvsNeedUpdate = true;
	//console.log('c1uvs: ', c1.faceVertexUvs)

	//c1.updateMatrix()
	var retval = new THREE.Geometry()

	retval.merge(geom, geom.matrix)
	retval.merge(c1, c1.matrix)
	retval.merge(c2, c2.matrix)


	return retval
}

document.getElementById('btn-update').addEventListener('click', function() {
	var savedPane = currentPane;
	if(savedPane === 'intro') {
		savedPane = 'canvas3d';
	}
	showViewPane('spinner');
	setTimeout(function() {
		makePart(getOptions());
		write(turningMachine.postSBP().join('\n'))
		showViewPane(savedPane)

	}, 100)
});


document.getElementById('btn-make').addEventListener('click', function() {
	var s = turningMachine.postSBP();
	fabmo.submitJob({
    	file : s.join('\n'),
    	filename : "turning-machine.sbp",
    	description : "Indexer project from the universal turning machine"
	});     
})

setupUI();
setup3DView();
showViewPane('intro')

//makePart(getOptions());
