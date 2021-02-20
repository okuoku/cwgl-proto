#ifdef _WIN32
#define EXPORT __declspec(dllexport)
#else
#define EXPORT __attribute__ ((visibility ("default")))
#endif

#include <stdlib.h>
#include <stdint.h>

void lib_yfrm_dispatch(const uint64_t* in, uint64_t* out);
void lib_cwgl_dispatch(const uint64_t* in, uint64_t* out);

EXPORT void 
yfrm_nccc_root_00(const uint64_t* in, uint64_t* out){
    switch(in[0]){
        case 0:
            switch(in[1]){
                case 0:
                    if(in[2] == 1){
                        out[0] = 0; /* buildid */
                        out[1] = 0; /* buildid */
                        out[2] = 2; /* libcount */
                        out[3] = 1; /* maxversion */
                    }else{
                        abort();
                    }
                    return;
            }
            return;
        case 1 /* lib */:
            switch(in[1]){
                case 0:
                    lib_yfrm_dispatch(&in[2], out);
                    return;
                case 1:
                    lib_cwgl_dispatch(&in[2], out);
                    return;
                default:
                    abort();
            }
    }
}
