# evolution
A genetic evolution simulation

## the time 
- the time goes by cycle units
- each cyle run add one to time
- each cycle is running identical
- times goes until end of era is reached

## the era
- an era start at time 0 (or zero time) 
- an era terminates when no more cells (return to nolife) ...
- or an era terminates when end of simulation reached (time era_timeout)

## at zero time
- there is no life (no cells) the Cube is empty
- the bottom of the Cube is randomly seeded by a population of cells(plant) (_size)
- time starts and goes on cycle by cycle ...

## the Cube (notice the uppercase)
- the Cube is the world where simulated life take place
- the Cube is composed of [cube_width x cube_width x cube_width] cubes (lowercase) 
- the Cube have direction north,south,east,west,top,bottom
- the Cube is watered by photons providing energy for cells life

## a cube 
- a cube may contain  a cell and only one
- a cube not containing a cell is empty
- at (zero time) all the cubes are empty (no life)
- a cube has a location expressed in longitude,latitude,altitude (or lon,lat,alt in that order)

## a photon
- a photon is an energy provider for cells
- a photon fall verticaly from top to bottom 
- a photon is absorbed by first touched cell
- a photon which is not absorbed is lost (dropped on soil)
- each cycle the top of the Cube drop photons (photons_per_cube) as energy for life

## a cell
- a cell is a component of a plant 
- a cell is in a cube therefore has a location
- a cell has a genome
- each cycle the cell execute his genome code
- each cell absorbs the photons that fall on it for a cycle
- a cell consumes one photon per cycle
- a cell may store photons (to maximum of cell_max_photons)
- a cell with 0 photons during few cycles die (disappear cell_max_fasting)
- a cell may transfert photons in all directions depending on its genome
- a cell may grow (duplicate  itselfs) in all directions depending on its genome

## a genome
- a genome is a sequence of genes (of genome_size genes)
- a gene is selected from : GN,GS,GE,GW,GB,GT, TN,TS,TE,TW,TB,TT
- GN means grow north, GE mean grow east, ... one for each direction
- TN means transfert 1 photon north, ... one for each direction
- genome is duplicated exactly when cell grow (duplicate  itselfs)

## a plant
- a plant the unique live being of the Cube 
- a plant is composed of all the cells originated from same cell growth

## a cycle
- photons are absorbed, cell photons increases
- for each gene of the genome do the the corresponding job (tranfert or grow to the appropriate direction) 
- cell photons dicreased by one (photon is consumed)
- if photon storage is too low cell  die (if photon count reached -cell_max_fasting)
- for equity cells are treated randomly for each cycle

COMING SOON .... THE EVOLUTION !
