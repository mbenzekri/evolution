/* global THREE, HCOLORS, Vue */

const C3DState = {
    idle: 'idle',
    seeded: 'seeded',
    running: 'running',
    ending: 'ending',
};

class Cube3d {
    constructor() {
        this.options = {
            genome_size: 10,
            cube_width: 100,
            cube_pop_size: 100,
            photons_per_drop: 5,
            era_timeout: 300,
            era_max_cycles: 200,
            cell_max_photons: 3,
            cell_init_photons: 0,
            cell_max_fasting: 3,
            scene_update_range: 100,
        };
        this.state = C3DState.idle;
        this.elem = 'div3d';
        this.vue = new Vue({
            el: '#app',
            data: {
                // View
                conf: false,
                sidenav: true,
                // options
                options: this.options,
                // logging
                title: 'The Cube !',
                time: 0,
                duration: 0,
                population: 0,
                birth: 0,
                death: 0,
            },
            methods: {
                start: () => {
                    this.vue.$data.time = 0;
                    this.vue.duration = 0;
                    this.vue.population = 0;
                    this.vue.birth = 0;
                    this.vue.death = 0;
                    this.terminate();
                    this.start(this.vue.$data.options);
                },
                cycle: (count) => {
                    this.cycle(count);
                },
                stop: () => {
                    this.terminate();
                },
            },
        });
        // Cube worker
        this.worker = new Worker('worker.js');
        this.worker.onmessage = (event) => {
            // console.log(`message receive on PAGE of type ${event.data.type}`);
            if (this[event.data.type]) this[event.data.type](event.data, event.tr);
            return true;
        };
    }

    start() {
        if (this.state !== C3DState.idle) return;
        const w = 0.01;
        const W = this.options.cube_width * w;
        // Create an empty scene
        this.scene = new THREE.Scene();
        this.plant_materials = [];
        // Create a basic perspective camera
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.up.set(0, 0, 1); // fixe le haut de la camera
        this.camera.position.set(W + 0.1, W + 0.1, 0.1); // Set position like this
        this.camera.lookAt(new THREE.Vector3(0, 0, 0.1)); // Set look at coordinate like this

        // Create a renderer with Antialiasing
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.box = new THREE.BoxGeometry(w, w, w);

        // Configure renderer clear color
        this.renderer.setClearColor(0xC0C0C0);
        // Configure renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Enable Shadows in the Renderer
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        // Append Renderer to DOM
        document.getElementById(this.elem).appendChild(this.renderer.domElement);

        const xline = new THREE.Geometry();
        xline.vertices.push(new THREE.Vector3(0, 0, 0));
        xline.vertices.push(new THREE.Vector3(1.5 * W, 0, 0));
        const yline = new THREE.Geometry();
        yline.vertices.push(new THREE.Vector3(0, 0, 0));
        yline.vertices.push(new THREE.Vector3(0, 1.5 * W, 0));
        const zline = new THREE.Geometry();
        zline.vertices.push(new THREE.Vector3(0, 0, 0));
        zline.vertices.push(new THREE.Vector3(0, 0, 1.5 * W));
        const xaxe = new THREE.Line(xline, new THREE.LineBasicMaterial({ color: 0xff0000 }));
        const yaxe = new THREE.Line(yline, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
        const zaxe = new THREE.Line(zline, new THREE.LineBasicMaterial({ color: 0x0000ff }));
        const gridXY = new THREE.GridHelper(this.options.cube_width * 0.01, this.options.cube_width);
        gridXY.position.set(W / 2, W / 2, 0);
        gridXY.rotation.x = Math.PI / 2;

        this.scene.add(xaxe);
        this.scene.add(yaxe);
        this.scene.add(zaxe);
        this.scene.add(gridXY);

        // LIGHTS
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const light = new THREE.PointLight(0xffffff, 0.8, 18);
        light.castShadow = true;
        light.position.set(0, W, W);
        this.scene.add(light);

        window.addEventListener('wheel', (ev) => {
            this.camera.translateZ(-Math.sign(ev.deltaY) * w);
            this.changed = true;
        });

        window.addEventListener('keydown', (ev) => {
            switch (ev.keyCode) {
                case 65: this.camera.position.z += w; break; // key A
                case 81: this.camera.position.z -= w; break; // key Q
                case 38: this.camera.translateZ(-w); break; // Arrow UP
                case 40: this.camera.translateZ(w); break; // Arrow DOWN
                case 37: this.camera.rotateY(Math.PI / 36); break; // Arrow RIGHT
                case 39: this.camera.rotateY(-Math.PI / 36); break; // Arrow LEFT
                case 90: this.camera.rotateX(-Math.PI / 36); break; // Key Z
                case 83: this.camera.rotateX(Math.PI / 36); break; // Key S
                default: break;
            }
            this.changed = true;
        });

        this.worker.postMessage({ type: 'start', options: this.vue.$data.options });
        this.state = C3DState.running;
        this.changed = true;
        this.render();
        this.worker.postMessage({ type: 'seed' });
    }

    terminate() {
        if (this.state === C3DState.idle) return;
        this.state = C3DState.ending;
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
        const intarr = new Int16Array(message.updates);
        for (let pos = 0; pos < intarr.length; pos += 4) {
            const x = intarr[pos];
            const y = intarr[pos + 1];
            const z = intarr[pos + 2];
            const plant = intarr[pos + 3];
            const name = `${x},${y},${z}`;
            const mesh = this.scene.getObjectByName(name);
            if (plant < 0) {
                if (mesh) this.scene.remove(mesh);
            } else {
                let material = this.plant_materials[plant];
                if (!material) {
                    const color = new THREE.Color(HCOLORS[plant % HCOLORS.length]);
                    material = new THREE.MeshPhongMaterial({ color: color, wireframe: false });
                    this.plant_materials[plant] = material;
                }
                if (mesh) {
                    mesh.material = material;
                } else {
                    const cube = new THREE.Mesh(this.box, material);
                    cube.receiveShadow = true;
                    // cube.castShadow = true;
                    cube.position.set(x / 100, y / 100, z / 100);
                    cube.name = name;
                    this.scene.add(cube);
                }
            }
        }
        this.changed = true;
    }

    render() {
        const render = () => {
            requestAnimationFrame(render);
            if (this.changed) {
                console.log(`RENDERING ${this.scene.children.length} objects `);
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
