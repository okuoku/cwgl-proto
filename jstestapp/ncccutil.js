const DLLUTIL = "../node-nccc/out/build/x64-Debug/nccc-utils.dll";
const FFI = require("ffi-napi");
const node_nccc = require("../node-nccc/out/build/x64-Debug/node-nccc");

const utildll = FFI.DynamicLibrary(DLLUTIL, FFI.DynamicLibrary.FLAGS.RTLD_NOW);

const util_rawcall_addr = utildll.get("util_rawcall").address();
const util_peek_u64_addr = utildll.get("util_peek_u64").address();
const util_poke_u64_addr = utildll.get("util_poke_u64").address();
const util_peek_u32_addr = utildll.get("util_peek_u32").address();
const util_poke_u32_addr = utildll.get("util_poke_u32").address();
const util_malloc_addr = utildll.get("util_malloc").address();
const util_free_addr = utildll.get("util_free").address();

const util_rawcall = node_nccc.make_nccc_call("rawcall",
                                              0, util_rawcall_addr,
                                              "lll", "");
const util_malloc = node_nccc.make_nccc_call("malloc",
                                             0, util_malloc_addr,
                                             "l", "l");
const util_free = node_nccc.make_nccc_call("free",
                                           0, util_free_addr,
                                           "l", "");
const util_peek_u64 = node_nccc.make_nccc_call("peek_u64",
                                               0, util_peek_u64_addr,
                                               "l", "l");
const util_peek_u32 = node_nccc.make_nccc_call("peek_u32",
                                               0, util_peek_u32_addr,
                                               "l", "l");
const util_peek_f64 = node_nccc.make_nccc_call("peek_f64", // reinterpret
                                               0, util_peek_u64_addr,
                                               "l", "d");
const util_peek_f32 = node_nccc.make_nccc_call("peek_f32", // reinterpret
                                               0, util_peek_u32_addr,
                                               "l", "f");
const util_poke_u64 = node_nccc.make_nccc_call("poke_u64",
                                               0, util_poke_u64_addr,
                                               "ll", "");
const util_poke_f64 = node_nccc.make_nccc_call("poke_f64", // reinterpret
                                               0, util_poke_u64_addr,
                                               "ld", "");
const util_poke_f32 = node_nccc.make_nccc_call("poke_f32", // reinterpret
                                               0, util_poke_u32_addr,
                                               "lf", "");

function fetchbyte(addr){
    const resid = addr % 4;
    const peekaddr = addr - resid;
    const v = util_peek_u32(peekaddr);
    let out = 0;
    switch(resid){
        case 0:
            out = v & 0xff;
            break;
        case 1:
            out = v >> 8;
            out = out & 0xff;
            break;
        case 2:
            out = v >> 16;
            out = out & 0xff;
            break;
        case 3:
            out = v >> 24;
            out = out & 0xff;
            break;
    }
    return out;
}

function fetchcstring(addr){
    let acc = [];
    let c = 0;
    let cur = addr;
    while(1){
        c = fetchbyte(cur);
        if(c == 0){
            break;
        }
        acc.push(c);
        cur++;
    }
    const str = String.fromCharCode.apply(null, acc);
    return str;
}



module.exports = {
    fetchcstring: fetchcstring,
    node_nccc: node_nccc,
    rawcall: util_rawcall,
    malloc: util_malloc,
    free: util_free,
    peek_u64: util_peek_u64,
    peek_u32: util_peek_u32,
    peek_f64: util_peek_f64,
    peek_f32: util_peek_f32,
    poke_u64: util_poke_u64,
    poke_f64: util_poke_f64,
    poke_f32: util_poke_f32,
};
