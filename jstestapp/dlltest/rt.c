#include "wasm-rt.h"
#include "dll.h"
#include <stdio.h>
#include <stdlib.h>

typedef void (*nccc_call_t)(const uint64_t* in, uint64_t* out);

/* Globals */
static nccc_call_t the_callback;
static uintptr_t cb_wasm_boot_allocate_memory = 0;
static uintptr_t cb_wasm_boot_allocate_table = 0;
static uintptr_t cb_wasm_boot_grow_memory = 0;

static void
short_circuit(const uint64_t* in, uint64_t* out){
    nccc_call_t cb = (nccc_call_t)(uintptr_t)in[0];
    cb(&in[1], out);
}

void
nccc_callback(const uint64_t* in, uint64_t* out){
    // [CB . args] => [...]
    the_callback(in, out);
}

static void
wasm_set_bootstrap(const uint64_t* in, uint64_t* out){
    // [bootstrap_function_id ctx] => []
    const uint64_t id = in[0];
    const uint64_t ctx = in[1];

    switch(id){
        case 1:
            cb_wasm_boot_allocate_memory = ctx;
            break;
        case 2:
            cb_wasm_boot_allocate_table = ctx;
            break;
        case 3:
            cb_wasm_boot_grow_memory = ctx;
            break;
        default:
            __builtin_trap();
            break;
    }
}

static void
wasm_init_module(const uint64_t* in, uint64_t* out){
    // [] => []
    WASM_RT_ADD_PREFIX(init)();
}

static void
wasm_read_table(const uint64_t* in, uint64_t* out){
    // [instance_id index] => [res functype funcobj]
    wasm_rt_table_t* table = (wasm_rt_table_t*)(uintptr_t)in[0];
    uint64_t index = in[1];
    wasm_rt_type_t type;
    if(index >= table->size){
        out[0] = -1;
    }else{
        out[0] = 0;
        out[1] = (uintptr_t)table->data[index].func;
        type = table->data[index].func_type;
        switch(type){
            case WASM_RT_I32:
                out[2] = 0;
                break;
            case WASM_RT_I64:
                out[2] = 1;
                break;
            case WASM_RT_F32:
                out[2] = 2;
                break;
            case WASM_RT_F64:
                out[2] = 3;
                break;
        }
    }
}

void stub_wasm_library_info(const uint64_t*, uint64_t*);
void stub_library_get_export(const uint64_t*, uint64_t*);
void stub_library_get_import(const uint64_t*, uint64_t*);
void stub_library_set_import(const uint64_t*, uint64_t*);
void stub_callinfo_get_counts(const uint64_t*, uint64_t*);
void stub_callinfo_get_types(const uint64_t*, uint64_t*);

static void
wasm_library_info(const uint64_t* in, uint64_t* out){
    // [library_index] => [export_count import_count]
    stub_wasm_library_info(in, out);
}

static void
wasm_library_get_export(const uint64_t* in, uint64_t* out){
    // [idx] => [res name type addr]
    stub_library_get_export(in, out);
}

static void
wasm_library_get_import(const uint64_t* in, uint64_t* out){ // Get import metadata
    // [idx] => [res name0 name1 type]
    stub_library_get_import(in, out);
}

static void
wasm_library_set_import(const uint64_t* in, uint64_t* out){
    // [idx v] => [res]
    stub_library_set_import(in, out);
}

static void
wasm_callinfo_get_counts(const uint64_t* in, uint64_t* out){
    stub_callinfo_get_counts(in, out);
}

static void
wasm_callinfo_get_types(const uint64_t* in, uint64_t* out){
    stub_callinfo_get_types(in, out);
}

// WASM2C runtime
void
wasm_rt_allocate_table(wasm_rt_table_t* table,
                       uint32_t elements,
                       uint32_t max_elements){
    wasm_rt_elem_t* elms;
    uint64_t args[4];
    args[0] = cb_wasm_boot_allocate_table;
    args[1] = (uintptr_t)table;
    args[2] = elements;
    args[3] = max_elements;
    nccc_callback(args, NULL);
    // Setup mirror table
    elms = malloc(sizeof(wasm_rt_elem_t)*elements);
    table->data = elms;
    table->max_size = elements;
    table->size = elements;
}

void
wasm_rt_allocate_memory(wasm_rt_memory_t* memory,
                        uint32_t initial_pages,
                        uint32_t max_pages){
    uint64_t args[4];
    uint64_t res[2];
    args[0] = cb_wasm_boot_allocate_memory;
    args[1] = (uintptr_t)memory;
    args[2] = initial_pages;
    args[3] = max_pages;
    res[0] = 0;
    res[1] = 0;
    nccc_callback(args, res);
    memory->data = (void*)(uintptr_t)res[0];
    memory->max_pages = max_pages;
    memory->pages = res[1];
    memory->size = res[1] * (64*1024);

}

uint32_t
wasm_rt_grow_memory(wasm_rt_memory_t* memory,
                    uint32_t pages){
    uint64_t args[3];
    uint64_t res[2];
    const uint32_t prev_pages = memory->pages;
    args[0] = cb_wasm_boot_grow_memory;
    args[1] = (uintptr_t)memory;
    args[2] = pages;
    res[0] = 0;
    res[1] = 0;
    nccc_callback(args, res);
    if(res[0]){
        return UINT32_MAX;
    }else{
        memory->pages = res[1];
        memory->size = res[1] * (64*1024);
    }
    return prev_pages;
}

uint32_t
wasm_rt_register_func_type(uint32_t params,
                           uint32_t results,
                           ...){
    // FIXME: Implement this
    return 1;
}

void
wasm_rt_trap(wasm_rt_trap_t x){
    printf("DLLTEST: Trap halt!");
    __builtin_trap();
}

// Export
__declspec(dllexport)
void
the_module_root(const uint64_t* in, uint64_t* out){
    const uint64_t mod = in[0];
    const uint64_t code = in[1];

    switch(mod){
        case 0: // admin
            switch(code){
                case 0:
                    switch(in[2]){
                        case 1:
                            out[0] = (uintptr_t)short_circuit;
                            break;
                        default:
                            __builtin_trap();
                            break;
                    }
                    break;
                case 1:
                    the_callback = (nccc_call_t)in[2];
                    break;
                default:
                    __builtin_trap();
                    break;
            }
            break;
        case 1: // wasm
            switch(code){
                case 1:
                    wasm_library_info(&in[2], out);
                    break;
                case 2:
                    wasm_set_bootstrap(&in[2], out);
                    break;
                case 3:
                    wasm_init_module(&in[2], out);
                    break;
                case 4:
                    wasm_read_table(&in[2], out);
                    break;
                case 5:
                    wasm_library_get_export(&in[2], out);
                    break;
                case 6:
                    wasm_library_get_import(&in[2], out);
                    break;
                case 7:
                    wasm_library_set_import(&in[2], out);
                    break;
                case 8:
                    wasm_callinfo_get_counts(&in[2], out);
                    break;
                case 9:
                    wasm_callinfo_get_types(&in[2], out);
                    break;
                default:
                    __builtin_trap();
                    break;
            }
            break;
        default:
            __builtin_trap();
            break;
    }
}

