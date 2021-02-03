#include <string.h>
#include <stdlib.h>
#include <node_api.h>
#ifdef WIN32
#include <malloc.h>
#else
#include <alloca.h>
#endif

#include <setjmp.h>
static jmp_buf g_jmpbuf;
static int calldepth = 0;

static void
value_in(napi_env env, napi_value* vout, char type, uint64_t vin){
    napi_status status;
    status = napi_invalid_arg;
    napi_value arraybuf;
    switch(type){
        case 'i':
            status = napi_create_int32(env, vin, vout);
            break;
        case 'l':
            status = napi_create_int64(env, vin, vout);
            break;
        case 'p':
            status = napi_create_external_arraybuffer(env, 
                                                      (void*)(uintptr_t)vin, 
                                                      1, 
                                                      NULL,
                                                      NULL,
                                                      &arraybuf);
            if(status != napi_ok){
                abort();
            }
            status = napi_create_typedarray(env,
                                            napi_uint8_array, 
                                            1,
                                            arraybuf,
                                            0,
                                            vout);
            break;
        case 'f':
            status = napi_create_double(env, *((float *)&vin), vout);
            break;
        case 'd':
            status = napi_create_double(env, *((double *)&vin), vout);
            break;
        default:
            break;
    }
    if(status != napi_ok){
        abort();
    }
}

static int // => bool
get_pointer(napi_env env, napi_value v, uintptr_t* value){
    napi_status status;
    bool res;
    void* p = NULL;
    size_t s = 0;
    status = napi_is_arraybuffer(env, v, &res);
    if(status == napi_ok && res){
        status = napi_get_arraybuffer_info(env, v, &p, &s);
        (void)s;
        if(status != napi_ok){
            abort();
        }
        *value = (uintptr_t)p;
        return 1;
    }
    status = napi_is_buffer(env, v, &res);
    if(status == napi_ok && res){
        status = napi_get_buffer_info(env, v, &p, &s);
        (void)s;
        if(status != napi_ok){
            abort();
        }
        *value = (uintptr_t)p;
        return 1;
    }
    return 0;
}

static void
value_out(napi_env env, uint64_t* vout, char type, napi_value vin){
    napi_status status;
    napi_valuetype typ;
    bool bvalue;
    uintptr_t pvalue;
    status = napi_invalid_arg;
    double d;
    napi_value strbuf;
    size_t strbuflen;
    void* strbufptr;
    switch(type){
        case 'i':
        case 'l':
        case 'p':
            status = napi_get_value_int64(env, vin, (int64_t*)vout);
            break;
        case 'f':
            status = napi_get_value_double(env, vin, &d);
            *vout = 0;
            *(float *)vout = d;
            break;
        case 'd':
            status = napi_get_value_double(env, vin, &d);
            *(double *)vout = d;
            break;
        default:
            break;
    }
    if(status != napi_ok){
        // 2nd chance, fill zero for undefined
        status = napi_typeof(env, vin, &typ);
        if(typ == napi_undefined){
            *vout = 0;
        }else if(typ == napi_null){
            *vout = 0;
        }else if(typ == napi_boolean){
            status = napi_get_value_bool(env, vin, &bvalue);
            if(status != napi_ok){
                abort();
            }
            if(bvalue){
                // FIXME: Ignore type
                *vout = 1;
            }else{
                *vout = 0;
            }
        }else if(typ == napi_string && type == 'p'){
            strbuflen = 0;
            status = napi_get_value_string_utf8(env,
                                                vin,
                                                NULL,
                                                0,
                                                &strbuflen);
            if(status != napi_ok){
                abort();
            }
            strbuflen++;
            status = napi_create_buffer(env,
                                        strbuflen,
                                        &strbufptr,
                                        &strbuf);
            if(status != napi_ok){
                abort();
            }
            status = napi_get_value_string_utf8(env,
                                                vin,
                                                strbufptr,
                                                strbuflen,
                                                &strbuflen);
            if(status != napi_ok){
                abort();
            }
            *vout = (uintptr_t)strbufptr;
        }else if(get_pointer(env, vin, &pvalue)){
            *vout = pvalue;
        }else{
            abort();
        }
    }
}

