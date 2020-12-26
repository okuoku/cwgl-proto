const CWGL = require("./cwgl.js");

const w = 1280;
const h = 720;
CWGL.cwgl_init();
const ctx = CWGL.cwgl_ctx_create(w,h,0,0);

console.log(ctx);

let frame = 0;
for(;;){
    let step = frame % 256;
    let col = 1.0 * step / 256.0;

    CWGL.cwgl_ctx_frame_begin(ctx);

    CWGL.cwgl_viewport(ctx, 0, 0, w, h);
    CWGL.cwgl_clearColor(ctx, col, col, col, 1.0);
    CWGL.cwgl_clear(ctx, 0x4000 /* COLOR BUFFER BIT */);

    CWGL.cwgl_ctx_frame_end(ctx);
    frame++;
}

