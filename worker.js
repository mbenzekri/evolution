/* global Cube, importScripts */
importScripts('./build/cube.js');
let world = null;
onmessage = function (event) {
    console.log('message receive on WORKER:', JSON.stringify(event.data.type));
    switch (event.data.type) {
        case 'start': world = Cube.start(event.data.options); break;
        case 'seed': world.seed(); break;
        case 'cycle': world.cycle(event.data.cycles); break;
        default: break;
    }
};