struct cb_params_s {
    char* intypes;
    char* outtypes;
    size_t incount;
    size_t outcount;
    /* For nccc_call */
    uint64_t addr;
    uint64_t dispatch;
    /* For nccc_cb */
    napi_ref cb_ref;
    napi_env env;
};
typedef struct cb_params_s cb_params_t;
typedef void (*nccc_call_t)(const uint64_t* in, uint64_t* out);

static napi_value
nccc_call_trampoline(napi_env env, napi_callback_info info){
    int i;
    cb_params_t* ctx;
    size_t argc;
    napi_value ctx_this;
    napi_value* argbuf;
    uint64_t* inbuf;
    uint64_t* outbuf;
    napi_status status;
    nccc_call_t fn;
    napi_value r;
    napi_value retbuf;
    napi_value exc;
    uint64_t dispatch;

    argc = 0;
    /* Pass1: Collect ctx */
    status = napi_get_cb_info(env, info, &argc, NULL, &ctx_this, &ctx);
    if(status != napi_ok){
        abort();
    }
    dispatch = ctx->dispatch;
    /* Pass2: Fill argument */
    argc = ctx->incount;
    argbuf = alloca(sizeof(napi_value)*ctx->incount);
    status = napi_get_cb_info(env, info, &argc, argbuf, &ctx_this, &ctx);
    if(status != napi_ok){
        abort();
    }
    if(dispatch){
        inbuf = alloca(sizeof(uint64_t)*(ctx->incount+1));
    }else{
        inbuf = alloca(sizeof(uint64_t)*ctx->incount);
    }
    outbuf = alloca(sizeof(uint64_t)*ctx->outcount);
    /* Setup arguments */
    if(dispatch){
        inbuf[0] = ctx->addr;
        for(i=0;i!=ctx->incount;i++){
            value_out(env,&inbuf[i+1],ctx->intypes[i],argbuf[i]);
        }
    }else{
        for(i=0;i!=ctx->incount;i++){
            value_out(env,&inbuf[i],ctx->intypes[i],argbuf[i]);
        }
    }

    /* Call */
    if(dispatch){
        fn = (nccc_call_t)ctx->dispatch;
    }else{
        fn = (nccc_call_t)ctx->addr;
    }
    if(calldepth == 0){
        /* Root call into native code, save buffer */
        if(setjmp(g_jmpbuf)){
            /* Revert back calldepth = 0 */
            calldepth = 0;
            status = napi_get_undefined(env, &r);
            if(status != napi_ok){
                abort();
            }
            status = napi_get_and_clear_last_exception(env, &exc);
            if(status != napi_ok){
                abort();
            }
            status = napi_throw(env, exc);
            (void)napi_throw(env, exc);
            return r;
        }
    }
    calldepth++;
    fn(inbuf,outbuf);
    calldepth--;

    /* Receive data */
    if(ctx->outcount == 0){
        status = napi_get_undefined(env, &r);
        if(status != napi_ok){
            abort();
        }
    }else if(ctx->outcount == 1){
        value_in(env,&r,ctx->outtypes[0],outbuf[0]);
    }else{
        status = napi_create_array_with_length(env, ctx->outcount, &r);
        if(status != napi_ok){
            abort();
        }
        for(i=0;i!=ctx->outcount;i++){
            value_in(env,&retbuf,ctx->outtypes[i],outbuf[i]);
            status = napi_set_element(env, r, i, retbuf);
        }
    }
    return r;
}

