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
const util_ptraddr_addr = utildll.get("util_ptraddr").address();

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
                                               "p", "l");
const util_peek_u32 = node_nccc.make_nccc_call("peek_u32",
                                               0, util_peek_u32_addr,
                                               "p", "l");
const util_peek_f64 = node_nccc.make_nccc_call("peek_f64", // reinterpret
                                               0, util_peek_u64_addr,
                                               "p", "d");
const util_peek_f32 = node_nccc.make_nccc_call("peek_f32", // reinterpret
                                               0, util_peek_u32_addr,
                                               "p", "f");
const util_poke_u64 = node_nccc.make_nccc_call("poke_u64",
                                               0, util_poke_u64_addr,
                                               "pl", "");
const util_poke_f64 = node_nccc.make_nccc_call("poke_f64", // reinterpret
                                               0, util_poke_u64_addr,
                                               "pd", "");
const util_poke_f32 = node_nccc.make_nccc_call("poke_f32", // reinterpret
                                               0, util_poke_u32_addr,
                                               "pf", "");
const util_ptraddr = node_nccc.make_nccc_call("ptraddr",
                                              0, util_ptraddr_addr,
                                              "p","l");

function fetchbyte(addr){
    if(addr == 0){
        throw "Invalid address";
    }
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

function do_rawcall(addr, ina, outcount){
    const out = [];
    const inbuf = util_malloc(8 * ina.length);
    const outbuf = util_malloc(8 * outcount);
    let i = 0;
    for(i=0;i!=ina.length;i++){
        util_poke_u64(inbuf + i*8, ina[i]);
    }
    util_rawcall(addr, inbuf, outbuf);
    for(i=0;i!=outcount;i++){
        out.push(util_peek_u64(outbuf + i*8));
    }
    util_free(inbuf);
    util_free(outbuf);
    return out;
}

function nccctypechar(nr){
    switch(nr){
        case 0:
            return "i";
        case 1:
            return "l";
        case 2:
            return "f";
        case 3:
            return "d";
        case 6:
            return "p";
        default:
            throw "Unknown";
    }
}

function nccctypes2string(types){
    return types.reduce((acc, e) => acc + nccctypechar(e), "");
}

function opendll(path, modname){ // => {libs: {<lib>: {exports: ...}}}
    const dllfile = FFI.DynamicLibrary(path,
                                       FFI.DynamicLibrary.FLAGS.RTLD_NOW);
    const rootaddr = dllfile.get(modname + "_nccc_root_00").address();
    console.log("Module",path,rootaddr);
    function collection_info(){
        const out = do_rawcall(rootaddr, [0, 0, 1], 4);
        const r = {
            max_libs: out[2],
            max_version: out[3]
        };
        return r;
    }
    function library_info(lib){
        const out = do_rawcall(rootaddr, [1, lib, 1], 6);
        const r = {
            name0: fetchcstring(out[0]),
            name1: out[1] == 0 ? false : fetchcstring(out[1]),
            max_exports: out[2],
            max_imports: out[3],
            max_variables: out[4],
            max_stubs: out[5]
        };
        return r;
    }
    function get_export(lib, exportid){
        // library_export_info
        const out = do_rawcall(rootaddr, [1, lib, 2, exportid], 8);
        if(out[0] != 0){
            throw "Invalid res";
        }
        const info = {
            objid: out[1],
            name: fetchcstring(out[2]),
            stubtype: out[3],
            addr0: out[4],
            addr1: out[5],
            incount: out[6],
            outcount: out[7]
        };
        // library_arg_info
        const arga = do_rawcall(rootaddr, [1, lib, 6, info.objid],
                                info.incount + info.outcount + 3);
        if(arga[0] != 0){
            throw "Invalid res";
        }
        const inc = arga[1]; // Use return value
        const outc = arga[2]; // Use return value
        const parama = nccctypes2string(arga.slice(3,3+inc));
        const resulta = nccctypes2string(arga.slice(3+inc,3+inc+outc));
        console.log("Generating",modname,info.name,info.addr1,parama,resulta);
        info.proc = node_nccc.make_nccc_call(info.name, info.addr0, info.addr1,
                                             parama, resulta);
        return info;
    }

    const col = collection_info();
    const lib = {libs: {}};
    function setlib(l, exp){
        if(l.name1){
            if(! lib.libs[l.name0]){
                lib.libs[l.name0] = {};
            }
            if(! lib.libs[l.name0][l.name1]){
                lib.libs[l.name0][l.name1] = {};
            }
            lib.libs[l.name0][l.name1][exp.name] = exp;
        }else{
            if(! lib.libs[l.name0]){
                lib.libs[l.name0] = {};
            }
            lib.libs[l.name0][exp.name] = exp;
        }
    }
    let libi = 0;
    for(libi = 0; libi != col.max_libs; libi++){
        const libinfo = library_info(libi);
        console.log("Library", libinfo);
        let expi;
        for(expi = 0; expi != libinfo.max_exports; expi++){
            const exp = get_export(libi, expi);
            console.log("Export", exp);
            setlib(libinfo, exp);
        }
    }
    return lib;
}

function opendll_raw(path, rootsym){ // => addr
    const dllfile = FFI.DynamicLibrary(path, 
                                       FFI.DynamicLibrary.FLAGS.RTLD_NOW);
    const rootaddr = dllfile.get(rootsym).address();
    return rootaddr;
}

function opendll_null(path){ // => something
    const dllfile = FFI.DynamicLibrary(path, 
                                       FFI.DynamicLibrary.FLAGS.RTLD_NOW);
    return dllfile;
}


module.exports = {
    opendll: opendll,
    opendll_raw: opendll_raw,
    opendll_null: opendll_null,
    fetchcstring: fetchcstring,
    node_nccc: node_nccc,
    rawcall: util_rawcall,
    malloc: util_malloc,
    free: util_free,
    ptraddr: util_ptraddr,
    peek_u64: util_peek_u64,
    peek_u32: util_peek_u32,
    peek_f64: util_peek_f64,
    peek_f32: util_peek_f32,
    poke_u64: util_poke_u64,
    poke_f64: util_poke_f64,
    poke_f32: util_poke_f32,
};
