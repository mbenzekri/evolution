# evolution
A genetic evolution simulation

## the time 
- the time goes by cycle 
- time start at 0 (zero time) to end of simulation (end time) ...
- each time cycle (or cycle) is running identical

## the world or the Cube (notice the uppercase)
- the Cube is the location where simulated life take place
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
- a cell is a component of a plant a Cube's living being 
- a cell is in a cube therefore has a location
- a cell has a genome
- each cycle the cell execute his genome code
- each cell absorbs the photons that fall on it for a cycle
- a cell consumes one photon per cycle
- a cell may store a maximum of 20 photons
- a cell with 0 photons during 3 cycles die (disappear)
- a cell may transfert photons in all directions depending on its genome
- a cell may grow (duplicate  itselfs) in all directions depending on its genome

## a genome
- a genome is a sequence of genes 
- a gene is selected from : GN,GS,GE,GW,GB,GT, TN,TS,TE,TW,TB,TT
- GN means grow north, GE mean grow east, ... one for each direction
- TN means transfert 1 photon north, ... one for each direction

## a plant
- a plant the unique live being of the Cube 
- a plant is composed of all the cells originated from same cell growth

## a cycle

## at zero time
- the bottom of the Cube is seeded by a generation of cells
- time goes on cycle by cycle ...

## an era