static napi_value
make_nccc_call(napi_env env, napi_callback_info info){
    // [debugstring, dispatch, addr, intypes, outtypes] => closure
    napi_value cb;
    size_t argc;
    napi_value args[5];
    napi_value ctx_this;
    void* bogus;
    napi_status status;
    char typestringbuf[40];
    size_t typestringlen = 0;
    char debugstringbuf[360];
    size_t debugstringlen = 0;
    cb_params_t* ctx;
    uint64_t addr;
    
    argc = 5;
    status = napi_get_cb_info(env, info, &argc, args, &ctx_this, &bogus);
    if(status != napi_ok){
        abort();
    }

    /* Setup callback context */
    ctx = malloc(sizeof(cb_params_t));
    if(!ctx){
        abort();
    }
    /* 0:debugname */
    status = napi_get_value_string_utf8(env, args[0], debugstringbuf,
                                        sizeof(debugstringbuf), 
                                        &debugstringlen);
    if(status != napi_ok){
        /* FIXME: Free params, etc */
        abort();
    }
    /* 1:dispatch */
    status = napi_get_value_int64(env, args[1], (int64_t*)&addr);
    if(status != napi_ok){
        abort();
    }
    ctx->dispatch = addr;

    /* 2:addr */
    status = napi_get_value_int64(env, args[2], (int64_t*)&addr);
    if(status != napi_ok){
        abort();
    }
    ctx->addr = addr;

    /* 3:intype */
    status = napi_get_value_string_utf8(env, args[3], typestringbuf,
                                        sizeof(typestringbuf), 
                                        &typestringlen);
    if(status != napi_ok){
        abort();
    }
    ctx->incount = typestringlen;
    ctx->intypes = malloc(typestringlen + 1);
    memcpy(ctx->intypes, typestringbuf, typestringlen);
    ctx->intypes[typestringlen] = 0;

    /* 4:outtype */
    status = napi_get_value_string_utf8(env, args[4], typestringbuf,
                                        sizeof(typestringbuf), 
                                        &typestringlen);
    if(status != napi_ok){
        abort();
    }
    ctx->outcount = typestringlen;
    ctx->outtypes = malloc(typestringlen + 1);
    memcpy(ctx->outtypes, typestringbuf, typestringlen);
    ctx->outtypes[typestringlen] = 0;

    if(status != napi_ok){
        abort();
    }
    /* Generate callback */
    status = napi_create_function(env, debugstringbuf, debugstringlen,
                                  nccc_call_trampoline,
                                  ctx,
                                  &cb);
    if(status != napi_ok){
        abort();
    }
    /* FIXME: treat `ctx` as an extra data */
    return cb;
}


static void
nccc_cb_dispatcher(const uint64_t* in, uint64_t* out){
    // [ctx inaddr] => (dispatch)
    // Native to JavaScript bridge
    napi_handle_scope scope;
    napi_status status;
    napi_value vout,v;
    napi_value* argbuf;
    napi_value glbl;
    napi_value cb;
    napi_value err;
    cb_params_t* ctx = (cb_params_t*)(uintptr_t)in[0];
    const uint64_t* in_next = (uint64_t*)(uintptr_t)in[1];
    int i;
    bool r;

    status = napi_open_handle_scope(ctx->env, &scope);
    if(status != napi_ok){
        abort();
    }
    // Construct input
    argbuf = alloca(sizeof(napi_value)*ctx->incount);
    if(ctx->incount){
        for(i=0;i!=ctx->incount;i++){
            value_in(ctx->env, &(argbuf[i]), 
                     ctx->intypes[i], in_next[i]);
        }
    }
    // Call procedure
    // FIXME: What value should we use as `this` ..?
    status = napi_get_global(ctx->env, &glbl);
    if(status != napi_ok){
        abort();
    }
    status = napi_get_reference_value(ctx->env, ctx->cb_ref, &cb);
    if(status != napi_ok){
        abort();
    }
    napi_valuetype typ;
    status = napi_typeof(ctx->env, cb, &typ);
    if(typ != napi_function){
        abort();
    }
    // FIXME: Throw C++ exception on error?
    status = napi_call_function(ctx->env, glbl, cb, 
                                ctx->incount /* FIXME: varargs? */,
                                argbuf,
                                &vout);
    if(status == napi_pending_exception){
        if(calldepth != 0){
            /* Return back to depth == 0 */
            status = napi_close_handle_scope(ctx->env, scope);
            if(status != napi_ok){
                abort();
            }
            longjmp(g_jmpbuf, 1);
        }else{
            status = napi_get_and_clear_last_exception(ctx->env, &err);
            if(status != napi_ok){
                abort();
            }
            status = napi_throw(ctx->env, err);
            status = napi_get_undefined(ctx->env, &vout);
        }
    }else if(status != napi_ok){
        abort();
    }

    // Parse and fill output
    if(ctx->outcount){
        status = napi_is_array(ctx->env, vout, &r);
        if(status != napi_ok){
            abort();
        }
        if(r){
            for(i=0;i!=ctx->outcount;i++){
                status = napi_get_element(ctx->env, vout, i, &v);
                if(status != napi_ok){
                    abort();
                }
                value_out(ctx->env, &out[i], ctx->outtypes[i], v);
            }
        }else{
            value_out(ctx->env, &out[0], ctx->outtypes[0], vout);
        }
    }

    status = napi_close_handle_scope(ctx->env, scope);
    if(status != napi_ok){
        abort();
    }
}

