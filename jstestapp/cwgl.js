const DLLPATH = "../out/build/x64-Debug/cwgl.dll";
const FFI = require("ffi-napi");
const REF = require("ref-napi");

// Types
const cwglCtx = REF.refType(REF.types.void);

function genlibdef() {
    const Int = "int";
    const Float = "float";
    const _ = "void";
    const C = cwglCtx;
    return {
        cwgl_init: [Int, []],
        cwgl_ctx_frame_begin: [_, [C]],
        cwgl_ctx_frame_end: [_, [C]],
        cwgl_ctx_create: [C, [Int,Int,Int,Int]],
        cwgl_viewport: [_, [C, Int,Int,Int,Int]],
        cwgl_clearColor: [_, [C, Float, Float, Float, Float]],
        cwgl_clear: [_, [C, Int]],
    };
}

const libdef = genlibdef();
const CWGL = FFI.Library(DLLPATH, libdef);


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
