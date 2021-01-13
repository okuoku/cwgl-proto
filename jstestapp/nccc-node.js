const DLLPATH = "./dlltest/out/build/x64-Debug/appdll.dll";
const FFI = require("ffi-napi");
const REF = require("ref-napi");

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
                    console.log("Write",v);
                    return REF.writeInt64LE(REF.NULL, addr, v);
                };
            case "u64":
                return function(base, v){
                    const addr = base + idx * 8;
                    console.log("Write",v);
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
            const ina = new Array(incount);
            console.log("In", inp, outp, debugname);
            inmapper.forEach((p,idx) => {
                console.log("Inp", idx, intypes[idx]);
                ina[idx] = p(inp);
            });
            console.log("Call", ina);
            const rt = proc.apply(null, ina);
            console.log("Ret", rt);
            if(outcount == 0){
                return;
            }else if(outcount == 1){
                if(rt !== undefined){ // rt can be undefined (e.g. _emscripten_memcpy_big)
                    outmapper[0](outp, rt);
                }
            }else{
                outmapper.forEach((p,idx) => {
                    console.log("Out", idx, rt[idx]);
                    p(outp, rt[idx]);
                });
            }
        }
        return FFI.Callback("void", ["size_t", "size_t"], cb);
    }

    /* shufflecall */
    // void shufflecall_ptr(uint64_t* cmd, uint64_t* ret,uint64_t cmdoffset,
    //                      void* p0, void* p1, void* p2, void* p3);

    function gen_shufflecall_one(typ){
        const typ0 = typ & 1 ? "string" : "void*";
        const typ1 = typ & 2 ? "string" : "void*";
        const typ2 = typ & 4 ? "string" : "void*";
        const typ3 = typ & 8 ? "string" : "void*";
        return FFI.ForeignFunction(shufflecall_ptr, "void",
                                   ["size_t", "size_t", "size_t",
                                       typ0, typ1, typ2, typ3]);
    }
    function gen_shufflecalls(){
        const r = [];
        let i = 0;
        for(i=0;i!=16;i++){
            r.push(gen_shufflecall_one(i));
        }
        return r;
    }
    const shufflecalls = gen_shufflecalls();
    function shufflecall(instack, outstack, cmdoffs, a, b, c, d){
        const inaddr = instack * 8 + stackaddr;
        const outaddr = outstack * 8 + stackaddr;
        let sel = 0;
        if(typeof a === "string"){
            sel += 8;
        }
        if(typeof b === "string"){
            sel += 4;
        }
        if(typeof c === "string"){
            sel += 2;
        }
        if(typeof d === "string"){
            sel += 1;
        }
        shufflecalls[sel](inaddr, outaddr, cmdoffs, a, b, c, d);
    }
    function gen_nccc_call(debugname, addr, intypes, outtypes){
        const incount = intypes.length; // ["f32", "u32", ...]
        const outcount = outtypes.length;
        const callable = 
            FFI.ForeignFunction(REF._reinterpret(REF.NULL,0,addr),
                                "void", ["void*", "void*"]);


        function fetchout(type,idx){
            switch(type){
                case "u32":
                case "u64":
                    return Number(sitestack[idx]);
                case "f32":
                    return stack_get_f32(idx);
                case "f64":
                    return stack_get_f64(idx);
                default:
                    throw "Invalid type";
            }
        }
        return function(...args){
            let objcnt = 0;
            let objq = [null, null, null, null];
            let objpos = [false, false, false, false];
            /* check arg count */
            if(args.length != incount){
                throw "argument count unmatched";
            }
            /* Scan argument for objects: that need to be filled with
             * shufflecall_ptr */
            args.forEach((e,idx) => {
                if((e instanceof Buffer) || (typeof e === "string")){
                    objq[objcnt] = e;
                    objpos[objcnt] = idx;
                    objcnt++;
                    if(objcnt >= objq.length){
                        throw "Obj argument overflow";
                    }
                }
            });
            /* Allocate in/out argument stack */
            let inargs = incount;
            if(objcnt != 0){
                inargs += 12;
            }
            let in0 = alloc(inargs);
            let out0 = alloc(outcount);
            
            /* Setup argument */
            intypes.forEach((t,idx) => {
                /* Skip object argument */
                if(objpos.findIndex(x => x == idx) != -1){
                    return;
                }
                switch(t){
                    case "u32":
                    case "u64":
                        sitestack[in0+idx] = BigInt(args[idx]);
                        break;
                    case "f32":
                        stack_set_f32(in0+idx, args[idx]);
                        break;
                    case "f64":
                        stack_set_f64(in0+idx, args[idx]);
                        break;
                    default:
                        throw "Unknown type code";
                }
            });
            /* Perform call */
            if(objcnt != 0){
                /* Fill objargs if needed */
                const in1 = in0 + incount;
                sitestack[in1+0] = 0; /* C call */
                sitestack[in1+1] = BigInt(addr);
                sitestack[in1+2] = BigInt(in0 * 8);
                sitestack[in1+3] = BigInt(out0 * 8);
                objpos.forEach((e,idx) => {
                    const p = in1 + 4 + idx*2;
                    if(e){
                        sitestack[p] = 0;
                        sitestack[p+1] = BigInt(in0 + e);
                    }else{
                        sitestack[p] = BigInt(-1);
                        sitestack[p+1] = 0;
                    }
                });
                /* Call with shufflecall */
                console.log("DOSHUFFLE_call", stackptr, outcount, args, debugname);
                shufflecall(stackaddr + in0 * 8, stackaddr + out0 * 8,
                            incount, objq[0], objq[1], objq[2], objq[3]);
                console.log("DOSHUFFLE_call end");

            }else{
                console.log("DO_call", stackptr, outcount, args, debugname);
                /* Call directly */
                callable(REF._reinterpret(sitestack, 0, in0 * 8),
                         REF._reinterpret(sitestack, 0, out0 * 8));
                console.log("DO_call end");
            }
            /* Fetch outvals */
            let r = true;
            if(outcount == 1){
                r = fetchout(outtypes[0], out0);
            }else if(outcount > 1){
                r = outtypes.map((t,idx) => fetchout(t, out0 + idx));
            }
            /* Free stack area */
            free(outcount);
            free(inargs);
            return r;
        };
    }

    return {
        make_nccc_call: gen_nccc_call,
        make_nccc_cb: gen_nccc_cb
    };
}

