import ncccutil from "./ncccutil.js";
import nccc_node from "./nccc-node.js";


const wasm = function(DLLFILE){ 

    const nccc = nccc_node(DLLFILE);

    function wasmtable(opts){
        const initial = opts.initial;
        const maximum = opts.maximum ? opts.maximum : opts.initial;
        return {
            __wasmproxy_tablesize: maximum,
            get: function(index){
                return nccc.get_table(index);
            }
        };
    }

    function wasmmemory(opts){
        const initial_pages = opts.initial;
        const max_pages = opts.maximum ? opts.maximum : 32768;
        let current_pages = initial_pages;
        //const heap = new Uint8Array(initial_pages * 64 * 1024);
        const heap = new Uint8Array(max_pages * 64 * 1024);
        const the_buffer = heap.buffer;
        Object.defineProperty(the_buffer, "byteLength", {
            get: function(){
                return current_pages * 65536;
            }
        });

        console.log("Creating wasmmemory",opts);

        /* Unity has instanceof check */
        this.grow = function(delta){
            console.log("Memory grow request", delta);
            const cursize = current_pages;
            current_pages += delta;
            return cursize;
        }
        this.__wasmproxy_current_page = function(){
            return current_pages;
        }
        this.buffer = the_buffer;
        this.__wasmproxy_heap = heap;
    }

    function fakeinstance(imports){
        let current_pages = 0;
        let max_pages = 0;
        let me = {};
        let memory = {};
        let table = {
            /*
        grow: function(delta){
            console.log("WASM Table Grow (fake)", delta);
            return length;
        },
        */
            get: function(index){
                return nccc.get_table(index);
            },
            /*
        set: function(index, value){
            console.log("WASM Table Set (fake)", index, value);
        },
        get length(){
            console.log("WASM Table length getter (fake)", length);
            return len;
        }
        */
        };
        const wasmrt = {
            wasm_boot_allocate_memory: function(instance_id, initial, max){
                max_pages = max;
                me.heapobject = new Uint8Array(max * 64 * 1024);
                memory.buffer = me.heapobject.buffer;
                console.log("Alloc memory", memory.buffer);
                return [ncccutil.ptraddr(me.heapobject), max];
            },
            wasm_boot_grow_memory: function(instance_id, pages){
                console.log("Grow memory");
                return [0, max_pages];
            }
        };
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
                    //console.log("Skip import",name0,name1);
                }
            });
        });

        nccc.bootstrap(wasmrt);

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
    return {
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
        Memory: wasmmemory,
        Table: wasmtable
    }
};

export default wasm;
