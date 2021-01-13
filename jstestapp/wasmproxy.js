const REF = require("ref-napi");
const nccc = require("./nccc-node.js")();

function fakeinstance(imports){
    let current_pages = 0;
    let max_pages = 0;
    let me = {};
    let memory = {};
    let table = {
        grow: function(delta){
            console.log("WASM Table Grow (fake)", delta);
            return length;
        },
        get: function(index){
            console.log("WASM Table Get (fake)", index);
            return null;
        },
        set: function(index, value){
            console.log("WASM Table Set (fake)", index, value);
        },
        get length(){
            console.log("WASM Table length getter (fake)", length);
            return len;
        }
    };
    const wasmrt = {
        wasm_boot_allocate_memory: function(instance_id, initial, max){
            max_pages = max;
            //memory.buffer = new Buffer(max * 64 * 1024);
            me.heapobject = new Uint8Array(initial * 64 * 1024);
            memory.buffer = me.heapobject.buffer;
            console.log("Alloc memory", memory.buffer);
            return [REF.address(me.heapobject), initial];
        },
        wasm_boot_allocate_table: function(instance_id, initial, max){
            console.log("Allocate table", initial, max);
        },
        wasm_boot_grow_memory: function(instance_id, pages){
            console.log("Grow memory");
            return [0, max_pages];
        }
    };
    nccc.bootstrap(wasmrt);
    memory.grow = function(){
        throw "Cannot grow memory!";
    };

    /* linkup imports */
    Object.keys(imports).forEach(name0 => {
        Object.keys(imports[name0]).forEach(name1 => {
            if(nccc.imports[name0] && nccc.imports[name0][name1]){
                console.log("Import",name0,name1,imports[name0][name1]);
                nccc.imports[name0][name1].attach(imports[name0][name1]);
            }else{
                console.log("Skip import",name0,name1);
            }
        });
    });

    /* Construct export tables */
    me.instance = {};
    let exports = {};
    Object.keys(nccc.exports).forEach(name => {
        if(nccc.exports[name]){
            const e = nccc.exports[name];
            if(e.is_variable){
                /* Replace memory and table object in export */
                console.log("Variable",e.types[1][0]);
                switch(e.types[1][0]){
                    case "memory":
                        exports[name] = memory;
                        break;
                    case "table":
                        exports[name] = table;
                        break;
                    default:
                        throw "Invalid value export!";
                }
            }else{
                exports[name] = e.proc;
            }
        }else{
            throw "Invalid export!";
        }
    });
    me.instance.exports = exports;

    /* module ??? */
    me.module = {};
    // Return WebAssemblyInstantiatedSource
    return me;
}


wasm = {
    /*
    validate: function(){
        console.log("WASM validate (fake)");
        return true;
    },
    compile: async function(bytes){
        console.log("WASM compile (fake)");
        return fakemodule();
    },
    */
    RuntimeError: function(what){
        throw what;
    },
    instantiate: async function(obj, imports){
        //console.log("WASM instantiate (fake)", obj, imports);
        return fakeinstance(imports);
    },
};

module.exports = wasm;
