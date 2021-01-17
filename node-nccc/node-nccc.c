#include <node_api.h>

static napi_value
sayhello(napi_env env, napi_callback_info info){
    napi_status status;
    napi_value str;

    status = napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &str);

    return str;
}


static napi_value
node_nccc_init(napi_env env, napi_value exports){
    napi_status status;
    napi_property_descriptor desc = {
        "hello",
        NULL,
        sayhello,
        NULL,
        NULL,
        NULL,
        napi_writable | napi_enumerable | napi_configurable,
        NULL
    };
    status = napi_define_properties(env, exports, 1, &desc);
    if(status != napi_ok) return NULL;
    return exports;
}

NAPI_MODULE(node_nccc, node_nccc_init)
