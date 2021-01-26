#ifndef __YUNI_YFRM_H
#define __YUNI_YFRM_H

#ifdef __cplusplus
extern "C" {
#endif
// }

#ifdef YFRM_DLL
/* Win32 DLL */
#ifdef YFRM_SHARED_BUILD
#define YFRM_API __declspec(dllexport)
#else
#define YFRM_API __declspec(dllimport)
#endif
#else
/* Generic static-library */
#define YFRM_API
#endif

#include <stdint.h>
#include <stddef.h>

/* Context */
struct cwgl_ctx_s;
typedef struct cwgl_ctx_s cwgl_ctx_t;
YFRM_API int yfrm_init(void); /* Tentative */
YFRM_API void yfrm_terminate(void); /* Tentative */
YFRM_API cwgl_ctx_t* yfrm_cwgl_ctx_create(int32_t width, int32_t height, int32_t reserved, int32_t flags);
YFRM_API void yfrm_cwgl_ctx_release(cwgl_ctx_t* ctx);

/* Events */
YFRM_API int yfrm_query0(int32_t slot, int32_t* buf, size_t buflen);

/* Frame */
YFRM_API void yfrm_frame_begin0(void*);
YFRM_API void yfrm_frame_end0(void*);

/* Audio */
YFRM_API void yfrm_audio_enqueue0(float* ch0, float* ch1, int32_t samples);
YFRM_API void yfrm_audio_pause0(void);

// {
#ifdef __cplusplus
};
#endif

#endif
