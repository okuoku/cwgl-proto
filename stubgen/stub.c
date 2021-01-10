#include <stdint.h>

#include <dll.h>
#include "stubdata.h"

void nccc_callback(const uint64_t* in, uint64_t* out);
typedef void (*nccc_call_t)(const uint64_t* in, uint64_t* out);

#define EXP_COMMA_arg ,
#define EXP_COMMA_term

#define EXP_DECL_ARGS(sym) \
    ( SYM_ ## sym ## _ARG_EXPAND(EXP__ARGS) )

#define EXP__ARGS(idx, pos, typ) \
    typ arg ## idx EXP_COMMA_ ## pos

/* EXPORT FUNCs */

#define EXP_DECL_EXPORT_FUNC(in,out,sym) \
    EXP_DECL_EXPORT_FUNC_ ## in ## _ ## out (sym)

#define EXP_DECL_INARGS_ITR(idx,_,typ) \
    const typ arg ## idx = *(typ *)&in[idx];

#define EXP_DECL_INARGS(sym) \
    SYM_ ## sym ## _ARG_EXPAND(EXP_DECL_INARGS_ITR)

#define EXP_CALLARGS_ITR(idx,pos,_) \
    arg ## idx EXP_COMMA_ ## pos

#define EXP_CALLARGS(sym) \
    ( SYM_ ## sym ## _ARG_EXPAND(EXP_CALLARGS_ITR) )

#define EXP_DECL_EXPORT_FUNC_arg_val(sym) \
    static void nccc_ ## sym (const uint64_t* in, uint64_t* out) { \
        SYM_ ## sym ## _DATATYPE ret; \
        EXP_DECL_INARGS(sym) \
        ret = WASM_RT_ADD_PREFIX(sym) \
        EXP_CALLARGS(sym); \
        *((SYM_ ## sym ## _DATATYPE *)out) = ret; \
    } \
    SYM_ ## sym ## _DATATYPE \
    (*WASM_RT_ADD_PREFIX(sym)) EXP_DECL_ARGS(sym); \


#define EXP_DECL_EXPORT_FUNC_void_val(sym) \
    static void nccc_ ## sym (const uint64_t* in, uint64_t* out) { \
        SYM_ ## sym ## _DATATYPE ret; \
        ret = WASM_RT_ADD_PREFIX(sym)(); \
        *((SYM_ ## sym ## _DATATYPE *)out) = ret; \
    } \
    SYM_ ## sym ## _DATATYPE \
    (*WASM_RT_ADD_PREFIX(sym)) EXP_DECL_ARGS(sym);

#define EXP_DECL_EXPORT_FUNC_arg_void(sym) \
    static void nccc_ ## sym (const uint64_t* in, uint64_t* out) { \
        EXP_DECL_INARGS(sym) \
        WASM_RT_ADD_PREFIX(sym) \
        EXP_CALLARGS(sym); \
    } \
    SYM_ ## sym ## _DATATYPE \
    (*WASM_RT_ADD_PREFIX(sym)) EXP_DECL_ARGS(sym);

#define EXP_DECL_EXPORT_FUNC_void_void(sym) \
    static void nccc_ ## sym (const uint64_t* in, uint64_t* out) { \
        WASM_RT_ADD_PREFIX(sym)(); \
    } \
    SYM_ ## sym ## _DATATYPE \
    (*WASM_RT_ADD_PREFIX(sym)) EXP_DECL_ARGS(sym);

/* EXPORT VARIABLEs */
#define EXP_DECL_EXPORT_VAR(sym) \
    SYM_ ## sym ## _DATATYPE * WASM_RT_ADD_PREFIX(sym);

/* IMPORT FUNCs */

#define EXP_DECL_IMPORT_FUNC(in, out, sym) \
    EXP_DECL_IMPORT_FUNC_ ## in ## _ ## out (sym)

#define EXP_DECL_INBUF_BODY_arg(_)
#define EXP_DECL_INBUF_BODY_term(idx) uint64_t in[idx+2]
#define EXP_DECL_INBUF_ITR(idx, pos, type) \
    EXP_DECL_INBUF_BODY_ ## pos (idx)
#define EXP_DECL_INBUF(sym) \
    SYM_ ## sym ## _ARG_EXPAND(EXP_DECL_INBUF_ITR)

#define EXP_ASSIGN_INBUF_ITR(idx,_,__) \
    in[idx+1] = *(uint64_t*)&arg ## idx;

#define EXP_ASSIGN_INBUF(sym) \
    SYM_ ## sym ## _ARG_EXPAND(EXP_ASSIGN_INBUF_ITR)

#define EXP_DECL_IMPORT_FUNC_arg_val(sym) \
    static uintptr_t nccc_ ## sym; \
    static SYM_ ## sym ## _DATATYPE \
    instub_ ## sym EXP_DECL_ARGS(sym) { \
        uint64_t out; \
        EXP_DECL_INBUF(sym); \
        EXP_ASSIGN_INBUF(sym); \
        in[0] = nccc_ ## sym; \
        nccc_callback(in, &out); \
        return *(SYM_ ## sym ## _DATATYPE *)&out; \
    } \
    SYM_ ## sym ## _DATATYPE (*sym) EXP_DECL_ARGS(sym) = \
    instub_ ## sym;

#define EXP_DECL_IMPORT_FUNC_void_val(sym) \
    static uintptr_t nccc_ ## sym; \
    static SYM_ ## sym ## _DATATYPE \
    instub_ ## sym (void) { \
        uint64_t in[1]; \
        uint64_t out; \
        in[0] = nccc_ ## sym; \
        nccc_callback(in, &out); \
        return *(SYM_ ## sym ## _DATATYPE *)&out; \
    } \
    SYM_ ## sym ## _DATATYPE (*sym) EXP_DECL_ARGS(sym) = \
    instub_ ## sym;

#define EXP_DECL_IMPORT_FUNC_arg_void(sym) \
    static uintptr_t nccc_ ## sym; \
    static void \
    instub_ ## sym EXP_DECL_ARGS(sym) { \
        EXP_DECL_INBUF(sym); \
        EXP_ASSIGN_INBUF(sym); \
        in[0] = nccc_ ## sym; \
        nccc_callback(in, NULL); \
    } \
    void (*sym) EXP_DECL_ARGS(sym) = \
    instub_ ## sym;

#define EXP_DECL_IMPORT_FUNC_void_void(sym) \
    static uintptr_t nccc_ ## sym; \
    static void \
    instub_ ## sym (void) { \
        uint64_t in[1]; \
        in[0] = nccc_ ## sym; \
        nccc_callback(in, NULL); \
    } \
    void (*sym) (void) = \
    instub_ ## sym;

