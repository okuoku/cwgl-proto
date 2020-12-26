const GL = require("./webgl-cwgl.js");

const w = 1280;
const h = 720;
const gl = GL(w,h,{});

let Tex = null;
let frame = 0;

function step() {
    let step = frame % 256;
    let col = 1.0 * step / 256.0;

    gl.cwgl_frame_begin();

    gl.viewport(0,0,w,h);
    gl.clearColor(col,col,col,1.0);
    gl.clear(0x4000 /* COLOR BUFFER BIT */);

    gl.cwgl_frame_end();
    frame++;
}

function mainloop(){
    step();
    setImmediate(mainloop);
}

mainloop();
