#include "cwgl-gles2-priv.h"
#include <yfrm.h>

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

YFRM_API void
yfrm_frame_begin0(void* c){

    if(cur){
        printf("WARNING: Overriding frame !\n");
    }

    cur = (cwgl_ctx_t*)c;

}

YFRM_API void
yfrm_frame_end0(void* c){
    cwgl_ctx_t* ctx = (cwgl_ctx_t*)c;
    cur = NULL;
    SDL_GL_SwapWindow(ctx->wnd);
}

void
cwgl_priv_check_current(cwgl_ctx_t* ctx){
    if(ctx != cur){
        printf("WARNING: Submitting cross context command !\n");
    }
}


/* Event handling */
#define MIN_EVENT_SIZE 32 /* ??? */

static int32_t
fill_mousebuttonbitmap(uint8_t btn){
    int32_t r = 0;
    if(btn & SDL_BUTTON(1)){
        r |= 1;
    }
    if(btn & SDL_BUTTON(2)){
        r |= 2;
    }
    if(btn & SDL_BUTTON(3)){
        r |= 4;
    }
    if(btn & SDL_BUTTON(4)){
        r |= 8;
    }
    if(btn & SDL_BUTTON(5)){
        r |= 16;
    }
    return r;
}

static size_t
fill_mousemotionevent(int32_t* buf, size_t offs, SDL_Event* evt){
    const int32_t LEN_mousemotionevent = 7;
    /* 0 */ const int32_t len = LEN_mousemotionevent;
    /* 1 */ int32_t type;
    /* 2 */ int32_t x;
    /* 3 */ int32_t y;
    /* 4 */ int32_t xrel;
    /* 5 */ int32_t yrel;
    /* 6 */ int32_t buttons;
    type = 3;
    x = evt->motion.x;
    y = evt->motion.y;
    xrel = evt->motion.xrel;
    yrel = evt->motion.yrel;
    buttons = fill_mousebuttonbitmap(evt->motion.state);

    buf[offs] = len;
    offs++;
    buf[offs] = type;
    offs++;
    buf[offs] = x;
    offs++;
    buf[offs] = y;
    offs++;
    buf[offs] = xrel;
    offs++;
    buf[offs] = yrel;
    offs++;
    buf[offs] = buttons;
    offs++;

    return offs;
}

static size_t
fill_mousewheelevent(int32_t* buf, size_t offs, SDL_Event* evt){
    const int32_t LEN_mousewheelevent = 4;
    /* 0 */ const int32_t len = LEN_mousewheelevent;
    /* 1 */ int32_t type;
    /* 2 */ int32_t dx;
    /* 3 */ int32_t dy;
    type = 2;
    dx = evt->wheel.x;
    dy = evt->wheel.y;

    buf[offs] = len;
    offs++;
    buf[offs] = type;
    offs++;
    buf[offs] = dx;
    offs++;
    buf[offs] = dy;
    offs++;

    return offs;
}


static size_t
fill_mousebuttonevent(int32_t* buf, size_t offs, SDL_Event* evt){
    const int32_t LEN_mousebuttonevent = 6;
    /* 0 */ const int32_t len = LEN_mousebuttonevent;
    /* 1 */ int32_t type;
    /* 2 */ int32_t x;
    /* 3 */ int32_t y;
    /* 4 */ int32_t button;
    /* 5 */ int32_t buttons;
    if(evt->type == SDL_MOUSEBUTTONDOWN){
        type = 0;
    }else{
        type = 1;
    }
    x = evt->button.x;
    y = evt->button.y;
    button = fill_mousebuttonbitmap(evt->button.button);
    buttons = fill_mousebuttonbitmap(SDL_GetMouseState(NULL, NULL));
    buf[offs] = len;
    offs++;
    buf[offs] = type;
    offs++;
    buf[offs] = x;
    offs++;
    buf[offs] = y;
    offs++;
    buf[offs] = button;
    offs++;
    buf[offs] = buttons;
    offs++;

    return offs;
}

YFRM_API int
yfrm_query0(int32_t slot, int32_t* buf, size_t buflen){
    SDL_Event evt;
    if(slot == 0 /* events */){
        size_t cur = 0;
        while(((buflen - cur) > MIN_EVENT_SIZE)){
            if(!SDL_PollEvent(&evt)){
                break;
            }
            switch(evt.type){
                case SDL_QUIT:
                    exit(0);
                    break;
                case SDL_MOUSEBUTTONDOWN:
                case SDL_MOUSEBUTTONUP:
                    cur = fill_mousebuttonevent(buf, cur, &evt);
                    break;
                case SDL_MOUSEMOTION:
                    cur = fill_mousemotionevent(buf, cur, &evt);
                    break;
                case SDL_MOUSEWHEEL:
                    cur = fill_mousewheelevent(buf, cur, &evt);
                    break;
                default:
                    /* Do nothing */
                    break;
            }
        }
        return cur;
    }else{
        return -1;
    }
}
