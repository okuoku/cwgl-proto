#include <stdint.h>
#define TESTLIB_API __declspec(dllexport)

#ifdef WIN32
#include <malloc.h>
#else
#include <alloca.h>
#endif

typedef void (*nccc_call_t)(const uint64_t* in, uint64_t* out);

TESTLIB_API void
test_echo(const uint64_t* in, uint64_t* out){
    // [cnt arg ...] => [arg ...]
    const uint64_t cnt = in[0];
    int i;
    for(i=0;i!=cnt;i++){
        out[i] = in[i+1];
    }
}

TESTLIB_API void
test_callback_echo(const uint64_t* in, uint64_t* out){
    // [cnt_cb dispatch cb arg ...] => (dispatch arg ...) => [ret ...]
    const uint64_t cnt_cb = in[0];
    uint64_t* buf;
    nccc_call_t dispatch;
    uint64_t din[2];
    int i;
    dispatch = (nccc_call_t)in[1];
    din[0] = in[2];
    din[1] = (uintptr_t)&in[3];
    buf = alloca(sizeof(uint64_t)*cnt_cb);

    dispatch(din, buf);

    for(i=0;i!=cnt_cb;i++){
        out[i] = buf[i];
    }
}

