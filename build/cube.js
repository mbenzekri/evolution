function apply(obj, def = {}) {
    const to = {};
    Object.keys(def).forEach((key) => {
        to[key] = (key in obj) ? obj[key] : def[key];
    });
    return to;
}
var Direction;
(function (Direction) {
    Direction["NORTH"] = "N";
    Direction["SOUTH"] = "S";
    Direction["EAST"] = "E";
    Direction["WEST"] = "W";
    Direction["TOP"] = "T";
    Direction["BOTTOM"] = "B";
})(Direction || (Direction = {}));
const Gene = ['GN', 'GS', 'GE', 'GW', 'GT', 'GB', 'TN', 'TS', 'TE', 'TW', 'TT', 'TB'];
const DEFAULT_OPTIONS = {
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
    log: {
        birth: false,
        death: false,
        consume: false,
        absorb: false,
        steps: false,
        cube: false,
    }
};
class Cell {
    constructor(world, plant, genome, location, photons) {
        this.world = world;
        this.plant = plant;
        this.genome = genome;
        this.location = location;
        this._step = 0;
        this._photons = 0;
        if (!plant)
            this.plant = this;
        this.genome = genome;
        this.absorb(photons);
        this.plant.push(this);
        this.world.birth(this);
    }
    get photons() { return this._photons; }
    die() {
        this.world.death(this);
        this.plant.pop(this);
    }
    absorb(photons) {
        this._photons = (this.photons < 0) ? photons : Math.min((this.photons + photons), this.world.opts.cell_max_photons);
        if (this.world.opts.log.absorb)
            console.log('Cell absorb at %s plant %d / photons %d', JSON.stringify(this.location), this.plant.plantid, this.photons);
    }
    consume() {
        this._photons--;
        if (this.world.opts.log.consume)
            console.log('Cell consume at %s plant %d / photons %d', JSON.stringify(this.location), this.plant.plantid, this.photons);
        if (this.photons < this.world.opts.cell_max_fasting)
            this.die();
    }
    grow(dir) {
        let [lat, lon, alt] = this.location;
        if (dir === Direction.EAST)
            lon += 1;
        if (dir === Direction.WEST)
            lon -= 1;
        if (dir === Direction.NORTH)
            lat += 1;
        if (dir === Direction.SOUTH)
            lat -= 1;
        if (dir === Direction.TOP)
            alt += 1;
        if (dir === Direction.BOTTOM)
            alt -= 1;
        if (this.world.isout([lat, lon, alt]))
            return;
        if (this.world.exists([lat, lon, alt]))
            return;
        const cell = new Cell(this.world, this.plant, this.genome, [lat, lon, alt], Math.floor(this.photons / 2));
        this._photons = Math.ceil(this.photons / 2);
        return cell;
    }
    transfert(dir) {
        let [lat, lon, alt] = this.location;
        if (dir === Direction.EAST)
            lon += 1;
        if (dir === Direction.WEST)
            lon -= 1;
        if (dir === Direction.NORTH)
            lat += 1;
        if (dir === Direction.SOUTH)
            lat -= 1;
        if (dir === Direction.TOP)
            alt += 1;
        if (dir === Direction.BOTTOM)
            alt -= 1;
        if (this.world.isout([lat, lon, alt]))
            return;
        const cell = this.world.get([lat, lon, alt]);
        if (!cell)
            return;
        cell.absorb(Math.floor(this.photons / 2));
        this._photons = Math.ceil(this.photons / 2);
        return cell;
    }
    cycle() {
        if (this.photons > 0) {
            const gene = this.genome[this._step++ % this.genome.length];
            switch (gene) {
                case "GN": return this.grow(Direction.NORTH);
                case "GS":
                    return this.grow(Direction.SOUTH);
                    break;
                case "GE":
                    return this.grow(Direction.EAST);
                    break;
                case "GW":
                    return this.grow(Direction.WEST);
                    break;
                case "GT":
                    return this.grow(Direction.TOP);
                    break;
                case "GB":
                    return this.grow(Direction.BOTTOM);
                    break;
                case "TN":
                    return this.transfert(Direction.NORTH);
                    break;
                case "TS":
                    return this.transfert(Direction.SOUTH);
                    break;
                case "TE":
                    return this.transfert(Direction.EAST);
                    break;
                case "TW":
                    return this.transfert(Direction.WEST);
                    break;
                case "TT":
                    return this.transfert(Direction.TOP);
                    break;
                case "TB":
                    return this.transfert(Direction.BOTTOM);
                    break;
            }
            ;
        }
        ;
        this.consume();
    }
}
class Plant extends Cell {
    constructor(world, genome, location) {
        super(world, null, genome, location, world.opts.cell_init_photons);
        this.plantid = this.world.plants.length;
        this.cells = new Map();
        world.plants.push(this);
        this.world.birth(this);
    }
    push(cell) {
        if (this.cells)
            this.cells.set(cell.location, cell);
    }
    pop(cell) {
        this.cells.delete(cell.location);
    }
    get size() {
        return this.cells.size;
    }
    get energy() {
        let sum = 0;
        for (let cell of this.cells.values())
            sum += cell.photons;
        return sum;
    }
    purge() {
        const stack = [this];
        const cells = new Map();
        while (stack.length) {
            const cell = stack.pop();
            cells.set(cell.location, cell);
            const [lon, lat, alt] = cell.location;
            const locations = [[lon + 1, lat, alt], [lon - 1, lat, alt], [lon, lat + 1, alt], [lon, lat - 1, alt], [lon, lat, alt + 1], [lon, lat, alt - 1]];
            locations.forEach(location => {
                if (!this.world.isin(location) && this.world.exists(location)) {
                    const neibourgh = this.world.get(location);
                    if (neibourgh.plant === cell.plant)
                        stack.push(neibourgh);
                }
                ;
            });
        }
        for (let cell of this.cells.values()) {
            if (!cells.has(cell.location))
                cell.die();
        }
    }
}
class Cube {
    constructor(opts = {}) {
        this.time = 0;
        this.cubes = [];
        this.plants = [];
        this.opts = DEFAULT_OPTIONS;
        this.updates = new Map();
        this.cell_pop = 0;
        this.birth_cycle = 0;
        this.death_cycle = 0;
        this.cube_full = false;
        this.opts = apply(opts, DEFAULT_OPTIONS);
        for (let i = 0; i < this.opts.cube_width * this.opts.cube_width; i++) {
            this.cubes[i] = [];
        }
    }
    static start(opts) {
        const world = new Cube(opts);
        console.log('Cube Started');
        return world;
    }
    run() {
        return this.cycle().then(() => this.state()).catch(() => this.state());
    }
    state() {
        console.log('Cube Status ---------------------------------------------------');
        this.plants.forEach(plant => console.log('plant %d size %d energy %d', plant.plantid, plant.size, plant.energy));
        console.log('---------------------------------------------------------------');
    }
    col(lon, lat) {
        return this.cubes[lon * this.opts.cube_width + lat];
    }
    get(location) {
        const [lon, lat, alt] = location;
        return this.cubes[lon * this.opts.cube_width + lat][alt];
    }
    set(location, cell) {
        const [lon, lat, alt] = location;
        this.cubes[lon * this.opts.cube_width + lat][alt] = cell;
    }
    delete(location) {
        const [lon, lat, alt] = location;
        const col = this.cubes[lon * this.opts.cube_width + lat];
        delete col[alt];
    }
    exists(location) {
        return typeof this.get(location) !== 'undefined';
    }
    isin(location) {
        const [lon, lat, alt] = location;
        return lon >= 0 && lon < this.opts.cube_width && lat >= 0 && lat < this.opts.cube_width && alt >= 0 && alt < this.opts.cube_width;
    }
    isout(location) {
        return !this.isin(location);
    }
    random() {
        const genome = [];
        while (genome.length < this.opts.genome_size) {
            const key = Math.floor(Math.random() * Gene.length);
            genome.push(Gene[key]);
        }
        return genome;
    }
    freesoil() {
        let col, cell = true;
        while (cell) {
            col = Math.floor(Math.random() * this.opts.cube_width * this.opts.cube_width);
            cell = this.cubes[col][0];
        }
        const lon = Math.floor(col / this.opts.cube_width);
        const lat = col % this.opts.cube_width;
        return [lon, lat, 0];
    }
    seed() {
        console.log('Seeding');
        for (let p = 0; p < this.opts.cube_pop_size; p++) {
            const plant = new Plant(this, this.random(), this.freesoil());
        }
        postMessage({ type: "seeded", count: this.plants.length });
        console.log('Cube Seeded');
        this.refresh();
    }
    drop() {
        if (this.opts.log.steps)
            console.log('  Dropping photons');
        this.cubes.forEach(col => {
            let last;
            col.forEach(cell => last = last || cell);
            last && last.absorb(this.opts.photons_per_drop);
        });
    }
    cycle(cycles = this.opts.era_max_cycles) {
        const start = Math.floor(Date.now() / 1000);
        let current = start;
        let count = 0;
        return new Promise((resolve, reject) => {
            let loop = () => {
                if (this.time > this.opts.era_max_cycles || count > cycles || (current - start) > this.opts.era_timeout) {
                    this.refresh();
                    postMessage({ type: 'time', time: this.time, sec: (current - start), pop: this.cell_pop, birth: this.birth_cycle, death: this.death_cycle });
                    postMessage({ type: "cycled", count: cycles });
                    resolve();
                    return;
                }
                this.birth_cycle = 0;
                this.death_cycle = 0;
                this.drop();
                if (this.opts.log.steps)
                    console.log('  Cycling');
                this.cubes.forEach(col => { for (let alt in col)
                    col[alt].cycle(); });
                postMessage({ type: 'time', time: this.time, sec: (current - start), pop: this.cell_pop, birth: this.birth_cycle, death: this.death_cycle });
                current = Math.floor(Date.now() / 1000);
                this.time++;
                count++;
                if ((this.time % this.opts.scene_update_range) === 0)
                    this.refresh();
                loop();
            };
            loop();
        });
    }
    refresh() {
        console.log(`-- refresh scene !`);
        const array = [];
        this.updates.forEach((v, k) => {
            if (v.length === 1 || (v.length > 1 && v[0] !== v[v.length - 1]))
                array.push(`${k},${v[v.length - 1]}`);
        });
        postMessage({ type: 'update', updates: array });
        this.updates = new Map();
    }
    update(location, plant = -1) {
        const key = `${location[0]},${location[1]},${location[2]}`;
        if (!this.updates.has(key))
            this.updates.set(key, []);
        this.updates.get(key).push(plant);
    }
    birth(cell) {
        this.set(cell.location, cell);
        this.cell_pop++;
        this.birth_cycle++;
        this.update(cell.location, cell.plant.plantid);
        if (this.opts.log.birth)
            console.log('Cell birth at %s plant %d as %d cells', JSON.stringify(cell.location), cell.plant.plantid, this.plants[cell.plant.plantid].size);
    }
    death(cell) {
        this.delete(cell.location);
        this.cell_pop--;
        this.death_cycle++;
        this.update(cell.location, -1);
        if (this.opts.log.death)
            console.log('Cell dead at %s plant %d as %d cells', JSON.stringify(cell.location), cell.plant.plantid, this.plants[cell.plant.plantid].size);
    }
}
//# sourceMappingURL=cube.js.map