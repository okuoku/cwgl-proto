const DLLPATH = "./dlltest/out/build/x64-Debug/appdll.dll";
const DLLUTIL = "../node-nccc/out/build/x64-Debug/nccc-utils.dll";
const FFI = require("ffi-napi");
const REF = require("ref-napi");
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

const rawcallbuf_in = util_malloc(8*8);
const rawcallbuf_out = util_malloc(8*8);
function rawcall_set_u64(idx, val){
    util_poke_u64(rawcallbuf_in + 8*idx, val);
}
function rawcall_set_f32(idx, val){
    util_poke_f32(rawcallbuf_in + 8*idx, val);
}
function rawcall_set_f64(idx, val){
    util_poke_f64(rawcallbuf_in + 8*idx, val);
}
function rawcall(addr){
    util_rawcall(addr, rawcallbuf_in, rawcallbuf_out);
}
function rawcall_get_u64(idx){
    return util_peek_u64(rawcallbuf_out + 8*idx);
}
function rawcall_get_f32(idx){
    return util_peek_f32(rawcallbuf_out + 8*idx);
}
function rawcall_get_f64(idx){
    return util_peek_f64(rawcallbuf_out + 8*idx);
}

function typechar(typename){
    switch(typename){
        case "f32":
            return "f";
        case "f64":
            return "d";
        case "u32":
            return "i";
        case "u64":
            return "l";
        default:
            throw "unknown typename" + typename;
    }
}

function types2string(types){
    return types.reduce((acc, e) => acc + typechar(e), "");
}

function make_callsite(shortcircuit, shufflecall_ptr){
    const STACK_SIZE = 1024;
    const sitestack = new BigInt64Array(STACK_SIZE);
    const stackaddr = REF.address(sitestack);
    let stackptr = 0;

    /* stack mgmt */
    function alloc(count){
        const r = stackptr;
        const newptr = stackptr + count;
        if(newptr >= STACK_SIZE){
            throw "Stack overflow";
        }
        stackptr = newptr;
        return r;
    }
    function free(count){
        const newptr = stackptr - count;
        if(newptr < 0){
            throw "Stack underflow";
        }
        stackptr = newptr;
    }
    function stack_set_f32(wordoffs, val){
        REF.set(sitestack, wordoffs * 8, val, REF.types.float);
    }
    function stack_set_f64(wordoffs, val){
        REF.set(sitestack, wordoffs * 8, val, REF.types.double);
    }
    function stack_get_f32(wordoffs){
        return REF.get(sitestack, wordoffs * 8, REF.types.float);
    }
    function stack_get_f64(wordoffs){
        return REF.get(sitestack, wordoffs * 8, REF.types.double);
    }

    function make_pointer(addr){
        return REF._reinterpret(REF.NULL, 8, addr);
    }

    function gen_inmapper(idx, type){
        switch(type){
            case "u32":
                return function(base){
                    const addr = base + idx * 8;
                    const r = REF.get(make_pointer(addr), 0, REF.types.int32);
                    return r;
                };
            case "u64":
                return function(base){
                    const addr = base + idx * 8;
                    return REF.readInt64LE(make_pointer(addr));
                };
            case "f32":
                return function(base){
                    const addr = base + idx * 8;
                    return REF.get(make_pointer(addr), 0, REF.types.float);
                };
            case "f64":
                return function(base){
                    const addr = base + idx * 8;
                    return REF.get(make_pointer(addr), 0, REF.types.double);
                };
            default:
                throw "Invalid function type";
        }
    }

    function gen_outmapper(idx, type){
        switch(type){
            case "u32":
                return function(base, v){
                    const addr = base + idx * 8;
                    //console.log("Write",v);
                    return REF.writeInt64LE(REF.NULL, addr, v);
                };
            case "u64":
                return function(base, v){
                    const addr = base + idx * 8;
                    //console.log("Write",v);
                    return REF.writeInt64LE(REF.NULL, addr, v);
                };
            case "f32":
                return function(base, v){
                    const addr = base + idx * 8;
                    return REF.set(make_pointer(addr), 0, v, REF.types.float);
                };
            case "f64":
                return function(base, v){
                    const addr = base + idx * 8;
                    return REF.set(make_pointer(addr), 0, v, REF.types.double);
                };
            default:
                throw "Invalid function type";
        }
    }

    function gen_nccc_cb(debugname, proc, intypes, outtypes){ // => Buffer
        const incount = intypes.length; // ["f32", "u32", ...]
        const outcount = outtypes.length;
        const inmapper = [];
        const outmapper = [];
        let i;
        for(i=0;i!=incount;i++){
            inmapper[i] = gen_inmapper(i, intypes[i]);
        }
        for(i=0;i!=outcount;i++){
            outmapper[i] = gen_outmapper(i, outtypes[i]);
        }
        function cb(inp, outp){
            //console.log("Called", debugname);
            const ina = new Array(incount);
            //console.log("In", inp, outp, debugname);
            inmapper.forEach((p,idx) => {
                //console.log("Inp", idx, intypes[idx]);
                ina[idx] = p(inp);
            });
            //console.log("Call", ina);
            let rt = null;
            try{
                rt = proc.apply(null, ina);
            }catch(e){
                if(e == "unwind"){
                    // Emscripten unwind exception
                    console.log("ignored unwind exception");
                }else{
                    throw e;
                }
            }
            //console.log("Ret", rt);
            if(rt === false){
                rt = 0;
            }else if(rt === true){
                rt = 1;
            }
            if(outcount == 0){
                return;
            }else if(outcount == 1){
                if(rt !== undefined){ // rt can be undefined (e.g. _emscripten_memcpy_big)
                    outmapper[0](outp, rt);
                }
            }else{
                outmapper.forEach((p,idx) => {
                    //console.log("Out", idx, rt[idx]);
                    p(outp, rt[idx]);
                });
            }
        }
        console.log("Generated",debugname,proc,intypes,outtypes);
        return FFI.Callback("void", ["size_t", "size_t"], cb);
    }

    function gen_nccc_cb_varargs2(debugname, proc){
        // Special gen_nccc_cb for register_func_type callback
        const inmapper = [];
        let i;
        const put_result = gen_outmapper(0, "u32");
        for(i=0;i!=32+2;i++){
            inmapper[i] = gen_inmapper(i, "u32");
        }
        function cb(inp, outp){
            let x = 0;
            const incount0 = inmapper[0](inp);
            const incount1 = inmapper[1](inp);
            const arg = [incount0, incount1];
            for(x=0;x!=incount0+incount1;x++){
                arg.push(inmapper[x+2](inp));
            }
            const rt = proc.apply(null, arg);
            put_result(outp, rt);
        }
        return FFI.Callback("void", ["size_t", "size_t"], cb);
    }

    return {
        make_nccc_cb: gen_nccc_cb,
        make_nccc_cb_varargs2: gen_nccc_cb_varargs2
    };
}

