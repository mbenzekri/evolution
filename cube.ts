
function apply(obj: Object, def: Object = {}): Object {
    const to = {};
    Object.keys(def).forEach((key) => {
        (<any>to)[key] = (key in obj) ? (<any>obj)[key] : (<any>def)[key];
    });
    return to;
}

type Coords = [number, number, number]

enum Direction {
    NORTH = 'N',
    SOUTH = 'S',
    EAST = 'E',
    WEST = 'W',
    TOP = 'T',
    BOTTOM = 'B',
}

const Gene = ['GN', 'GS', 'GE', 'GW', 'GT', 'GB', 'TN', 'TS', 'TE', 'TW', 'TT', 'TB']

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
}

// const DEFAULT_OPTIONS = {
//     genome_size: 10,
//     cube_width: 400,
//     cube_pop_size: 100000,
//     photons_per_drop: 2,
//     era_timeout: 300,
//     era_max_cycles: 600,
//     cell_max_photons: 3,
//     cell_init_photons: 0,
//     cell_max_fasting: 3,
//     log: {
//         birth: false,
//         death: false,
//         consume: false,
//         absorb: false,
//         steps: false,
//         cube: false,
//     }
// }

class Cell {
    private _step = 0;
    private _photons = 0
    get plant(): Plant { return this.world.plants[this.plantid] }
    get photons(): number { return this._photons }

    constructor(public readonly world: Cube, public readonly plantid: number, public readonly genome: string[], public readonly location: Coords, photons: number) {
        this.genome = genome
        this.absorb(photons)
        if (this.plant.cells) this.plant.push(this)
        this.world.birth(this)
    }


    die() {
        this.world.death(this)
        this.plant.pop(this)
    }
    absorb(photons: number) {
        this._photons = (this.photons < 0) ? photons : Math.min((this.photons + photons), this.world.opts.cell_max_photons);
        if (this.world.opts.log.absorb) console.log('Cell absorb at %s plant %d / photons %d', JSON.stringify(this.location), this.plant.plantid, this.photons)
    }
    private consume() {
        this._photons--;
        if (this.world.opts.log.consume) console.log('Cell consume at %s plant %d / photons %d', JSON.stringify(this.location), this.plant.plantid, this.photons)
        if (this.photons < this.world.opts.cell_max_fasting) this.die();
    }
    private grow(dir: Direction): Cell {
        // TODO
        let [lat, lon, alt] = this.location
        if (dir === Direction.EAST) lon += 1
        if (dir === Direction.WEST) lon -= 1
        if (dir === Direction.NORTH) lat += 1
        if (dir === Direction.SOUTH) lat -= 1
        if (dir === Direction.TOP) alt += 1
        if (dir === Direction.BOTTOM) alt -= 1
        if (this.world.isout([lat, lon, alt])) return
        if (this.world.exists([lat, lon, alt])) return;

        const cell = new Cell(this.world, this.plantid, this.genome, [lat, lon, alt], Math.floor(this.photons / 2))
        this._photons = Math.ceil(this.photons / 2)
        return cell;
    }
    private transfert(dir: Direction): Cell {
        let [lat, lon, alt] = this.location
        if (dir === Direction.EAST) lon += 1
        if (dir === Direction.WEST) lon -= 1
        if (dir === Direction.NORTH) lat += 1
        if (dir === Direction.SOUTH) lat -= 1
        if (dir === Direction.TOP) alt += 1
        if (dir === Direction.BOTTOM) alt -= 1
        if (this.world.isout([lat, lon, alt])) return
        const cell = this.world.get([lat, lon, alt])
        if (!cell) return
        cell.absorb(Math.floor(this.photons / 2))
        this._photons = Math.ceil(this.photons / 2)
        return cell;
    }
    cycle() {
        if (this.photons > 0) { // if we have some energy ...
            // cell realise a step  of its genetical destiny
            const gene = this.genome[this._step++ % this.genome.length];
            switch (gene) {
                case "GN": return this.grow(Direction.NORTH);
                case "GS": return this.grow(Direction.SOUTH); break;
                case "GE": return this.grow(Direction.EAST); break;
                case "GW": return this.grow(Direction.WEST); break;
                case "GT": return this.grow(Direction.TOP); break;
                case "GB": return this.grow(Direction.BOTTOM); break;
                case "TN": return this.transfert(Direction.NORTH); break;
                case "TS": return this.transfert(Direction.SOUTH); break;
                case "TE": return this.transfert(Direction.EAST); break;
                case "TW": return this.transfert(Direction.WEST); break;
                case "TT": return this.transfert(Direction.TOP); break;
                case "TB": return this.transfert(Direction.BOTTOM); break;
            };
        };
        // whatever happened we consume some energy
        this.consume();
    }

}

