#define SDL_MAIN_HANDLED
#define SDL_main main
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <GLES2/gl2platform.h>

#include <SDL.h>

#include <cwgl.h>

int
main(int argc, char** av){
    int flags,w,h;
    SDL_GLContext glc;
    SDL_Window* wnd = NULL;
    SDL_Event evt;

    flags = SDL_WINDOW_OPENGL;
    w = 1280;
    h = 720;

    if(SDL_Init(SDL_INIT_VIDEO)){
        return -1;
    }

    SDL_SetHint(SDL_HINT_OPENGL_ES_DRIVER, "1");
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_ES);

    SDL_GL_SetAttribute(SDL_GL_DOUBLEBUFFER, 1);
    SDL_GL_SetAttribute(SDL_GL_DEPTH_SIZE, 24);
    SDL_GL_SetAttribute(SDL_GL_STENCIL_SIZE, 8);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 2);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 0);

    if(!(wnd = SDL_CreateWindow("cwgl",
                                SDL_WINDOWPOS_UNDEFINED,
                                SDL_WINDOWPOS_UNDEFINED,
                                w, h,
                                flags))){
        return -1;
    }

    glc = SDL_GL_CreateContext(wnd);
    SDL_GL_MakeCurrent(wnd, glc);

    SDL_GL_SetSwapInterval(1); // 1: VSYNC

    /* Loop */
    int frame;
    frame = 0;
    for(;;){
        while(SDL_PollEvent(&evt)){
            if(evt.type == SDL_QUIT){
                exit(0);
            }
        }
        float step = frame % 256;
        float col = 1.0f * step / 256.0f;

        /* Draw something */
        cwgl_viewport(NULL, 0, 0, w, h);
        cwgl_clearColor(NULL, col, col, col, 1.0f);
        cwgl_clear(NULL, 0x4000 /* COLOR BUFFER BIT */);

        SDL_GL_SwapWindow(wnd);
        frame ++;
    }

    return 0;
}