function nccc(){
    const VOID = REF.types.void;
    const VOIDP = REF.refType(VOID);
    const in0 = new BigInt64Array(8);
    const out0 = new BigInt64Array(8);
    const dllfile = FFI.DynamicLibrary(DLLPATH, FFI.DynamicLibrary.FLAGS.RTLD_NOW);
    const root = {};
    root.the_module_root = FFI.ForeignFunction(dllfile.get("the_module_root"),
                                               VOID, [VOIDP, VOIDP]);
    root.short_circuit = FFI.ForeignFunction(dllfile.get("short_circuit"),
                                             VOID, [VOIDP, VOIDP]);
    const shufflecall_ptr = dllfile.get("shufflecall_ptr");

    /*
    const root = FFI.Library(DLLPATH,
                             {
                                 the_module_root: [VOID, [VOIDP, VOIDP]]
                                 short_circuit: [VOID, [VOIDP, VOIDP]]
                             });
                             */
    function callroot_buf(buf){
        root.the_module_root(in0, buf);
    }
    function callroot(){
        root.the_module_root(in0, out0);
    }

    function get_callback(idx){
        in0[0] = 0n;
        in0[1] = 0n;
        in0[2] = BigInt(idx);
        callroot();
        return Number(out0[0]);
    }

    function set_callback(val){
        in0[0] = 0n;
        in0[1] = 1n;
        in0[2] = BigInt(val);
        callroot();
    }

    // String access
    function fetchstring(addr){
        return REF.readCString(REF.NULL, addr);
    }

    // WASM Generic
    function library_info(){
        in0[0] = 1n;
        in0[1] = 1n;
        in0[2] = 0n;
        callroot();
        const exports = Number(out0[0]);
        const imports = Number(out0[1]);
        const callinfos = Number(out0[2]);
        const r = [exports, imports, callinfos];
        console.log("Library", r);
        return r;
    }
    function set_bootstrap(idx, ptr){
        in0[0] = 1n;
        in0[1] = 2n;
        in0[2] = BigInt(idx);
        in0[3] = BigInt(ptr);
        callroot();
    }
    function init_module(){
        in0[0] = 1n;
        in0[1] = 3n;
        callroot();
    }

    function library_get_export(idx){
        in0[0] = 1n;
        in0[1] = 5n;
        in0[2] = BigInt(idx);
        callroot();
        const res = Number(out0[0]);
        if(res != 0){
            return false;
        }
        const name = fetchstring(Number(out0[1]));
        const addr = Number(out0[2]);
        const callinfoidx = Number(out0[3]);
        const types = callinfo_get_types(callinfoidx);
        const is_variable = Number(out0[4]) ? true : false;
        const r = [name, addr, types, is_variable];
        console.log("Export", r);
        return r;
    }

    function library_get_import(idx){
        in0[0] = 1n;
        in0[1] = 6n;
        in0[2] = BigInt(idx);
        callroot();
        const res = Number(out0[0]);
        if(res != 0){
            return false;
        }
        const name0 = fetchstring(Number(out0[1]));
        const name1 = fetchstring(Number(out0[2]));
        const callinfoidx = Number(out0[3]);
        const types = callinfo_get_types(callinfoidx);
        const r = [name0, name1, types];
        console.log("Import", r);
        return r;
    }
    
    function library_set_import(idx, value){
        in0[0] = 1n;
        in0[1] = 7n;
        in0[2] = BigInt(idx);
        in0[3] = BigInt(value);
        callroot();
        if(Number(out0[0]) != 0){
            throw "set_import error";
        }
    }

    function callinfo_get_counts(idx){
        in0[0] = 1n;
        in0[1] = 8n;
        in0[2] = BigInt(idx);
        callroot();
        const res = Number(out0[0]);
        if(res != 0){
            return false;
        }
        const argcount = Number(out0[1]);
        const retcount = Number(out0[2]);
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
        console.log("Func",idx,argv,"=>",resv);
        return [argv, resv];
    }

    const shortcircuit_ptr = get_callback(1);
    //const shufflecall_ptr = get_callback(2);
    const callsite = make_callsite(root.short_circuit, shufflecall_ptr);
    console.log("DLL Init", shufflecall_ptr);

    let i = 0;
    const libinfo = library_info();
    const exportcount = libinfo[0];
    const importcount = libinfo[1];
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
            proc = callsite.make_nccc_call(name, addr,types[0],types[1]);
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
        if(! imports[name0]){
            imports[name0] = {};
        }
        imports[name0][name1] = {
            attach: function(proc){
                const buf = callsite.make_nccc_cb(name1, proc, types[0], types[1]);
                if(! import_cbs[name0]){
                    import_cbs[name0] = {};
                }
                import_cbs[name0][name1] = buf;
                library_set_import(idx, REF.address(buf));
            }
        };
    }
    
    const bootimports = [
        [1, "wasm_boot_allocate_memory", ["u64", "u64", "u64"], ["u64", "u64"]],
        [2, "wasm_boot_allocate_table", ["u64", "u64", "u64"], []],
        [3, "wasm_boot_grow_memory", ["u64", "u64"], ["u64", "u64"]]
    ];
    return {
        bootstrap: function(imports){
            bootimports.forEach(e => {
                const idx = e[0];
                const name = e[1];
                const intypes = e[2];
                const outtypes = e[3];
                const ptr = callsite.make_nccc_cb(name, imports[name], 
                                                  intypes, outtypes);
                // To keep reference:
                import_cbs["internal:" + name] = ptr;
                set_bootstrap(idx, ptr.address());
            });
            set_callback(shortcircuit_ptr);
            init_module();
        },
        exports: exports,
        imports: imports
    };
}

module.exports = nccc;