class Plant extends Cell {
    private static plantgen = 0;
    public readonly cells: Map<Coords, Cell> = new Map();
    get plant(): Plant { return this }
    constructor(world: Cube, genome: string[], location: Coords) {
        super(world, Plant.plantgen++, genome, location, world.opts.cell_init_photons);
        this.plant.push(this);
    }
    push(cell: Cell) {
        this.cells.set(cell.location, cell);
    }
    pop(cell: Cell) {
        this.cells.delete(cell.location);
    }
    get size(): number {
        return this.cells.size;
    }
    get energy(): number {
        let sum = 0;
        for (let cell of this.cells.values()) sum += cell.photons;
        return sum;
    }
    purge() {
        const stack: Cell[] = [this]
        const cells = new Map<Coords, Cell>()
        while (stack.length) {
            const cell = stack.pop()
            cells.set(cell.location, cell);
            const [lon, lat, alt] = cell.location
            const locations: Coords[] = [[lon + 1, lat, alt], [lon - 1, lat, alt], [lon, lat + 1, alt], [lon, lat - 1, alt], [lon, lat, alt + 1], [lon, lat, alt - 1]];
            locations.forEach(location => {
                if (!this.world.isin(location) && this.world.exists(location)) {
                    const neibourgh = this.world.get(location);
                    if (neibourgh.plantid === cell.plantid) stack.push(neibourgh)
                };
            })
        }
        for (let cell of this.cells.values()) {
            if (!cells.has(cell.location)) cell.die();
        }
    }

}

class Cube {

    time = 0;
    cubes: Cell[][] = [];
    plants: Plant[] = [];
    opts = DEFAULT_OPTIONS;
    // for 3D rendering
    updates = new Map<string, number[]>();
    // for statistics purpose
    cell_pop = 0;
    birth_cycle = 0;
    death_cycle = 0;
    cube_full = false;

    private constructor(opts: object = {}) {
        this.opts = <any>apply(opts, DEFAULT_OPTIONS);
        for (let i = 0; i < this.opts.cube_width * this.opts.cube_width; i++) {
            this.cubes[i] = [];
        }
    }

    static start(opts?: object): Cube {
        const world = new Cube(opts);
        console.log('Cube Started')
        return world;
    }

