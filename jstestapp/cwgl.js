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

module.exports = CWGL;
