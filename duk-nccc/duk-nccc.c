#include <string.h>
#include <stdlib.h>
#include "duktape.h"

#ifdef WIN32
#include <malloc.h>
#else
#include <alloca.h>
#endif

#include <setjmp.h>
static jmp_buf g_jmpbuf;
static int calldepth = 0;

static void
value_in(duk_context* ctx, char type, uint64_t vin){
    switch(type){
        case 'i':
            duk_push_int(ctx, vin);
            break;
        case 'l':
            duk_push_number(ctx, vin);
            break;
        case 'p':
            duk_push_pointer(ctx, (uintptr_t)vin);
            break;
        case 'f':
            duk_push_number(ctx, *((float *)&vin));
            break;
        case 'd':
            duk_push_number(ctx, *((double *)&vin));
            break;
        default:
            /* Unknown type */
            abort();
            break;
    }
}

static int // => bool
get_pointer(duk_context* ctx, duk_idx_t v, uintptr_t* value){
    if(duk_is_pointer(ctx, v)){
        *value = duk_require_pointer(ctx, v);
        return 1;
    }else if(duk_is_buffer_data(ctx, v)){
        *value = duk_get_buffer_data(ctx, v, NULL);
        return 1;
    }else if(duk_is_string(ctx, v)){
        *value = duk_require_string(ctx, v);
        return 1;
    }else if(duk_is_object(ctx, v)){
        /* Pointer with finalizer */
        (void)duk_get_prop_index(ctx, v, 0);
        *value = duk_get_pointer(ctx, -1);
        duk_pop(ctx);
        if(*value){
            return 1;
        }else{
            return 0;
        }
    }else{
        return 0;
    }
}

static void
value_out(duk_context* ctx, uint64_t* out, char type, duk_idx_t vin){
    int altfill = 0;
    uintptr_t v;
    if(duk_is_null_or_undefined(ctx, vin)){
        altfill = 1;
        v = 0;
    }else if(duk_is_boolean(ctx, vin)){
        altfill = 1;
        v = duk_require_boolean(ctx, vin) ? 1 : 0;
    }

    /* numberlike */
    switch(type){
        case 'p':
        case 'i':
        case 'l':
            if(altfill){
                *out = v;
            }else if(get_pointer(ctx, vin, &v)){
                *out = v;
            }else{
                *out = duk_get_int(ctx, vin);
            }
            break;
        case 'f':
            if(altfill){
                *(float *)out = v;
            }else{
                *(float *)out = duk_require_number(ctx, vin);
            }
            break;
        case 'd':
            if(altfill){
                *(double *)out = v;
            }else{
                *(double *)out = duk_require_number(ctx, vin);
            }
            break;
        default:
            abort();
            break;
    }
}

typedef void (*nccc_call_t)(const uint64_t* in, uint64_t* out);

struct finalizer_params_s {
    uint64_t dispatch;
    uint64_t ctx;
    uint64_t arg;
};

typedef struct finalizer_params_s finalizer_params_t;

static duk_ret_t
do_finalize(duk_context* ctx){
    nccc_call_t fn;
    uint64_t in0[2];
    uint64_t in1[2];
    uintptr_t v;
    finalizer_params_t* params;
    (void)duk_get_prop_index(ctx, 0, 1);
    params = duk_get_pointer(ctx, -1);
    (void)duk_get_prop_index(ctx, 0, 0);
    v = duk_get_pointer(ctx, -1);
    in0[0] = params->arg;
    in0[1] = (uint64_t)v;
    if(params->dispatch){
        fn = (nccc_call_t)params->dispatch;
        in1[0] = params->ctx;
        in1[1] = (uint64_t)in0;
        fn(in1, NULL);
    }else{
        fn = (nccc_call_t)params->ctx;
        fn(in0, NULL);
    }
    free(params);

    return 0;
}

static duk_ret_t
nccc_wrap_pointer(duk_context* ctx){
    // [ptr dispatch ctx arg] => ptr
    //   [dispatch,ctx] = [arg ptr] => []
    finalizer_params_t* params;
    uint64_t ptr;
    params = malloc(sizeof(finalizer_params_t));
    value_out(ctx, &ptr, 'p', 0);
    value_out(ctx, &params->dispatch, 'p', 1);
    value_out(ctx, &params->ctx, 'p', 2);
    value_out(ctx, &params->arg, 'p', 3);
    duk_push_object(ctx);
    duk_push_c_function(ctx, do_finalize, 1);
    duk_set_finalizer(ctx, -2);
    duk_push_pointer(ctx, ptr);
    duk_put_prop_index(ctx, -2, 0);
    duk_push_pointer(ctx, params);
    duk_put_prop_index(ctx, -2, 1);

    return 1;
}