static napi_value
make_nccc_cb(napi_env env, napi_callback_info info){
    // [cb, intypes, outtypes] => [dispatch ctx]
    //      __types: 
    //         'i' : 32bit int
    //         'l' : 64bit int
    //         'p' : pointer
    //         'f' : float
    //         'd' : double
    char typestringbuf[40];
    size_t typestringlen = 0;
    napi_status status;
    napi_value cb;
    napi_ref cb_ref;
    napi_value args[4];
    napi_value ctx_this;
    void* bogus;
    size_t argc = 0;
    cb_params_t* params;
    napi_value out;
    napi_value obj_dispatch;
    napi_value obj_ctx;

    /* Setup callback context */
    argc = 4;
    status = napi_get_cb_info(env, info, &argc, args, &ctx_this, &bogus);
    if(status != napi_ok){
        return NULL;
    }

    /* retain callback */
    /* 0:cb */
    cb = args[0];
    status = napi_create_reference(env, cb, 1, &cb_ref);
    if(status != napi_ok){
        return NULL;
    }

    /* Fill context */
    params = malloc(sizeof(cb_params_t));
    params->env = env; // FIXME: Is that safe?
    params->cb_ref = cb_ref;
    /* 1:intypes */
    status = napi_get_value_string_utf8(env, args[1], typestringbuf,
                                        sizeof(typestringbuf), &typestringlen);
    if(status != napi_ok){
        /* FIXME: Free params, etc */
        abort();
    }
    params->incount = typestringlen;
    params->intypes = malloc(typestringlen + 1);
    memcpy(params->intypes, typestringbuf, typestringlen);
    params->intypes[typestringlen] = 0;

    /* 2:outtypes */
    status = napi_get_value_string_utf8(env, args[2], typestringbuf,
                                        sizeof(typestringbuf), &typestringlen);
    if(status != napi_ok){
        abort();
    }
    params->outcount = typestringlen;
    params->outtypes = malloc(typestringlen + 1);
    memcpy(params->outtypes, typestringbuf, typestringlen);
    params->outtypes[typestringlen] = 0;

    /* Output */
    status = napi_create_array_with_length(env, 2, &out);
    if(status != napi_ok){
        abort();
    }
    /* out0:dispatcher */
    status = napi_create_int64(env, (uintptr_t)nccc_cb_dispatcher, 
                               &obj_dispatch);
    if(status != napi_ok){
        abort();
    }
    status = napi_set_element(env, out, 0, obj_dispatch);
    if(status != napi_ok){
        abort();
    }
    /* out1:context */
    status = napi_create_int64(env, (uintptr_t)params, &obj_ctx);
    if(status != napi_ok){
        abort();
    }
    status = napi_set_element(env, out, 1, obj_ctx);
    if(status != napi_ok){
        abort();
    }
    /* FIXME: Assign GC callback(napi_add_finalizer) here. */
    return out;
}

static napi_value
node_nccc_init(napi_env env, napi_value exports){
    napi_status status;
    napi_value obj;
    status = napi_create_function(env, "make_nccc_cb",
                                  NAPI_AUTO_LENGTH,
                                  make_nccc_cb,
                                  NULL,
                                  &obj);
    if(status != napi_ok){
        return NULL;
    }
    status = napi_set_named_property(env, exports, "make_nccc_cb", obj);
    if(status != napi_ok){
        return NULL;
    }
    status = napi_create_function(env, "make_nccc_call",
                                  NAPI_AUTO_LENGTH,
                                  make_nccc_call,
                                  NULL,
                                  &obj);
    if(status != napi_ok){
        return NULL;
    }
    status = napi_set_named_property(env, exports, "make_nccc_call", obj);
    if(status != napi_ok){
        return NULL;
    }
    return exports;
}

NAPI_MODULE(node_nccc, node_nccc_init)
