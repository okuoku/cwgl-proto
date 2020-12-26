#include <cwgl.h>

int
main(int argc, char** av){
    int w,h;
    cwgl_ctx_t* ctx;
    cwgl_init();

    w = 1280;
    h = 720;
    ctx = cwgl_ctx_create(w,h,0,0);

    /* Loop */
    int frame;
    frame = 0;
    for(;;){
        cwgl_ctx_frame_begin(ctx);

        float step = frame % 256;
        float col = 1.0f * step / 256.0f;

        /* Draw something */
        cwgl_viewport(ctx, 0, 0, w, h);
        cwgl_clearColor(ctx, col, col, col, 1.0f);
        cwgl_clear(ctx, 0x4000 /* COLOR BUFFER BIT */);

        cwgl_ctx_frame_end(ctx);
        frame ++;
    }

    return 0;
}