IMPORTFUNC_EXPAND(EXP_DECL_IMPORT_FUNC)
EXPORTFUNC_EXPAND(EXP_DECL_EXPORT_FUNC)
EXPORTVAR_EXPAND(EXP_DECL_EXPORT_VAR) 

uint32_t wasm_rt_call_stack_depth;

void
stub_wasm_library_info(const uint64_t* in, uint64_t* out){
    const uint64_t library_index = in[0];
    const uint64_t export_count = TOTAL_EXPORTS;
    const uint64_t import_count = TOTAL_IMPORTS;

    if(library_index != 0){
        __builtin_trap();
    }

    out[0] = export_count;
    out[1] = import_count;
}

#define LIBEX(sym) \
    case SYM_ ## sym ## _EXPORTIDX: \
      res = 0; \
      name = SYM_ ## sym ## _EXPORTNAME; \
      is_variable = SYM_ ## sym ## _IS_VARIABLE; \
      break; 

#define LIBEX_FUNC(_,__,sym) \
    value = (uintptr_t)nccc_ ## sym;

#define LIBEX_VAR(sym) \
    value = (uintptr_t)WASM_RT_ADD_PREFIX(sym);

void
stub_library_get_export(const uint64_t* in, uint64_t* out){
    const uint64_t idx = in[0];
    const char* name = NULL;
    int is_variable = 0;
    uint64_t res;
    uint64_t value;
    // TODO: type
    switch(idx){
        EXPORT_EXPAND(LIBEX)
        default:
            res = -1;
            value = -1;
            break;
    }
    if(is_variable){
        switch(idx){
            EXPORTFUNC_EXPAND(LIBEX_FUNC)
            default:
                __builtin_trap();
                break;
        }
    }else{
        switch(idx){
            EXPORTVAR_EXPAND(LIBEX_VAR)
            default:
                __builtin_trap();
                break;
        }
    }
    out[0] = res;
    out[1] = (uintptr_t)name;
    out[2] = 0; // TYPE
    out[3] = value;
}

#define LIBIM(sym) \
    case SYM_ ## sym ## _IMPORTIDX: \
      res = 0; \
      name0 = SYM_ ## sym ## _IMPORTNAME1; \
      name1 = SYM_ ## sym ## _IMPORTNAME2; \
      break;

void
stub_library_get_import(const uint64_t* in, uint64_t* out){
    const uint64_t idx = in[0];
    const char* name0 = NULL;
    const char* name1 = NULL;
    uint64_t res;
    // TODO: type
    switch(idx){
        IMPORT_EXPAND(LIBIM)
        default:
            res = -1;
            break;
    }
    out[0] = res;
    out[1] = (uintptr_t)name0;
    out[2] = (uintptr_t)name1;
    out[3] = 0; // TYPE
}

#define LIBIMSET(sym) \
    case SYM_ ## sym ## _IMPORTIDX: \
      res = 0; \
      nccc_ ## sym = (uintptr_t)value; \
      break;

void
stub_library_set_import(const uint64_t* in, uint64_t* out){
    const uint64_t idx = in[0];
    const uint64_t value = in[1];
    uint64_t res;
    switch(idx){
        IMPORT_EXPAND(LIBIMSET)
        default:
            res = -1;
            break;
    }
    out[0] = res;
}

