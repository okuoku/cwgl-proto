#include "cwgl-gles2-priv.h"
#include <yfrm.h>

#include <string.h>
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
        if(SDL_Init(SDL_INIT_VIDEO|SDL_INIT_GAMECONTROLLER|SDL_INIT_AUDIO|SDL_INIT_TIMER)){
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

    SDL_GL_SetSwapInterval(0);

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

static size_t
fill_controllerbuttonevent(int32_t* buf, size_t offs,SDL_Event* evt){
    const int32_t LEN_controllerbuttonevent = 4;
    /* 0 */ const int32_t len = LEN_controllerbuttonevent;
    /* 1 */ int32_t type;
    /* 2 */ int32_t ident;
    /* 3 */ int32_t button;

    if(evt->cbutton.state == SDL_PRESSED){
        type = 101;
    }else{
        type = 100;
    }

    ident = 1;
    /* GamePad API order: A B X Y L1 R1 L2 R2 SEL START L3 R3
     *                    UP DOWN LEFT RIGHT META */
    switch(evt->cbutton.button){
        case SDL_CONTROLLER_BUTTON_A:
            button = 0;
            break;
        case SDL_CONTROLLER_BUTTON_B:
            button = 1;
            break;
        case SDL_CONTROLLER_BUTTON_X:
            button = 2;
            break;
        case SDL_CONTROLLER_BUTTON_Y:
            button = 3;
            break;
        case SDL_CONTROLLER_BUTTON_LEFTSHOULDER:
            button = 4;
            break;
        case SDL_CONTROLLER_BUTTON_RIGHTSHOULDER:
            button = 5;
            break;
        /* Missing: L2 R2 */
        case SDL_CONTROLLER_BUTTON_BACK:
            button = 8;
            break;
        case SDL_CONTROLLER_BUTTON_START:
            button = 9;
            break;
        case SDL_CONTROLLER_BUTTON_LEFTSTICK:
            button = 10;
            break;
        case SDL_CONTROLLER_BUTTON_RIGHTSTICK:
            button = 11;
            break;
        case SDL_CONTROLLER_BUTTON_DPAD_UP:
            button = 12;
            break;
        case SDL_CONTROLLER_BUTTON_DPAD_DOWN:
            button = 13;
            break;
        case SDL_CONTROLLER_BUTTON_DPAD_LEFT:
            button = 14;
            break;
        case SDL_CONTROLLER_BUTTON_DPAD_RIGHT:
            button = 15;
            break;
        case SDL_CONTROLLER_BUTTON_GUIDE:
            button = 16;
            break;
        default:
            button = -1;
            break;
    }

    buf[offs] = len;
    offs++;
    buf[offs] = type;
    offs++;
    buf[offs] = ident;
    offs++;
    buf[offs] = button;
    offs++;

    return offs;
}

static size_t
fill_controlleraxisevent(int32_t* buf, size_t offs,SDL_Event* evt){
    const int32_t LEN_controlleraxisevent = 6;
    /* 0 */ const int32_t len = LEN_controlleraxisevent;
    /* 1 */ int32_t type;
    /* 2 */ int32_t ident;
    /* 3 */ int32_t axis;
    /* 4 */ int32_t value;
    /* 5 */ int32_t frac;

    type = 102;
    ident = 1;
    switch(evt->caxis.axis){
        case SDL_CONTROLLER_AXIS_LEFTX:
            axis = 0;
            break;
        case SDL_CONTROLLER_AXIS_LEFTY:
            axis = 1;
            break;
        case SDL_CONTROLLER_AXIS_RIGHTX:
            axis = 2;
            break;
        case SDL_CONTROLLER_AXIS_RIGHTY:
            axis = 3;
            break;
        case SDL_CONTROLLER_AXIS_TRIGGERLEFT:
            axis = 4;
            break;
        case SDL_CONTROLLER_AXIS_TRIGGERRIGHT:
            axis = 5;
            break;
        default:
            axis = -1;
            break;
    }
    value = evt->caxis.value;
    frac = 32768;

    buf[offs] = len;
    offs++;
    buf[offs] = type;
    offs++;
    buf[offs] = ident;
    offs++;
    buf[offs] = axis;
    offs++;
    buf[offs] = value;
    offs++;
    buf[offs] = frac;
    offs++;

    return offs;
}

SDL_GameController* cur_controller = NULL;

YFRM_API int
yfrm_query0(int32_t slot, int32_t* buf, size_t buflen){
    SDL_Event evt;
    if(slot == 0 /* events */){
        size_t cur = 0;

        /* Init gamepad if we don't have one */
        if(! cur_controller){
            if(0 < SDL_NumJoysticks()){
                cur_controller = SDL_GameControllerOpen(0);
            }
        }

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
                case SDL_CONTROLLERBUTTONDOWN:
                case SDL_CONTROLLERBUTTONUP:
                    cur = fill_controllerbuttonevent(buf, cur, &evt);
                    break;
                case SDL_CONTROLLERAXISMOTION:
                    cur = fill_controlleraxisevent(buf, cur, &evt);
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

/* Tentative Audio support */

static SDL_AudioDeviceID audiodevice;
static SDL_mutex* audiolock;
static int yfrm_audio_state = 0;

static void
audio_sync_init(void){
    audiolock = SDL_CreateMutex();
    yfrm_audio_state = 1;
}

YFRM_API void
yfrm_audio_pause0(void){
    if(yfrm_audio_state == 0){
        audio_sync_init();
    }
    SDL_LockMutex(audiolock);
    if(yfrm_audio_state != 1){
        SDL_CloseAudioDevice(audiodevice);
        yfrm_audio_state = 1;
    }
    SDL_UnlockMutex(audiolock);
}

static void
queueaudio(float* ch0, float* ch1, int32_t samples){
    int i;
    const size_t bufsiz = sizeof(float) * 2 * samples;
    float* buf;
    buf = malloc(bufsiz);
    /* Interleave data to LR order */
    for(i=0;i!=samples;i++){
        buf[i*2] = ch0[i];
        buf[i*2+1] = ch1[i];
    }
    i = SDL_QueueAudio(audiodevice, buf, bufsiz);
    if(i < 0){
        printf("Failed to queue audio: %s\n", SDL_GetError());
    }
    free(buf);
    //printf("Queued: %d\n", SDL_GetQueuedAudioSize(audiodevice));
}

YFRM_API void
yfrm_audio_enqueue0(float* ch0, float* ch1, int32_t samples){
    SDL_AudioSpec want, have;
    if(yfrm_audio_state == 0){
        audio_sync_init();
    }

    SDL_LockMutex(audiolock);
    if(yfrm_audio_state == 1){
        /* Audio is not started */
        memset(&want, 0, sizeof(want));
        memset(&have, 0, sizeof(have));
        want.freq = 48000;
        want.format = AUDIO_F32;
        want.channels = 2;
        want.samples = 256;
        want.callback = NULL;
        audiodevice = SDL_OpenAudioDevice(NULL, 0, &want, &have, 0);
        if(! audiodevice){
            printf("Failed to open audio: %s\n", SDL_GetError());
        }else{
            yfrm_audio_state = 2;
        }
    }

    if(yfrm_audio_state == 2){
        /* Paused */
        yfrm_audio_state = 3;
        queueaudio(ch0,ch1,samples);
        SDL_PauseAudioDevice(audiodevice, 0);
    }else if(yfrm_audio_state == 3){
        /* Playing */
        queueaudio(ch0,ch1,samples);
    }
    SDL_UnlockMutex(audiolock);
}
