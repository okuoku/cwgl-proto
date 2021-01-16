#include "wasm-rt.h"
#include "dll.h"
#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>

typedef void (*nccc_call_t)(const uint64_t* in, uint64_t* out);

/* Globals */
static nccc_call_t the_callback;
static uintptr_t cb_wasm_boot_allocate_memory = 0;
static uintptr_t cb_wasm_boot_allocate_table = 0;
static uintptr_t cb_wasm_boot_grow_memory = 0;
static uintptr_t cb_wasm_boot_register_func_type = 0;

__declspec(dllexport)
void
short_circuit(const uint64_t* in, uint64_t* out){
    nccc_call_t cb = (nccc_call_t)(uintptr_t)in[0];
    cb(&in[1], out);
}

__declspec(dllexport)
void
shufflecall_ptr(uint64_t* cmd0, uint64_t* ret, uint64_t cmdoffset,
                const void* p0, const void* p1, const void* p2, const void* p3){
    uint64_t* cmd = &cmd0[cmdoffset];
    const uint64_t contexttype = cmd[0];
    const uint64_t next = cmd[1];
    const int64_t cmd_offset = cmd[2];
    const int64_t ret_offset = cmd[3];
    nccc_call_t native_callback;
    uint64_t p0_enterpos;
    int64_t p0_offset;
    uint64_t p1_enterpos;
    int64_t p1_offset;
    uint64_t p2_enterpos;
    int64_t p2_offset;
    uint64_t p3_enterpos;
    int64_t p3_offset;

    p0_enterpos = cmd[4];
    if((int64_t)p0_enterpos != -1){
        p0_offset = cmd[5];
        cmd[p0_enterpos] = (uintptr_t)p0 + (intptr_t)p0_offset;
        p1_enterpos = cmd[6];
        if((int64_t)p1_enterpos != -1){
            p1_offset = cmd[7];
            cmd[p1_enterpos] = (uintptr_t)p1 + (intptr_t)p1_offset;
            p2_enterpos = cmd[8];
            if((int64_t)p2_enterpos != -1){
                p2_offset = cmd[9];
                cmd[p2_enterpos] = (uintptr_t)p2 + (intptr_t)p2_offset;
                p3_enterpos = cmd[10];
                if((int64_t)p3_enterpos != -1){
                    p3_offset = cmd[11];
                    cmd[p3_enterpos] = (uintptr_t)p3 + (intptr_t)p3_offset;
                }
            }
        }
    }

    if(next){
        if(contexttype == 1){
            cmd[cmd_offset] = next;
            the_callback(&cmd[cmd_offset], &ret[ret_offset]);
        }else{
            native_callback = (nccc_call_t)next;
            native_callback(&cmd[cmd_offset], &ret[ret_offset]);
        }
    }
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
        case 4:
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
    // [idx] => [res name type addr]
    stub_library_get_export(in, out);
}

static void
wasm_library_get_import(const uint64_t* in, uint64_t* out){ // Get import metadata
    // [idx] => [res name0 name1 callinfoidx]
    stub_library_get_import(in, out);
}

static void
wasm_library_set_import(const uint64_t* in, uint64_t* out){
    // [idx v] => [res]
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
    int i;
    size_t total;
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
    args[0] = cb_wasm_boot_register_func_type;
    args[1] = params;
    args[2] = results;
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
        args[3+i] = x;
    }
    nccc_callback(args, &res);
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
                        case 1:
                            out[0] = (uintptr_t)short_circuit;
                            break;
                        case 2:
                            out[0] = (uintptr_t)shufflecall_ptr;
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

