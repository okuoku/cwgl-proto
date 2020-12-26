#include "cwgl-gles2-priv.h"

#include <stdio.h>
#include <SDL.h>

/* Globals */
static SDL_Window* wnd;
static cwgl_ctx_t* cur;

CWGL_API int
cwgl_init(void){
    wnd = NULL;
    cur = NULL;
}

CWGL_API void
cwgl_terminate(void){
    if(wnd){
        SDL_Quit();
        wnd = NULL;
    }
    cur = NULL;
}

struct cwgl_ctx_s {
    SDL_Window* wnd;
    SDL_GLContext glc;
};

CWGL_API cwgl_ctx_t*
cwgl_ctx_create(int32_t width, int32_t height, int32_t reserved,
                int32_t flags){
    SDL_GLContext glc;
    cwgl_ctx_t* r;

    if(! wnd){
        SDL_Window* window;
        /* Init SDL and Create a window */
        if(SDL_Init(SDL_INIT_VIDEO)){
            printf("SDL Init failed.\n");
            return NULL;
        }

        SDL_SetHint(SDL_HINT_OPENGL_ES_DRIVER, "1");
        SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, 
                            SDL_GL_CONTEXT_PROFILE_ES);

        SDL_GL_SetAttribute(SDL_GL_DOUBLEBUFFER, 1);
        SDL_GL_SetAttribute(SDL_GL_DEPTH_SIZE, 24);
        SDL_GL_SetAttribute(SDL_GL_STENCIL_SIZE, 8);
        SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 2);
        SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 0);

        if(!(window = SDL_CreateWindow("cwgl",
                                       SDL_WINDOWPOS_UNDEFINED,
                                       SDL_WINDOWPOS_UNDEFINED,
                                       width, height,
                                       SDL_WINDOW_OPENGL))){
            SDL_Quit();
            printf("SDL CreateWindow failed.\n");
            return NULL;
        }
        wnd = window;
    }

    glc = SDL_GL_CreateContext(wnd);
    SDL_GL_MakeCurrent(wnd, glc);

    SDL_GL_SetSwapInterval(1);

    r = malloc(sizeof(cwgl_ctx_t));
    r->wnd = wnd;
    r->glc = glc;

    return r;
}

CWGL_API void
cwgl_ctx_release(cwgl_ctx_t* ctx){
    free(ctx);
}

CWGL_API void
cwgl_ctx_frame_begin(cwgl_ctx_t* ctx){
    SDL_Event evt;

    if(cur){
        printf("WARNING: Overriding frame !\n");
    }

    cur = ctx;

    /* Consume events */
    while(SDL_PollEvent(&evt)){
        if(evt.type == SDL_QUIT){
            exit(0);
        }
    }
}

CWGL_API void
cwgl_ctx_frame_end(cwgl_ctx_t* ctx){
    cur = NULL;
    SDL_GL_SwapWindow(ctx->wnd);
}

void
cwgl_priv_check_current(cwgl_ctx_t* ctx){
    if(ctx != cur){
        printf("WARNING: Submitting cross context command !\n");
    }
}
