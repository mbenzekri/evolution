/* global THREE, COLORS, Vue */


class Cube3d {
    constructor(elem, vue) {
        this.vue = vue;
        // Create an empty scene
        this.scene = new THREE.Scene();
        this.plant_materials = [];
        // Create a basic perspective camera
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.up.set(0, 0, 1);
        this.camera.position.set(1, 1, 1); // Set position like this
        this.camera.lookAt(new THREE.Vector3(0, 0, 2)); // Set look at coordinate like this

        // Create a renderer with Antialiasing
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.box = new THREE.BoxGeometry(0.01, 0.01, 0.01);


        // Configure renderer clear color
        this.renderer.setClearColor(0xC0C0C0);
        // Configure renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Append Renderer to DOM
        document.getElementById(elem).appendChild(this.renderer.domElement);
        // eslint-disable-next-line no-unused-vars
        this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);

        const xline = new THREE.Geometry();
        xline.vertices.push(new THREE.Vector3(0, 0, 0));
        xline.vertices.push(new THREE.Vector3(2, 0, 0));

        const yline = new THREE.Geometry();
        yline.vertices.push(new THREE.Vector3(0, 0, 0));
        yline.vertices.push(new THREE.Vector3(0, 2, 0));

        const zline = new THREE.Geometry();
        zline.vertices.push(new THREE.Vector3(0, 0, 0));
        zline.vertices.push(new THREE.Vector3(0, 0, 2));


        const xaxe = new THREE.Line(xline, new THREE.LineBasicMaterial({ color: 0xff0000 }));
        const yaxe = new THREE.Line(yline, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
        const zaxe = new THREE.Line(zline, new THREE.LineBasicMaterial({ color: 0x0000ff }));

        this.scene.add(xaxe);
        this.scene.add(yaxe);
        this.scene.add(zaxe);


        const gridXZ = new THREE.GridHelper(1, 100);
        gridXZ.setColors(new THREE.Color(0x006600), new THREE.Color(0x006600));
        gridXZ.position.set(0.5, 0, 0.5);
        this.scene.add(gridXZ);

        const gridXY = new THREE.GridHelper(1, 100);
        gridXY.position.set(0.5, 0.5, 0);
        gridXY.rotation.x = Math.PI / 2;
        gridXY.setColors(new THREE.Color(0x000066), new THREE.Color(0x000066));
        this.scene.add(gridXY);

        const gridYZ = new THREE.GridHelper(1, 100);
        gridYZ.position.set(0, 0.5, 0.5);
        gridYZ.rotation.z = Math.PI / 2;
        gridYZ.setColors(new THREE.Color(0x660000), new THREE.Color(0x660000));
        this.scene.add(gridYZ);

        // Cube worker
        this.worker = new Worker('worker.js');
        this.worker.onmessage = (event) => {
            console.log(`message receive on PAGE of type ${event.data.type}`);
            if (this[event.data.type]) this[event.data.type](event.data);
            return true;
        };
        this.worker.postMessage({ type: 'start' });
        this.render();
    }

    update(message) {
        message.updates.forEach((v) => {
            let [x, y, z, plant] = v.split(/,/);
            x = parseInt(x, 10);
            y = parseInt(y, 10);
            z = parseInt(z, 10);
            plant = parseInt(plant, 10);
            const name = `${x},${y},${z}`;
            const mesh = this.scene.getObjectByName(name);
            if (mesh) this.scene.remove(mesh);
            if (plant >= 0) {
                let material = this.plant_materials[plant];
                const color = COLORS[plant % COLORS.length];
                if (!material) {
                    material = new THREE.MeshBasicMaterial({ color });
                    this.plant_materials[plant] = material;
                }
                const cube = new THREE.Mesh(this.box, material);
                cube.position.set(x / 100, y / 100, z / 100);
                this.scene.add(cube);
            }
        });
        this.render();
    }

    render() {
        const render = () => {
            requestAnimationFrame(render);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        render();
    }

    time(event) {
        this.vue.$data.time = event.time;
        this.vue.$data.duration = event.sec;
        this.vue.$data.population = event.pop;
        this.vue.$data.birth = event.birth;
        this.vue.$data.death = event.death;
    }

    seed() {
        this.worker.postMessage({ type: 'seed' });
    }

    cycle(count) {
        this.worker.postMessage({ type: 'cycle', cycles: count });
    }
}

let cube3d;
let app;

// eslint-disable-next-line prefer-const
app = new Vue({
    el: '#app',
    data: {
        title: 'The Cube !',
        time: 0,
        duration: 0,
        population: 0,
        birth: 0,
        death: 0,
    },
    methods: {
        start: function () {
            if (!cube3d) cube3d = new Cube3d('div3d', app);
        },
        seed: function () {
            cube3d.seed();
        },
        cycle: function (count) {
            cube3d.cycle(count);
        },
    },
});
