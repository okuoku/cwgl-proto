const CWGL = require("./cwgl.js");
const Ref = require("ref-napi");
const Weak = require("weak-napi");

function wrapPointer(obj, relcb){
    const pval = Ref.address(obj);
    return Weak(obj, function(){relcb(pval);});
}

function freectx(ptr){
    // FIXME: Implement context freeing
    console.log("Leak!", ptr);
}

function GL(w, h, attr){
    const ctx = CWGL.cwgl_ctx_create(w, h, 0, 0);
    function texfree(ptr){
        CWGL.cwgl_Texture_release(ctx, ptr);
    }
    wrapPointer(ctx, freectx);
    return {
        /* mgmt */
        cwgl_frame_begin: function(){
            CWGL.cwgl_ctx_frame_begin(ctx);
        },
        cwgl_frame_end: function(){
            CWGL.cwgl_ctx_frame_end(ctx);
        },

        // 5.14.1 Attributes
        // 5.14.2 Getting information about the context
        // 5.14.3 Setting and getting state
        clearColor: function(red, green, blue, alpha){
            CWGL.cwgl_clearColor(ctx, red, green, blue, alpha);
        },
        // 5.14.4 Viewing and clipping
        viewport: function(x, y, width, height){
            CWGL.cwgl_viewport(ctx, x, y, width, height);
        },
        // 5.14.5 Buffer objects
        // 5.14.6 Framebuffer objects
        // 5.14.7 Renderbuffer objects
        // 5.14.8 Texture objects
        createTexture: function(){
            let ptr = CWGL.cwgl_createTexture(ctx);
            wrapPointer(ptr, texfree);
            return ptr;
        },
        deleteTexture: function(tex){
            CWGL.cwgl_deleteTexture(ctx, tex);
        },
        // 5.14.9 Programs and Shaders
        // 5.14.10 Uniforms and attributes
        // 5.14.11 Writing to the drawing buffer
        clear: function(mask){
            CWGL.cwgl_clear(ctx, mask);
        },
        // 5.14.12 Reading back pixels
        // 5.14.13 Detecting context lost events
        // 5.14.14 Detecting and enabling extensions
    };
}

CWGL.cwgl_init();

module.exports = GL;