    run(): Promise<void> {
        return this.cycle().then(() => this.state()).catch(() => this.state());
    }
    state() {
        console.log('Cube Status ---------------------------------------------------')
        this.plants.forEach(plant => console.log('plant %d size %d energy %d', plant.plantid, plant.size, plant.energy))
        if (this.opts.log.cube) {
            for (let lon = 0; lon < this.opts.cube_width; lon++) {
                for (let lat = 0; lat < this.opts.cube_width; lat++) {
                    const col = this.cubes[lon * this.opts.cube_width + lat];
                    const plants = col.map(cell => cell.plantid + '/' + cell.photons)
                    console.log('%d , %d => %s', lon, lat, plants.join(','))
                }
            }
        }
        console.log('---------------------------------------------------------------')
    }
    col(lon: number, lat: number) {
        return this.cubes[lon * this.opts.cube_width + lat]
    }
    get(location: Coords): Cell {
        const [lon, lat, alt] = location;
        return this.cubes[lon * this.opts.cube_width + lat][alt];
    }
    set(location: Coords, cell: Cell): void {
        const [lon, lat, alt] = location;
        this.cubes[lon * this.opts.cube_width + lat][alt] = cell;
    }
    delete(location: Coords): void {
        const [lon, lat, alt] = location;
        const col = this.cubes[lon * this.opts.cube_width + lat];
        delete col[alt];
    }
    exists(location: Coords): boolean {
        return typeof this.get(location) !== 'undefined';
    }
    isin(location: Coords): boolean {
        const [lon, lat, alt] = location;
        return lon >= 0 && lon < this.opts.cube_width && lat >= 0 && lat < this.opts.cube_width && alt >= 0 && alt < this.opts.cube_width;
    }
    isout(location: Coords): boolean {
        return !this.isin(location);
    }
    random(): string[] {
        const genome: string[] = []
        while (genome.length < this.opts.genome_size) {
            const key = Math.floor(Math.random() * Gene.length)
            genome.push(Gene[key]);
        }
        return genome
    }
    // search a free cube on the soil (altitude 0)
    freesoil(): Coords {
        let col: number, cell: any = true;
        while (cell) {
            col = Math.floor(Math.random() * this.opts.cube_width * this.opts.cube_width)
            cell = this.cubes[col][0]
        }
        const lon = Math.floor(col / this.opts.cube_width);
        const lat = col % this.opts.cube_width;
        return [lon, lat, 0]
    }
    seed() {
        console.log('Seeding')
        for (let p = 0; p < this.opts.cube_pop_size; p++) {
            const plant = new Plant(this, this.random(), this.freesoil())
            this.plants.push(plant)
        }
        (<any>postMessage)({type: "seeded", count:this.plants.length })
        console.log('Cube Seeded')
        this.refresh()
    }
    drop() {
        if (this.opts.log.steps) console.log('  Dropping photons')
        this.cubes.forEach(col => {
            let last: Cell;
            col.forEach(cell => last = last || cell)
            last && last.absorb(this.opts.photons_per_drop);
        })
    }
    cycle(cycles: number = this.opts.era_max_cycles): Promise<void> {
        // TODO do that randomly !
        const start = Math.floor(Date.now() / 1000);
        let current = start;
        let count = 0;
        return new Promise<void>((resolve, reject) => {
            let loop = ()=> {
                if (this.time > this.opts.era_max_cycles || count > cycles || (current - start) > this.opts.era_timeout) {
                    this.refresh();
                    (<any>postMessage)({ type: 'time',time:this.time, sec: (current - start), pop:this.cell_pop, birth: this.birth_cycle, death: this.death_cycle });
                    (<any>postMessage)({type: "cycled", count:cycles });
                    resolve();
                    return;
                }
                this.birth_cycle = 0;
                this.death_cycle = 0;
                this.drop();
                if (this.opts.log.steps) console.log('  Cycling')
                this.cubes.forEach(col => { for (let alt in col) col[alt].cycle() });
                (<any>postMessage)({ type: 'time',time:this.time, sec: (current - start), pop:this.cell_pop, birth: this.birth_cycle, death: this.death_cycle });
                current = Math.floor(Date.now() / 1000);
                // TODOS ==> this.plants.forEach(plant => plant.purge());
                this.time++;
                count++
                // if ((this.time % this.opts.scene_update_range) === 0) this.refresh()
                // this.refresh()
                loop();
            };
            loop();
        })
    }
    refresh() {
        console.log(`-- refresh scene !`)
        const array: string[] = [];
        this.updates.forEach((v, k) => {
            if (v.length === 1 || (v.length > 1 && v[0] !== v[v.length - 1])) array.push(`${k},${v[v.length - 1]}`)
        });
        (<any>postMessage)({ type: 'update', updates: array});
        this.updates = new Map<string, number[]>();
    }
    update(location: Coords, plant: number = -1) {
        const key = `${location[0]},${location[1]},${location[2]}`
        if (!this.updates.has(key)) this.updates.set(key, [])
        this.updates.get(key).push(plant);
    }
    birth(cell: Cell) {
        this.set(cell.location, cell);
        this.cell_pop++;
        this.birth_cycle++;
        this.update(cell.location, cell.plantid)
        if (this.opts.log.birth) console.log('Cell birth at %s plant %d as %d cells', JSON.stringify(cell.location), cell.plantid, this.plants[cell.plantid].size)
    }
    death(cell: Cell) {
        this.delete(cell.location);
        this.cell_pop--;
        this.death_cycle++;
        this.update(cell.location, -1)
        if (this.opts.log.death) console.log('Cell dead at %s plant %d as %d cells', JSON.stringify(cell.location), cell.plantid, this.plants[cell.plantid].size)
    }
}
