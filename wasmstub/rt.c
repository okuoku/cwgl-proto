#include "wasm-rt.h"
#include "dll.h"
#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>

typedef void (*nccc_call_t)(const uint64_t* in, uint64_t* out);

/* Globals */
static nccc_call_t dispatch_wasm_boot_allocate_memory = 0;
static nccc_call_t dispatch_wasm_boot_allocate_table = 0;
static nccc_call_t dispatch_wasm_boot_grow_memory = 0;
static nccc_call_t dispatch_wasm_boot_register_func_type = 0;
static uintptr_t cb_wasm_boot_allocate_memory = 0;
static uintptr_t cb_wasm_boot_allocate_table = 0;
static uintptr_t cb_wasm_boot_grow_memory = 0;
static uintptr_t cb_wasm_boot_register_func_type = 0;

static void
wasm_set_bootstrap(const uint64_t* in, uint64_t* out){
    // [bootstrap_function_id dispatch ctx] => []
    const uint64_t id = in[0];
    const uint64_t dispatch = in[1];
    const uint64_t ctx = in[2];

    switch(id){
        case 1:
            dispatch_wasm_boot_allocate_memory = (nccc_call_t)dispatch;
            cb_wasm_boot_allocate_memory = ctx;
            break;
        case 2:
            dispatch_wasm_boot_allocate_table = (nccc_call_t)dispatch;
            cb_wasm_boot_allocate_table = ctx;
            break;
        case 3:
            dispatch_wasm_boot_grow_memory = (nccc_call_t)dispatch;
            cb_wasm_boot_grow_memory = ctx;
            break;
        case 4:
            dispatch_wasm_boot_register_func_type = (nccc_call_t)dispatch;
            cb_wasm_boot_register_func_type = ctx;
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
    if(index >= table->size){
        out[0] = -1;
    }else{
        out[0] = 0;
        out[1] = table->data[index].func_type;
        out[2] = (uintptr_t)table->data[index].func;
    }
}

void stub_wasm_library_info(const uint64_t*, uint64_t*);
void stub_library_get_export(const uint64_t*, uint64_t*);
void stub_library_get_import(const uint64_t*, uint64_t*);
void stub_library_set_import(const uint64_t*, uint64_t*);
void stub_callinfo_get_counts(const uint64_t*, uint64_t*);
void stub_callinfo_get_types(const uint64_t*, uint64_t*);
void stub_typebridge_get_counts(const uint64_t*, uint64_t*);
void stub_typebridge_get_types(const uint64_t*, uint64_t*);

static void
wasm_library_info(const uint64_t* in, uint64_t* out){
    // [library_index] => [export_count import_count callinfo_count type_count]
    stub_wasm_library_info(in, out);
}

static void
wasm_library_get_export(const uint64_t* in, uint64_t* out){
    // [idx] => [res name type addr callinfoidx is_variable]
    stub_library_get_export(in, out);
}

static void
wasm_library_get_import(const uint64_t* in, uint64_t* out){ // Get import metadata
    // [idx] => [res name0 name1 callinfoidx is_variable]
    stub_library_get_import(in, out);
}

static void
wasm_library_set_import(const uint64_t* in, uint64_t* out){
    // [idx dispatch v] => [res]
    stub_library_set_import(in, out);
}

static void
wasm_callinfo_get_counts(const uint64_t* in, uint64_t* out){
    // [idx] => [res argcount retcount]
    stub_callinfo_get_counts(in, out);
}

static void
wasm_callinfo_get_types(const uint64_t* in, uint64_t* out){
    // [idx] => [res argcount retcount args ... rets ...]
    stub_callinfo_get_types(in, out);
}

static void
wasm_typebridge_get_counts(const uint64_t* in, uint64_t* out){
    // [idx] => [res argcount retcount]
    stub_typebridge_get_counts(in, out);
}

static void
wasm_typebridge_get_types(const uint64_t* in, uint64_t* out){
    // [idx] => [res stubctx argcount retcount args ... rets ...]
    stub_typebridge_get_types(in, out);
}

static void
wasm_init_memory(const uint64_t* in, uint64_t* out){
    // [current_pages max_pages native_addr] => [instance_id]
    wasm_rt_memory_t* mem;
    mem = malloc(sizeof(wasm_rt_memory_t));
    mem->data = (void*)(uintptr_t)in[2];
    mem->pages = in[0];
    mem->max_pages = in[1];
    mem->size = in[0] * (64*1024);
    out[0] = (uintptr_t)mem;
}

static void
wasm_init_table(const uint64_t* in, uint64_t* out){
    // [elements max_elements] => [instance_id]
    uint32_t max_elements = in[1];
    wasm_rt_table_t* tbl;
    tbl = malloc(sizeof(wasm_rt_table_t));
    tbl->data = malloc(sizeof(wasm_rt_elem_t) * max_elements);
    tbl->max_size = max_elements;
    tbl->size = max_elements;
    out[0] = (uintptr_t)tbl;
}

// WASM2C runtime
void
wasm_rt_allocate_table(wasm_rt_table_t* table,
                       uint32_t elements,
                       uint32_t max_elements){
    wasm_rt_elem_t* elms;
    uint64_t dargs[2];
    uint64_t args[4];
    args[0] = (uintptr_t)table;
    args[1] = elements;
    args[2] = max_elements;
    dargs[0] = cb_wasm_boot_allocate_table;
    dargs[1] = (uint64_t)(uintptr_t)args;
    dispatch_wasm_boot_allocate_table(dargs, NULL);
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
    uint64_t dargs[2];
    uint64_t args[4];
    uint64_t res[2];
    args[0] = (uintptr_t)memory;
    args[1] = initial_pages;
    args[2] = max_pages;
    res[0] = 0;
    res[1] = 0;
    dargs[0] = cb_wasm_boot_allocate_memory;
    dargs[1] = (uint64_t)(uintptr_t)args;
    dispatch_wasm_boot_allocate_memory(dargs, res);
    memory->data = (void*)(uintptr_t)res[0];
    memory->max_pages = max_pages;
    memory->pages = res[1];
    memory->size = res[1] * (64*1024);

}

uint32_t
wasm_rt_grow_memory(wasm_rt_memory_t* memory,
                    uint32_t pages){
    uint64_t dargs[2];
    uint64_t args[3];
    uint64_t res[2];
    const uint32_t prev_pages = memory->pages;
    args[0] = (uintptr_t)memory;
    args[1] = pages;
    res[0] = 0;
    res[1] = 0;
    dargs[0] = cb_wasm_boot_grow_memory;
    dargs[1] = (uint64_t)(uintptr_t)args;
    dispatch_wasm_boot_grow_memory(dargs, res);
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
    int i;
    size_t total;
    uint64_t dargs[2];
    uint64_t args[32+2];
    uint64_t res;
    wasm_rt_type_t type;
    uint64_t x;
    va_list ap;
    total = params + results;
    // FIXME: Currently we have static MAX of 32 arguments
    if(total > 32){
        printf("Too complex function type\n");
        __builtin_trap();
    }
    dargs[0] = cb_wasm_boot_register_func_type;
    dargs[1] = (uint64_t)(uintptr_t)args;
    args[0] = params;
    args[1] = results;
    va_start(ap, results);
    for(i=0;i!=total;i++){
        type = va_arg(ap, wasm_rt_type_t);
        switch(type){
            case WASM_RT_I32:
                x = 0;
                break;
            case WASM_RT_I64:
                x = 1;
                break;
            case WASM_RT_F32:
                x = 2;
                break;
            case WASM_RT_F64:
                x = 3;
                break;
            default:
                __builtin_trap();
                break;
        }
        args[2+i] = x;
    }
    dispatch_wasm_boot_register_func_type(dargs, &res);
    return (uint32_t)res;
}

void
wasm_rt_trap(wasm_rt_trap_t x){
    printf("DLLTEST: Trap halt!\n");
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
                        default:
                            __builtin_trap();
                            break;
                    }
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
                case 10:
                    wasm_typebridge_get_counts(&in[2], out);
                    break;
                case 11:
                    wasm_typebridge_get_types(&in[2], out);
                    break;
                case 12:
                    wasm_init_memory(&in[2], out);
                    break;
                case 13:
                    wasm_init_table(&in[2], out);
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

