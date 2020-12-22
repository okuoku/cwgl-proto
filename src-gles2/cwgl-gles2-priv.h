#ifndef __YUNI_CWGL_GLES2_PRIV_H
#define __YUNI_CWGL_GLES2_PRIV_H

#define CTX_ENTER(ctx)
#define CTX_LEAVE(ctx)

#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <cwgl.h>

/* Buffer structures */
struct cwgl_Buffer_s {
    int name;
};
struct cwgl_Shader_s {
    int name;
};
struct cwgl_Program_s {
    int name;
};
struct cwgl_UniformLocation_s {
    int name;
};

/* Buffer allocation */
#include <stdlib.h>

#define CTX_ALLOC(ctx, type) \
    malloc(sizeof(cwgl_ ## type ## _t))

#define CTX_FREE(ctx, type, p) \
    free(p)

#define CTX_SETNAME(ctx, p, id) \
    p->name = id

#define CTX_GETNAME(ctx, p) \
    p->name

#endif
