# evolution
A genetic evolution simulation

## the time 
- the time goes by cycle units
- each cyle run add one to time
- times goes until end of [era](# the era) is reached

## the era
- an era start at time 0 (or zero time) 
- an era terminates when no more cells (return to nolife) ...
- an era terminates at maximum when end of simulation reached (time MAX_ERA_TIME)

## at zero time
- there is no life (no cells) 
- the bottom of the Cube is randomly seeded by a generation of cells (NCELL_ZERO_TIME)
- time starts and goes on cycle by cycle ...

## the Cube (notice the uppercase)
- the Cube is the world where simulated life take place
- the Cube is composed of 1000x1000x1000 small cubes or cubes(lowercase)
- the cube have direction north,south,east,west,top,bottom
- each cycle the top of the Cube drop light (photons) as energy for life

## a cube 
- a cube may contain  a cell and only one
- a cube not containing a cell is empty
- at (zero time) all the cubes are empty (no life)
- a cube has a location expressed in longitude,latitude,altitude (or lon,lat,alt in that order)

## a photon
- a photo is an energy provider for cells
- a photon fall verticaly from top to bottom 
- a photo is absorbed by first touched cell
- a photo wich is not absorbed is lost

## a cell
- a cell is a component of a plant 
- a cell is in a cube therefore has a location
- a cell has a genome
- each cycle the cell execute his genome code
- each cell absorbs the photons that fall on it for a cycle
- a cell consumes one photon per cycle
- a cell may store photons (to maximum of MAX_CELL_PHOTON)
- a cell with 0 photons during few cycles die (disappear CELL_CYCLES_DIE)
- a cell may transfert photons in all directions depending on its genome
- a cell may grow (duplicate  itselfs) in all directions depending on its genome

## a genome
- a genome is a sequence of genes 
- a gene is selected from : GN,GS,GE,GW,GB,GT, TN,TS,TE,TW,TB,TT
- GN means grow north, GE mean grow east, ... one for each direction
- TN means transfert 1 photon north, ... one for each direction
- genome is duplicated exactly when cell grow (duplicate  itselfs)

## a plant
- a plant the unique live being of the Cube 
- a plant is composed of all the cells originated from same cell growth

## a cycle
- each cycle is running identical


