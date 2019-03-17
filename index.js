/* global THREE, COLORS, Vue */

const C3DState = {
    idle: 'idle',
    seeded: 'seeded',
    running: 'running',
    ending: 'ending',
};

class Cube3d {
    constructor() {
        this.state = C3DState.idle;
        this.elem = 'div3d';
        this.vue = new Vue({
            el: '#app',
            data: {
                conf: true,
                title: 'The Cube !',
                time: 0,
                duration: 0,
                population: 0,
                birth: 0,
                death: 0,
            },
            methods: {
                start: () => {
                    this.terminate();
                    this.start();
                },
                cycle: (count) => {
                    this.cycle(count);
                },
                stop: () => {
                    this.terminate();
                },
            },
        });
    }

    start() {
        if (this.state !== C3DState.idle) return;
        // Create an empty scene
        this.scene = new THREE.Scene();
        this.plant_materials = [];
        // Create a basic perspective camera
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.up.set(0, 0, 1);
        this.camera.position.set(1.1, 1.1, 0.1); // Set position like this
        this.camera.lookAt(new THREE.Vector3(0, 0, 0.1)); // Set look at coordinate like this

        // Create a renderer with Antialiasing
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.box = new THREE.BoxGeometry(0.01, 0.01, 0.01);

        // Configure renderer clear color
        this.renderer.setClearColor(0xC0C0C0);
        // Configure renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Enable Shadows in the Renderer
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        // Append Renderer to DOM
        document.getElementById(this.elem).appendChild(this.renderer.domElement);
        // eslint-disable-next-line no-unused-vars
        // this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);

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

        // const gridXZ = new THREE.GridHelper(1, 100);
        // gridXZ.position.set(0.5, 0, 0.5);
        const gridXY = new THREE.GridHelper(1, 100);
        gridXY.position.set(0.5, 0.5, 0);
        gridXY.rotation.x = Math.PI / 2;
        // const gridYZ = new THREE.GridHelper(1, 100);
        // gridYZ.position.set(0, 0.5, 0.5);
        // gridYZ.rotation.z = Math.PI / 2;

        this.scene.add(xaxe);
        this.scene.add(yaxe);
        this.scene.add(zaxe);
        // this.scene.add(gridXZ);
        this.scene.add(gridXY);
        // this.scene.add(gridYZ);

        // LIGHTS
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const light = new THREE.PointLight(0xffffff, 0.8, 18);
        light.castShadow = true;
        light.position.set(0, 1, 1);
        this.scene.add(light);


        window.addEventListener('keydown', (ev) => {
            switch (ev.keyCode) {
                case 65: this.camera.position.z += 0.05; break;
                case 81: this.camera.position.z -= 0.05; break;
                case 38: this.camera.translateZ(-0.05); break;
                case 40: this.camera.translateZ(0.05); break;
                case 37: this.camera.rotateY(Math.PI / 18); break;
                case 39: this.camera.rotateY(-Math.PI / 18); break;
                case 90: this.camera.rotateX(-Math.PI / 18); break;
                case 83: this.camera.rotateX(Math.PI / 18); break;
                default: break;
            }
            this.changed = true;
        });

        // Cube worker
        this.worker = new Worker('worker.js');
        this.worker.onmessage = (event) => {
            console.log(`message receive on PAGE of type ${event.data.type}`);
            if (this[event.data.type]) this[event.data.type](event.data);
            return true;
        };
        this.worker.postMessage({ type: 'start' });
        this.state = C3DState.running;
        this.changed = true;
        this.render();
        this.worker.postMessage({ type: 'seed' });
    }

    terminate() {
        if (this.state === C3DState.idle) return;
        this.state = C3DState.ending;
        this.worker.terminate();
        this.vue = null;
        this.scene = null;
        this.plant_materials = [];
        this.camera = null;
        this.renderer = null;
        this.box = null;
        // this.controls = null;
        const domelem = document.getElementById(this.elem);
        while (domelem.lastChild) domelem.removeChild(domelem.lastChild);
        this.state = C3DState.idle;
    }

    update(message) {
        if (this.state !== C3DState.running) return;
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
                    // material = new THREE.MeshBasicMaterial({ color });
                    material = new THREE.MeshPhongMaterial({ color, wireframe: false });
                    this.plant_materials[plant] = material;
                }
                const cube = new THREE.Mesh(this.box, material);
                cube.receiveShadow = true;
                // cube.castShadow = true;
                cube.position.set(x / 100, y / 100, z / 100);
                this.scene.add(cube);
            }
        });
        this.changed = true;
    }

    render() {
        const render = () => {
            requestAnimationFrame(render);
            if (this.changed) {
                // this.controls.update();
                this.renderer.render(this.scene, this.camera);
                this.changed = false;
            }
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

    cycle(count) {
        if (this.state !== C3DState.running) return;
        this.worker.postMessage({ type: 'cycle', cycles: count });
    }
}

// eslint-disable-next-line no-unused-vars
const cube3d = new Cube3d();