function nccc(){
    const VOID = REF.types.void;
    const VOIDP = REF.refType(VOID);
    const in0 = new BigInt64Array(8);
    const out0 = new BigInt64Array(8);
    const dllfile = FFI.DynamicLibrary(DLLPATH, FFI.DynamicLibrary.FLAGS.RTLD_NOW);
    const root = {};
    const rootaddr = dllfile.get("the_module_root").address();

    root.the_module_root = FFI.ForeignFunction(dllfile.get("the_module_root"),
                                               VOID, [VOIDP, VOIDP]);
    root.short_circuit = FFI.ForeignFunction(dllfile.get("short_circuit"),
                                             VOID, [VOIDP, VOIDP]);
    const shufflecall_ptr = dllfile.get("shufflecall_ptr");

    function callroot_buf(buf){
        root.the_module_root(in0, buf);
    }

    function get_callback(idx){
        rawcall_set_u64(0, 0);
        rawcall_set_u64(1, 0);
        rawcall_set_u64(2, idx);
        rawcall(rootaddr);
        return rawcall_get_u64(0);
    }

    function set_callback(val){
        rawcall_set_u64(0, 0);
        rawcall_set_u64(1, 1);
        rawcall_set_u64(2, val);
        rawcall(rootaddr);
    }

    // String access
    function fetchstring(addr){
        return REF.readCString(REF.NULL, addr);
    }

    // WASM Generic
    function library_info(){
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 1);
        rawcall_set_u64(2, 0);
        rawcall(rootaddr);
        const exports = rawcall_get_u64(0);
        const imports = rawcall_get_u64(1);
        const totalidx = rawcall_get_u64(2);
        const callinfos = rawcall_get_u64(3);
        const r = [exports, imports, totalidx /* Unused? */, callinfos];
        console.log("Library", r);
        return r;
    }
    function set_bootstrap(idx, dispatch, ptr){
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 2);
        rawcall_set_u64(2, idx);
        rawcall_set_u64(3, dispatch);
        rawcall_set_u64(4, ptr);
        rawcall(rootaddr);
    }
    function init_module(){
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 3);
        rawcall(rootaddr);
    }
    function read_table(instance_id, index){
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 4);
        rawcall_set_u64(2, instance_id);
        rawcall_set_u64(3, index);
        rawcall(rootaddr);
        const res = rawcall_get_u64(0);
        if(res != 0){
            return false;
        }
        const functype = rawcall_get_u64(1);
        const funcobj = rawcall_get_u64(2);
        return [functype, funcobj];
    }

    function library_get_export(idx){
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 5);
        rawcall_set_u64(2, idx);
        rawcall(rootaddr);
        const res = rawcall_get_u64(0);
        if(res != 0){
            return false;
        }
        const name = fetchstring(rawcall_get_u64(1));
        const addr = rawcall_get_u64(2);
        const callinfoidx = rawcall_get_u64(3);
        const is_variable = rawcall_get_u64(4) ? true : false;
        const types = callinfo_get_types(callinfoidx);
        const r = [name, addr, types, is_variable];
        //console.log("Export", r);
        return r;
    }

    function library_get_import(idx){
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 6);
        rawcall_set_u64(2, idx);
        rawcall(rootaddr);
        const res = rawcall_get_u64(0);
        if(res != 0){
            return false;
        }
        const name0 = fetchstring(rawcall_get_u64(1));
        const name1 = fetchstring(rawcall_get_u64(2));
        const callinfoidx = rawcall_get_u64(3);
        const is_variable = rawcall_get_u64(4) ? true : false;
        const types = callinfo_get_types(callinfoidx);
        const r = [name0, name1, types, is_variable];
        //console.log("Import", r);
        return r;
    }
    
    function library_set_import_f32(idx, value){
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 7);
        rawcall_set_u64(2, idx);
        rawcall_set_u64(3, 0);
        rawcall_set_f32(4, value);
        rawcall(rootaddr);

        if(rawcall_get_u64(0) != 0){
            throw "set_import error";
        }
    }

    function library_set_import_f64(idx, value){
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 7);
        rawcall_set_u64(2, idx);
        rawcall_set_u64(3, 0);
        rawcall_set_f64(4, value);
        rawcall(rootaddr);

        if(rawcall_get_u64(0) != 0){
            throw "set_import error";
        }
    }

    function library_set_import(idx, value){
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 7);
        rawcall_set_u64(2, idx);
        rawcall_set_u64(3, 0);
        rawcall_set_u64(4, value);
        rawcall(rootaddr);

        if(rawcall_get_u64(0) != 0){
            throw "set_import error";
        }
    }

    function library_set_import_fn(idx, dispatch, value){
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 7);
        rawcall_set_u64(2, idx);
        rawcall_set_u64(3, dispatch);
        rawcall_set_u64(4, value);
        rawcall(rootaddr);

        if(rawcall_get_u64(0) != 0){
            throw "set_import error";
        }
    }

    function callinfo_get_counts(idx){
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 8);
        rawcall_set_u64(2, idx);
        rawcall(rootaddr);
        const res = rawcall_get_u64(0);
        if(res != 0){
            return false;
        }
        const argcount = rawcall_get_u64(1);
        const retcount = rawcall_get_u64(2);
        return [argcount, retcount];
    }

    function typeenum(t){
        switch(t){
            case 0:
                return "u32";
            case 1:
                return "u64";
            case 2:
                return "f32";
            case 3:
                return "f64";
            case -1:
                return "memory";
            case -2:
                return "table";
            default:
                throw "Invalid function type info";
        }
    }

    function callinfo_get_types(idx){
        const counts = callinfo_get_counts(idx);
        const args = counts[0];
        const rets = counts[1];
        const buf = new BigInt64Array(args+rets+3);
        in0[0] = 1n;
        in0[1] = 9n;
        in0[2] = BigInt(idx);
        callroot_buf(buf);
        const res = Number(buf[0]);
        if(res != 0){
            throw "Invalid function";
        }
        const argv = new Array(args);
        const resv = new Array(rets);
        argv.fill(false);
        resv.fill(false);
        argv.forEach((_,idx) => {
            const t = Number(buf[3+idx]);
            argv[idx] = typeenum(t);
        });
        resv.forEach((_,idx) => {
            const t = Number(buf[3+args+idx]);
            resv[idx] = typeenum(t);
        });
        //console.log("Func",idx,argv,"=>",resv);
        return [argv, resv];
    }

    function typebridge_get_counts(idx){
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 10);
        rawcall_set_u64(2, idx);
        rawcall(rootaddr);
        const res = rawcall_get_u64(0);
        if(res != 0){
            return false;
        }
        const argcount = rawcall_get_u64(1);
        const retcount = rawcall_get_u64(2);
        return [argcount, retcount];
    }

    function typebridge_get_types(idx){
        const counts = typebridge_get_counts(idx);
        const args = counts[0];
        const rets = counts[1];
        const buf = new BigInt64Array(args+rets+4);
        in0[0] = 1n;
        in0[1] = 11n;
        in0[2] = BigInt(idx);
        callroot_buf(buf);
        const res = Number(buf[0]);
        if(res != 0){
            throw "Invalid typeid";
        }
        const bridgeaddr = Number(buf[1]);
        const argv = new Array(args);
        const resv = new Array(rets);
        argv.fill(false);
        resv.fill(false);
        argv.forEach((_,idx) => {
            const t = Number(buf[4+idx]);
            argv[idx] = typeenum(t);
        });
        resv.forEach((_,idx) => {
            const t = Number(buf[4+args+idx]);
            resv[idx] = typeenum(t);
        });
        //console.log("Typebridge",idx,bridgeaddr,argv,"=>",resv);
        return [bridgeaddr, argv, resv];
    }

    function init_memory(current_pages, max_pages, native_addr){
        // => instance_id
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 12);
        rawcall_set_u64(2, current_pages);
        rawcall_set_u64(3, max_pages);
        rawcall_set_u64(4, native_addr);
        rawcall(rootaddr);
        const instance_id = rawcall_get_u64(0);
        return instance_id;
    }
    function init_table(elements, max_elements){
        // => instance_id
        rawcall_set_u64(0, 1);
        rawcall_set_u64(1, 13);
        rawcall_set_u64(2, elements);
        rawcall_set_u64(3, max_elements);
        rawcall(rootaddr);
        const instance_id = rawcall_get_u64(0);
        return instance_id;
    }

    const typestore = {};
    const typelookup = {};
    // FIXME: perhaps we should move this elsewhere
    function register_func_type(params, results, ...data){
        const paramv = data.slice(0,params).map(typeenum);
        const resultv = data.slice(params,params+results).map(typeenum);
        const typename = paramv.toString() + "::" + resultv.toString();
        //console.log("Types",params,results,data,paramv,resultv);
        //console.log("Lookup type", typename, typestore[typename]);
        return typestore[typename].idx;
    }
    const tablecache = {};
    let table_instance = false;
    function allocate_table(instance_id, initial, max){
        if(table_instance){
            throw "two or more tables...";
        }
        table_instance = instance_id;
    }

    function realize_callable(addr, typeidx){
        const params = typelookup[typeidx].params;
        const results = typelookup[typeidx].results;
        const bridgeaddr = typelookup[typeidx].bridgeaddr;
        console.log("Realize", typeidx, params, results);
        return node_nccc.make_nccc_call("table", bridgeaddr, addr, 
                                        types2string(params),
                                        types2string(results));
    }

    function get_table(tableidx){
        //console.log("Table", tableidx);
        const r = read_table(table_instance, tableidx);
        //console.log("Table", r);
        const functype = r[0];
        const addr = r[1];
        if(tablecache[tableidx]){
            return tablecache[tableidx];
        }else{
            const cb = realize_callable(addr, functype);
            tablecache[tableidx] = cb;
            return cb;
        }
    }

    const shortcircuit_ptr = get_callback(1);
    //const shufflecall_ptr = get_callback(2);
    const callsite = make_callsite(root.short_circuit, shufflecall_ptr);
    console.log("DLL Init", shufflecall_ptr);

    let i = 0;
    const libinfo = library_info();
    const exportcount = libinfo[0];
    const importcount = libinfo[1];
    const typecount = libinfo[3];
    const exports = {};
    const imports = {};
    const import_cbs = {};

    for(i=0;i!=exportcount;i++){
        const c = library_get_export(i);
        const name = c[0];
        const addr = c[1];
        const types = c[2];
        const is_variable = c[3];
        let proc = false;
        if(! is_variable){
            proc = node_nccc.make_nccc_call(name, 0, addr, 
                                            types2string(types[0]), 
                                            types2string(types[1]));
        }
        exports[name] = {
            proc: proc,
            is_variable: is_variable,
            types: c[2],
        };
    }

    for(i=0;i!=importcount;i++){
        const idx = i;
        const c = library_get_import(i);
        const name0 = c[0];
        const name1 = c[1];
        const types = c[2];
        const is_variable = c[3];
        if(! imports[name0]){
            imports[name0] = {};
        }
        let attach = null;
        function attach_function(proc){
            const intypes = types2string(types[0]);
            const outtypes = types2string(types[1]);
            console.log("Generating", proc, intypes, outtypes);
            const cba = node_nccc.make_nccc_cb(proc, intypes, outtypes);
            // FIXME: Retain reference..?
            library_set_import_fn(idx, cba[0], cba[1]);
        }
        function attach_memory(mem){
            const current_pages = mem.__wasmproxy_current_page();
            const max_pages = 32768;
            const native_addr = REF.address(mem.__wasmproxy_heap);
            const memory_instance = init_memory(current_pages, max_pages, native_addr);
            console.log("Attach memory",mem,native_addr);
            library_set_import(idx, memory_instance);
        }
        function attach_table(tbl){
            table_instance = init_table(tbl.__wasmproxy_tablesize, tbl.__wasmproxy_tablesize);
            console.log("Attach table",tbl,table_instance);
            library_set_import(idx, table_instance);
        }
        function attach_f32(obj){
            library_set_import_f32(idx, obj);
        }
        function attach_f64(obj){
            library_set_import_f64(idx, obj);
        }
        function attach_variable(obj){
            library_set_import(idx, obj);
        }
        if(is_variable){
            switch(types[1][0]){
                case "memory":
                    attach = attach_memory;
                    break;
                case "table":
                    attach = attach_table;
                    break;
                case "f32":
                    attach = attach_f32;
                    break;
                case "f64":
                    attach = attach_f64;
                    break;
                default:
                    attach = attach_variable;
                    break;
            }
        }else{
            attach = attach_function;
        }

        imports[name0][name1] = {
            attach: attach
        };
    }

    for(i=0;i!=typecount;i++){
        //console.log("Check",i,typecount);
        const c = typebridge_get_types(i);
        const bridgeaddr = c[0];
        const paramv = c[1];
        const resultv = c[2];
        const typename = paramv.toString() + "::" + resultv.toString();
        if(!typestore[typename]){
            typestore[typename] = {
                bridgeaddr: bridgeaddr,
                params: paramv,
                results: resultv,
                idx: i
            };
            typelookup[i] = typestore[typename];
            //console.log("Type", typestore[typename]);
        }
    }
    
    const bootimports = [
        [1, "wasm_boot_allocate_memory", ["u64", "u64", "u64"], ["u64", "u64"]],
        [2, "wasm_boot_allocate_table", ["u64", "u64", "u64"], []],
        [3, "wasm_boot_grow_memory", ["u64", "u64"], ["u64", "u64"]],
        [4, "wasm_boot_register_func_type", false, false]
    ];
    return {
        bootstrap: function(imports){
            imports.wasm_boot_allocate_table = allocate_table;
            imports.wasm_boot_register_func_type = register_func_type;
            bootimports.forEach(e => {
                const idx = e[0];
                const name = e[1];
                const intypes = e[2];
                const outtypes = e[3];
                let pair = false;
                if(!intypes){
                    // Only for: wasm_boot_register_func_type
                    // "iiii....iiii" => "i"
                    const instr = "iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii"; // (32)
                    const outstr = "i";
                    pair = node_nccc.make_nccc_cb(imports[name],
                                                  instr, outstr);
                }else{
                    console.log("CB", imports[name], intypes, outtypes);
                    pair = node_nccc.make_nccc_cb(imports[name], 
                                                  types2string(intypes),
                                                  types2string(outtypes));
                }
                // FIXME: Keep reference?
                console.log("Set bootstrap",pair);
                set_bootstrap(idx, pair[0], pair[1]);
            });
            set_callback(shortcircuit_ptr);
            console.log("Init DLL");
            init_module();
        },
        exports: exports,
        imports: imports,
        get_table: get_table
    };
}

module.exports = nccc;
