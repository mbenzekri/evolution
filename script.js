// ------------------------------------------------
// BASIC SETUP
// ------------------------------------------------

// Create an empty scene
var scene = new THREE.Scene();

// Create a basic perspective camera
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 4;

// Create a renderer with Antialiasing
var renderer = new THREE.WebGLRenderer({ antialias: true });

// Configure renderer clear color
renderer.setClearColor(0xC0C0C0);

// Configure renderer size
renderer.setSize(window.innerWidth, window.innerHeight);

// Append Renderer to DOM
document.getElementById('div3d').appendChild(renderer.domElement);


controls = new THREE.TrackballControls(camera, renderer.domElement);
var box = new THREE.BoxGeometry(0.01, 0.01, 0.01);
var boxa = new THREE.BoxGeometry(0.01, 0.01, 0.01);
var plant_materials = [];
var material = new THREE.MeshBasicMaterial({ color: "#433F81" });
//create a blue LineBasicMaterial
var lmaterial = new THREE.LineBasicMaterial({'linewidth': 3, color: 0xffffff });

var xline = new THREE.Geometry();
xline.vertices.push(new THREE.Vector3(0, 0, 0));
xline.vertices.push(new THREE.Vector3(2, 0, 0));

var yline = new THREE.Geometry();
yline.vertices.push(new THREE.Vector3(0, 0, 0));
yline.vertices.push(new THREE.Vector3(0, 2, 0));

var zline = new THREE.Geometry();
zline.vertices.push(new THREE.Vector3(0, 0, 0));
zline.vertices.push(new THREE.Vector3(0, 0, 2));


var xaxe = new THREE.Line( xline, new THREE.LineBasicMaterial( { color: 0xff0000 } ));
var yaxe = new THREE.Line( yline, new THREE.LineBasicMaterial( { color: 0x00ff00 } ));
var zaxe = new THREE.Line( zline, new THREE.LineBasicMaterial( { color: 0x0000ff } ));

scene.add(xaxe);
scene.add(yaxe);
scene.add(zaxe);


var gridXZ = new THREE.GridHelper(1, 100);
gridXZ.setColors( new THREE.Color(0x006600), new THREE.Color(0x006600) );
gridXZ.position.set( 0.5,0,0.5 );
scene.add(gridXZ);

var gridXY = new THREE.GridHelper(1, 100);
gridXY.position.set( 0.5,0.5,0 );
gridXY.rotation.x = Math.PI/2;
gridXY.setColors( new THREE.Color(0x000066), new THREE.Color(0x000066) );
scene.add(gridXY);

var gridYZ = new THREE.GridHelper(1, 100);
gridYZ.position.set( 0,0.5,0.5 );
gridYZ.rotation.z = Math.PI/2;
gridYZ.setColors( new THREE.Color(0x660000), new THREE.Color(0x660000) );
scene.add(gridYZ);

function update(update_ev) {
    update_ev.updates.forEach(v => {
        let [x, y, z, plant] = v.split(/,/);
        x = parseInt(x);
        y = parseInt(y);
        z = parseInt(z);
        plant = parseInt(plant);
        const name = `${x},${y},${z}`;
        let mesh = scene.getObjectByName(name);
        if (mesh) scene.remove(mesh);
        if (plant >= 0) {
            let material = plant_materials[plant];
            const color = COLORS[plant % COLORS.length];
            if (!material) material = plant_materials[plant] = new THREE.MeshBasicMaterial({ color });
            const cube = new THREE.Mesh(box,material);
            cube.position.set(x/100, y/100, z/100);
            scene.add(cube);    
        }
    });
    render();
}
function time(time_ev) {
    console.error(`-- Time is ${time_ev.time} cycles or ${time_ev.sec} sec - cells: ${time_ev.pop} birth: ${time_ev.birth} death: ${time_ev.death} --------------------------------`);
}
// Cube worker
var worker = new Worker('worker.js');
worker.onmessage = function (event) {
    console.log(`message receive on PAGE of type ${event.data.type}`)
    switch(event.data.type) {
        case 'update' : return update(event.data);
        case 'time' : return time(event.data);
    }
};


// ------------------------------------------------
// FUN STARTS HERE
// ------------------------------------------------

// Create a Cube Mesh with basic material

// var apos = [ [0,0,0], [0,0.5,0], [0,1,0], [0.5,0,0], [0.5,0.5,0], [0.5,1,0], [1,0,0], [1,0.5,0], [1,1,0]];
// var cubes = apos.map(_ => new THREE.Mesh( box, material1 ) )
// cubes.forEach((cube,i) => {
//     const [x,y,z] = apos[i];
//     cube.position.set(x,y,z);
//     scene.add( cube );
// })

// Render Loop
var render = function () {
    requestAnimationFrame(render);
    controls.update();
    renderer.render(scene, camera);
};

render();