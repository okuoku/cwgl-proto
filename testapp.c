#include <cwgl.h>
#include <yfrm.h>

int
main(int argc, char** av){
    int w,h;
    int buf[128];
    cwgl_ctx_t* ctx;
    cwgl_init();

    w = 1280;
    h = 720;
    ctx = cwgl_ctx_create(w,h,0,0);

    /* Loop */
    int frame;
    frame = 0;
    for(;;){
        yfrm_frame_begin0(ctx);

        float step = frame % 256;
        float col = 1.0f * step / 256.0f;

        /* Draw something */
        cwgl_viewport(ctx, 0, 0, w, h);
        cwgl_clearColor(ctx, col, col, col, 1.0f);
        cwgl_clear(ctx, 0x4000 /* COLOR BUFFER BIT */);

        while(yfrm_query0(0, buf, 128) > 0){}
        yfrm_frame_end0(ctx);
        frame ++;
    }

    return 0;
}
