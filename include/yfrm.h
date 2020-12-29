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

YFRM_API int yfrm_query0(int32_t slot, int32_t* buf, size_t buflen);
YFRM_API void yfrm_frame_begin0(void*);
YFRM_API void yfrm_frame_end0(void*);

// {
#ifdef __cplusplus
};
#endif

#endif
