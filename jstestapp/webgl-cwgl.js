const CWGL = require("./cwgl.js");
const Ref = require("ref-napi");
const Weak = require("weak-napi");
const E = require("./glenums.js");
const getenumtype = require("./getenumtype.js");

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
    const evtbuf = new Int32Array(128);

    let shadowDepthRenderbuffer = null;
    let shadowStencilRenderbuffer = null;

    let currentRenderbuffer = null;
    function trackbinding_Renderbuffer(rb){
        currentRenderbuffer = rb;
    }

    let currentTexture2D = null;
    let currentTextureCubeMap = null
    function trackbinding_texture(target, texture){
        switch(target){
            case E.TEXTURE_2D:
                currentTexture2D = texture;
                break;
            case E.TEXTURE_CUBE_MAP:
                currentTextureCubeMap = texture;
                break;
            default:
                throw "huh?";
        }
    }
    let currentArrayBuffer = null;
    let currentElementArrayBuffer = null;
    function trackbinding_buffer(target, buffer){
        switch(target){
            case E.ARRAY_BUFFER:
                currentArrayBuffer = buffer;
                break;
            case E.ELEMENT_ARRAY_BUFFER:
                currentElementArrayBuffer = buffer;
                break;
            default:
                throw "huh?";
        }
    }
    let currentProgram = null;
    function trackbinding_program(program){
        currentProgram = program;
    }

    function texfree(ptr){
        CWGL.cwgl_Texture_release(ctx, ptr);
    }
    function framebufferfree(ptr){
        CWGL.cwgl_Framebuffer_release(ctx, ptr);
    }
    function bufferfree(ptr){
        CWGL.cwgl_Buffer_release(ctx, ptr);
    }
    function renderbufferfree(ptr){
        CWGL.cwgl_Renderbuffer_release(ctx, ptr);
    }
    function shaderfree(ptr){
        CWGL.cwgl_Shader_release(ctx, ptr);
    }
    function programfree(ptr){
        CWGL.cwgl_Program_release(ctx, ptr);
    }
    function uniformlocationfree(ptr){
        CWGL.cwgl_UniformLocation_release(ctx, ptr);
    }
    wrapPointer(ctx, freectx);
    return {
        /* mgmt */
        cwgl_frame_begin: function(){
            CWGL.yfrm_frame_begin0(ctx);
        },
        cwgl_frame_end: function(){
            CWGL.yfrm_frame_end0(ctx);
        },
        yfrm_fill_events: function(){ // => bool(continue?)
            let r = 0;
            let cont = false;
            r = CWGL.yfrm_query0(0, evtbuf, 128);
            if(r != 0){
                cont = true;
            }
            return cont;
        },
        yfrm_evtbuf: evtbuf,

        // 5.14.1 Attributes
        /// canvas (set by client)
        drawingBufferWidth: w,
        drawingBufferHeight: h,

        // 5.14.2 Getting information about the context
        // FIXME: Fill actual attributes
        /* WebGLHandlesContextLoss */
        getContextAttributes: function(){
            return {};
        },

        // 5.14.3 Setting and getting state
        activeTexture: function(texture){
            CWGL.cwgl_activeTexture(ctx, texture);
        },
        blendColor: function(red, green, blue, alpha){
            CWGL.cwgl_blendColor(ctx, red, green, blue, alpha);
        },
        blendEquation: function(mode){
            CWGL.cwgl_blendEquation(ctx, mode);
        },
        blendEquationSeparate: function(modeRGB, modeAlpha){
            CWGL.cwgl_blendEquationSeparate(ctx, modeRGB, modeAlpha);
        },
        blendFunc: function(sfactor, dfactor){
            CWGL.cwgl_blendFunc(ctx, sfactor, dfactor);
        },
        blendFuncSeparate: function(srcRGB, dstRGB, srcAlpha, dstAlpha){
            CWGL.cwgl_blendFuncSeparate(ctx, srcRGB, dstRGB, srcAlpha, dstAlpha);
        },
        clearColor: function(red, green, blue, alpha){
            CWGL.cwgl_clearColor(ctx, red, green, blue, alpha);
        },
        clearDepth: function(depth){
            CWGL.cwgl_clearDepth(ctx, depth);
        },
        clearStencil: function(s){
            CWGL.cwgl_clearStencil(ctx, s);
        },
        colorMask: function(red, green, blue, alpha){
            const r = red ? 1 : 0;
            const g = green ? 1 : 0;
            const b = blue ? 1 : 0;
            const a = alpha ? 1 : 0;
            CWGL.cwgl_colorMask(ctx, r, g, b, a);
        },
        cullFace: function(mode){
            CWGL.cwgl_cullFace(ctx, mode);
        },
        depthFunc: function(func){
            CWGL.cwgl_depthFunc(ctx, func);
        },
        depthMask: function(flag){
            const f = flag ? 1 : 0;
            CWGL.cwgl_depthMask(ctx, f);
        },
        depthRange: function(zNear, zFar){
            CWGL.cwgl_depthRange(ctx, zNear, zFar);
        },
        disable: function(cap){
            CWGL.cwgl_disable(ctx, cap);
        },
        enable: function(cap){
            CWGL.cwgl_enable(ctx, cap);
        },
        frontFace: function(mode){
            CWGL.cwgl_frontFace(ctx, mode);
        },
        getParameter: function(pname){
            //console.log("getParam", pname);
            switch(pname){
                case E.COMPRESSED_TEXTURE_FORMATS:
                    return [];
                case E.TEXTURE_BINDING_2D:
                    return currentTexture2D;
                case E.TEXTURE_BINDING_CUBE_MAP:
                    return currentTextureCubeMap;
                case E.ARRAY_BUFFER_BINDING:
                    return currentArrayBuffer;
                case E.ELEMENT_ARRAY_BUFFER_BINDING:
                    return currentElementArrayBuffer;
                case E.CURRENT_PROGRAM:
                    return currentProgram;
                default:
                    break;
            }
            if(pname == E.COMPRESSED_TEXTURE_FORMATS){
                // FIXME: Implement compressed texture
                return [];
            }
            const type = getenumtype(pname);
            switch(type){
                case "int":
                    {
                        let box = new Int32Array(1);
                        const r = CWGL.cwgl_getParameter_i1(ctx, pname, box);
                        if(r == 0){
                            return box[0];
                        } else {
                            return null;
                        }
                    }
                    break;
                case "bool":
                    {
                        let box = new Int32Array(1);
                        const r = CWGL.cwgl_getParameter_b1(ctx, pname, box);
                        if(r == 0){
                            return box[0] == 0 ? false : true;
                        } else {
                            return null;
                        }
                    }
                    break;
                case "b4":
                    {
                        function fold(x){ return x[0] == 0 ? false : true; }
                        let b0 = new Int32Array(1);
                        let b1 = new Int32Array(1);
                        let b2 = new Int32Array(1);
                        let b3 = new Int32Array(1);
                        const r = CWGL.cwgl_getParameter_b4(ctx, pname, b0, b1, b2, b3);
                        if(r == 0){
                            return [fold(b0), fold(b1), fold(b2), fold(b3)];
                        } else {
                            return null;
                        }
                    }
                    break;
                case "i2":
                    {
                        let i0 = new Int32Array(1);
                        let i1 = new Int32Array(1);
                        const r = CWGL.cwgl_getParameter_i2(ctx, pname, i0, i1);
                        if(r == 0){
                            return Int32Array.of(i0[0], i1[0]);
                        }else{
                            return null;
                        }
                    }
                    break;
                case "i4":
                    {
                        let i0 = new Int32Array(1);
                        let i1 = new Int32Array(1);
                        let i2 = new Int32Array(1);
                        let i3 = new Int32Array(1);
                        const r = CWGL.cwgl_getParameter_i4(ctx, pname, i0, i1, i2, i3);
                        if(r == 0){
                            return Int32Array.of(i0[0], i1[0], i2[0], i3[0]);
                        }else{
                            return null;
                        }
                    }
                    break;
                case "str":
                    {
                        let p0 = Ref.alloc(Ref.refType(Ref.types.void));
                        const r = CWGL.cwgl_getParameter_str(ctx, pname, p0);
                        if(r == 0){
                            const s = p0.deref();
                            const ssiz = CWGL.cwgl_string_size(ctx, s);
                            const buf = new Uint8Array(ssiz);
                            CWGL.cwgl_string_read(ctx, s, buf, ssiz);
                            CWGL.cwgl_string_release(ctx, s);
                            return Ref.readCString(buf, 0);
                        }else{
                            return null;
                        }
                    }
                    break;
                case "float":
                    {
                        let f0 = new Float32Array(1);
                        const r = CWGL.cwgl_getParameter_f1(ctx, pname, f0);
                        if(r == 0){
                            return f0[0];
                        }else{
                            return null;
                        }
                    }
                    break;
                case "f2":
                    {
                        let f0 = new Float32Array(1);
                        let f1 = new Float32Array(1);
                        const r = CWGL.cwgl_getParameter_f2(ctx, pname, f0, f1);
                        if(r == 0){
                            return Float32Array.of(f0[0], f1[0]);
                        }else{
                            return null;
                        }
                    }
                    break;
                case "f4":
                    {
                        let f0 = new Float32Array(1);
                        let f1 = new Float32Array(1);
                        let f2 = new Float32Array(1);
                        let f3 = new Float32Array(1);
                        const r = CWGL.cwgl_getParameter_f4(ctx, pname, f0, f1, f2, f3);
                        if(r == 0){
                            return Float32Array.of(f0[0], f1[0], f2[0], f3[0]);
                        }else{
                            return null;
                        }
                    }
                    break;
                case "Buffer":
                case "Program":
                case "Framebuffer":
                case "Renderbuffer":
                case "Texture":
                    throw "unknown";
                default:
                    throw "invalid";
            }
        },
        /* WebGLHandlesContextLoss */
        getError: function(){
            // FIXME: Merge local error
            const server_error = CWGL.cwgl_getError(ctx);

            return server_error;
        },
        hint: function(target, mode){
            CWGL.cwgl_hint(ctx, target, mode);
        },
        /* WebGLHandlesContextLoss */
        isEnabled: function(cap){
            const b = CWGL.cwgl_isEnabled(ctx, cap);
            if(b == 0){
                return false;
            }else{
                return true;
            }
        },
        lineWidth: function(width){
            CWGL.cwgl_lineWidth(ctx, width);
        },
        pixelStorei: function(pname, param){
            // FIXME: Handle FLIP_Y
            CWGL.cwgl_pixelStorei(ctx, pname, param);
        },
        polygonOffset: function(factor, units){
            CWGL.cwgl_polygonOffset(ctx, factor, units);
        },
        sampleCoverage: function(value, invert){
            const i = invert ? 1 : 0;
            CWGL.cwgl_sampleCoverage(ctx, value, i);
        },
        stencilFunc: function(func, ref, mask){
            CWGL.cwgl_stencilFunc(ctx, func, ref, mask);
        },
        stencilFuncSeparate: function(face, func, ref, mask){
            CWGL.cwgl_stencilFuncSeparate(ctx, face, func, ref, mask);
        },
        stencilMask: function(mask){
            CWGL.cwgl_stencilMask(ctx, mask);
        },
        stencilMaskSeparate: function(face, mask){
            CWGL.cwgl_stencilMaskSeparate(ctx, face, mask);
        },
        stencilOp: function(fail, zfail, zpass){
            CWGL.cwgl_stencilOp(ctx, fail, zfail, zpass);
        },
        stencilOpSeparate: function(face, fail, zfail, zpass){
            CWGL.cwgl_stencilOpSeparate(ctx, face, fail, zfail, zpass);
        },
        // 5.14.4 Viewing and clipping
        scissor: function(x, y, width, height){
            CWGL.cwgl_scissor(ctx, x, y, width, height);
        },
        viewport: function(x, y, width, height){
            CWGL.cwgl_viewport(ctx, x, y, width, height);
        },
        // 5.14.5 Buffer objects
        bindBuffer: function(target, buffer){
            trackbinding_buffer(target, buffer);
            if(! buffer){
                CWGL.cwgl_bindBuffer(ctx, target, Ref.NULL);
            }else{
                CWGL.cwgl_bindBuffer(ctx, target, buffer);
            }
        },
        bufferData: function(target, data_or_size, usage){
            if(Number.isInteger(data_or_size)){
                const size = data_or_size;
                CWGL.cwgl_bufferData(ctx, target, size, Ref.NULL, usage);
            }else{
                const data = data_or_size;
                CWGL.cwgl_bufferData(ctx, target, data.byteLength, data, usage);
            }
        },
        bufferSubData: function(target, offset, data){
            CWGL.cwgl_bufferSubData(ctx, target, offset, data, data.byteLength);
        },
        createBuffer: function(){
            let ptr = CWGL.cwgl_createBuffer(ctx);
            wrapPointer(ptr, bufferfree);
            return ptr;
        },
        deleteBuffer: function(buffer){
            CWGL.cwgl_deleteBuffer(ctx, buffer);
        },
        getBufferParameter: function(target, pname){
            let i0 = new Int32Array(1);
            const r = CWGL.cwgl_getBufferParameter_i1(ctx, target, pname, i0);
            if(r == 0){
                return i0[0];
            }else{
                return null;
            }
        },
        isBuffer: function(buffer){
            const r = CWGL.cwgl_isBuffer(ctx, buffer);
            if(r == 0){
                return false;
            }else{
                return true;
            }
        },
        // 5.14.6 Framebuffer objects
        bindFramebuffer: function(target, framebuffer){
            if(! framebuffer){
                CWGL.cwgl_bindFramebuffer(ctx, target, Ref.NULL);
            }else{
                CWGL.cwgl_bindFramebuffer(ctx, target, framebuffer);
            }
        },
        /* WebGLHandlesContextLoss */
        checkFramebufferStatus: function(target){
            return CWGL.cwgl_checkFramebufferStatus(ctx, target);
        },
        createFramebuffer: function(){
            let ptr = CWGL.cwgl_createFramebuffer(ctx);
            wrapPointer(ptr, framebufferfree);
            return ptr;
        },
        deleteFramebuffer: function(buffer){
            CWGL.cwgl_deleteFramebuffer(ctx, buffer);
        },
        framebufferRenderbuffer: function(target, attachment, renderbuffertarget, renderbuffer){
            if(attachment == E.DEPTH_STENCIL_ATTACHMENT){
                if(renderbuffer != shadowDepthRenderbuffer){
                    console.log("ORPHAN shadowStencilRenderbuffer...");
                    // Fallback
                    CWGL.cwgl_framebufferRenderbuffer(ctx, target, attachment, renderbuffertarget, renderbuffer);
                }else{
                    CWGL.cwgl_framebufferRenderbuffer(ctx, target, E.DEPTH_ATTACHMENT, renderbuffertarget, renderbuffer);
                    CWGL.cwgl_framebufferRenderbuffer(ctx, target, E.STENCIL_ATTACHMENT, renderbuffertarget, shadowStencilRenderbuffer);
                }
            }else{
                CWGL.cwgl_framebufferRenderbuffer(ctx, target, attachment, renderbuffertarget, renderbuffer);
            }
        },
        framebufferTexture2D: function(target, attachment, textarget, texture, level){
            CWGL.cwgl_framebufferTexture2D(ctx, target, attachment, textarget, texture, level);
        },
        getFramebufferAttachmentParameter(target, attachment, pname){
            const type = getenumtype(pname);
            if(type == "int"){
                let i0 = new Int32Array(1);
                const r = CWGL.cwgl_getFramebufferAttachmentParameter_i1(ctx, target, attachment, pname, i0);
                if(r == 0){
                    return i0[0];
                }else{
                    return null;
                }
            }else{
                throw "unimpl";
            }
        },
        /* WebGLHandlesContextLoss */
        isFramebuffer: function(framebuffer){
            const r = CWGL.cwgl_isFramebuffer(ctx, framebuffer);
            if(r == 0){
                return false;
            }else{
                return true;
            }
        },
        // 5.14.7 Renderbuffer objects
        bindRenderbuffer: function(target, renderbuffer){
            trackbinding_Renderbuffer(renderbuffer);
            if(! renderbuffer){
                CWGL.cwgl_bindRenderbuffer(ctx, target, Ref.NULL);
            }else{
                CWGL.cwgl_bindRenderbuffer(ctx, target, renderbuffer);
            }
        },
        createRenderbuffer: function(){
            let ptr = CWGL.cwgl_createRenderbuffer(ctx);
            wrapPointer(ptr, renderbufferfree);
            return ptr;
        },
        deleteRenderbuffer: function(renderbuffer){
            if(renderbuffer == shadowDepthRenderbuffer){
                CWGL.cwgl_deleteRenderbuffer(shadowStencilRenderbuffer);
                shadowDepthRenderbuffer = null;
                shadowStencilRenderbuffer = null;
            }
            CWGL.cwgl_deleteRenderbuffer(renderbuffer);
        },
        getRenderbufferParameter: function(target, pname){
            let i0 = new Int32Array(i);
            const r = CWGL.cwgl_getRenderbufferParameter(ctx, target, pname, i0);
            if(r == 0){
                return null;
            }else{
                return i0[0];
            }
        },
        /* WebGLHandlesContextLoss */
        isRenderbuffer(renderbuffer){
            const r = CWGL.cwgl_isRenderbuffer(ctx, renderbuffer);
            if(r == 0){
                return false;
            }else{
                return true;
            }
        },
        renderbufferStorage: function(target, internalformat, width, height){
            if(internalformat == E.DEPTH_STENCIL){
                let save_Renderbuffer = currentRenderbuffer;
                // FIXME: check restrictions
                CWGL.cwgl_renderbufferStorage(ctx, target, E.DEPTH_COMPONENT16, width, height);
                let shadow = CWGL.cwgl_createRenderbuffer(ctx);
                wrapPointer(shadow, renderbufferfree);
                CWGL.cwgl_bindRenderbuffer(ctx, E.RENDERBUFFER, shadow);
                CWGL.cwgl_renderbufferStorage(ctx, target, E.STENCIL_INDEX8, width, height);
                if(shadowStencilRenderbuffer){
                    console.log("LEAKED shadowStencil");
                }
                if(shadowDepthRenderbuffer){
                    console.log("LEAKED shadowDepth");
                }
                shadowDepthRenderbuffer = save_Renderbuffer;
                shadowStencilRenderbuffer = shadow;
                CWGL.cwgl_bindRenderbuffer(ctx, E.RENDERBUFFER, save_Renderbuffer);
            }else{
                CWGL.cwgl_renderbufferStorage(ctx, target, internalformat, width, height);
            }
        },
        // 5.14.8 Texture objects
        bindTexture: function(target, texture){
            trackbinding_texture(target, texture);
            if(! texture){
                CWGL.cwgl_bindTexture(ctx, target, Ref.NULL);
            }else{
                currentTexture = texture;
                CWGL.cwgl_bindTexture(ctx, target, texture);
            }
        },
        // compressedTexImage2D
        // compressedTexSubImage2D
        copyTexImage2D: function(target, level, internalformat, x, y, width, height, border){
            CWGL.cwgl_copyTexImage2D(ctx, target, level, internalformat, x, y, width, height, border);
        },
        copyTexSubImage2D: function(target, level, xoffset, yoffset, x, y, width, height){
            CWGL.cwgl_copyTexSubImage2D(ctx, target, level, xoffset, yoffset, x, y, width, height);
        },
        createTexture: function(){
            let ptr = CWGL.cwgl_createTexture(ctx);
            wrapPointer(ptr, texfree);
            return ptr;
        },
        deleteTexture: function(tex){
            CWGL.cwgl_deleteTexture(ctx, tex);
        },
        generateMipmap: function(target){
            CWGL.cwgl_generateMipmap(ctx, target);
        },
        getTexParameter: function(target, pname){
            let i0 = new Int32Array(i);
            const r = CWGL.cwgl_getTexParameter(ctx, target, pname, i0);
            if(r == 0){
                return null;
            }else{
                return i0[0];
            }
        },
        /* WebGLHandlesContextLoss */
        isTexture: function(texture){
            const r = CWGL.cwgl_isTexture(ctx, renderbuffer);
            if(r == 0){
                return false;
            }else{
                return true;
            }
        },
        texImage2D: function(target, level, internalformat, width, height, border, format, type, pixels){
            // FIXME: No TexImageSource variant
            if(pixels == null){
                CWGL.cwgl_texImage2D(ctx, target, level, internalformat, width, height, border, format, type, Ref.NULL, 0);
            }else{
                CWGL.cwgl_texImage2D(ctx, target, level, internalformat, width, height, border, format, type, pixels, pixels.byteLength);
            }
        },
        texParameterf: function(target, pname, param){
            CWGL.cwgl_texParameterf(ctx, target, pname, param);
        },
        texParameteri: function(target, pname, param){
            CWGL.cwgl_texParameteri(ctx, target, pname, param);
        },
        texSubImage2D: function(target, level, xoffset, yoffset, width, height, format, type, pixels){
            // FIXME: No TexImageSource variant
            CWGL.cwgl_texSubImage2D(ctx, target, level, xoffset, yoffset, width, height, format, type, pixels, pixels.byteLength);
        },
        // 5.14.9 Programs and Shaders
        attachShader: function(program, shader){
            CWGL.cwgl_attachShader(ctx, program, shader);
        },
        bindAttribLocation: function(program, index, name){
            CWGL.cwgl_bindAttribLocation(ctx, program, index, name);
        },
        compileShader: function(shader){
            CWGL.cwgl_compileShader(ctx, shader);
        },
        createProgram: function(){
            let ptr = CWGL.cwgl_createProgram(ctx);
            wrapPointer(ptr, programfree);
            return ptr;
        },
        createShader: function(type){
            let ptr = CWGL.cwgl_createShader(ctx, type);
            wrapPointer(ptr, shaderfree);
            return ptr;
        },
        deleteProgram: function(program){
            CWGL.cwgl_deleteProgram(ctx, program);
        },
        deleteShader: function(shader){
            CWGL.cwgl_deleteShader(ctx, shader);
        },
        detachShader: function(program, shader){
            CWGL.cwgl_detachShader(ctx, program, shader);
        },
        // getAttachedShaders
        getProgramParameter: function(program, pname){
            const type = getenumtype(pname);
            if(type == "int"){
                let i0 = new Int32Array(1);
                const r = CWGL.cwgl_getProgramParameter_i1(ctx, program, pname, i0);
                if(r == 0){
                    return i0[0];
                }else{
                    return null;
                }
            }else if(type == "bool"){
                let i0 = new Int32Array(1);
                const r = CWGL.cwgl_getProgramParameter_i1(ctx, program, pname, i0);
                if(r == 0){
                    return i0[0] == 0 ? false : true;
                }else{
                    return null;
                }
            }else{
                throw "unimpl";
            }
        },
        getProgramInfoLog: function(program){
            const s = CWGL.cwgl_getProgramInfoLog(ctx, program);
            const ssiz = CWGL.cwgl_string_size(ctx, s);
            const buf = new Uint8Array(ssiz);
            const r = CWGL.cwgl_string_read(ctx, s, buf, ssiz);
            CWGL.cwgl_string_release(ctx, s);
            if(r == 0){
                return Ref.readCString(buf, 0);
            }else{
                return null;
            }
        },
        getShaderParameter: function(shader, pname){
            const type = getenumtype(pname);
            if(type == "int"){
                let i0 = new Int32Array(1);
                const r = CWGL.cwgl_getShaderParameter_i1(ctx, shader, pname, i0);
                if(r == 0){
                    return i0[0];
                }else{
                    return null;
                }
            }else if(type == "bool"){
                let i0 = new Int32Array(1);
                const r = CWGL.cwgl_getShaderParameter_i1(ctx, shader, pname, i0);
                if(r == 0){
                    return i0[0] == 0 ? false : true;
                }else{
                    return null;
                }
            }else{
                throw "unimpl";
            }
        },
        getShaderPrecisionFormat: function(shadertype, precisiontype){
            let rangeMin = new Int32Array(1);
            let rangeMax = new Int32Array(1);
            let precision = new Int32Array(1);
            const r = CWGL.cwgl_getShaderPrecisionFormat(ctx, shadertype, precisiontype, rangeMin, rangeMax, precision);
            if(r == 0){
                return {
                    rangeMin: rangeMin[0],
                    rangeMax: rangeMax[0],
                    precision: precision[0]
                };
            }else{
                return null;
            }
        },
        getShaderInfoLog: function(shader){
            const s = CWGL.cwgl_getShaderInfoLog(ctx, shader);
            const ssiz = CWGL.cwgl_string_size(ctx, s);
            const buf = new Uint8Array(ssiz);
            const r = CWGL.cwgl_string_read(ctx, s, buf, ssiz);
            CWGL.cwgl_string_release(ctx, s);
            if(r == 0){
                return Ref.readCString(buf, 0);
            }else{
                return null;
            }
        },
        getShaderSource: function(shader){
            const s = CWGL.cwgl_getShaderSource(ctx, shader);
            const ssiz = CWGL.cwgl_string_size(ctx, s);
            const buf = new Uint8Array(ssiz);
            const r = CWGL.cwgl_string_read(ctx, s, buf, ssiz);
            CWGL.cwgl_string_release(ctx, s);
            if(r == 0){
                return Ref.readCString(buf, 0);
            }else{
                return null;
            }
        },
        /* WebGLHandlesContextLoss */
        isProgram: function(program){
            const r = CWGL.cwgl_isProgram(ctx, program);
            if(r == 0){
                return false;
            }else{
                return true;
            }
        },
        /* WebGLHandlesContextLoss */
        isShader: function(shader){
            const r = CWGL.cwgl_isShader(ctx, shader);
            if(r == 0){
                return false;
            }else{
                return true;
            }
        },
        linkProgram: function(program){
            CWGL.cwgl_linkProgram(ctx, program);
        },
        shaderSource: function(shader, source){
            // FIXME: Is it okay to use length here..?
            CWGL.cwgl_shaderSource(ctx, shader, source, source.length);
        },
        useProgram: function(program){
            trackbinding_program(program);
            CWGL.cwgl_useProgram(ctx, program);
        },
        validateProgram: function(program){
            CWGL.cwgl_validateProgram(ctx, program);
        },
        // 5.14.10 Uniforms and attributes
        disableVertexAttribArray: function(index){
            CWGL.cwgl_disableVertexAttribArray(ctx, index);
        },
        enableVertexAttribArray: function(index){
            CWGL.cwgl_enableVertexAttribArray(ctx, index);
        },
        // getActiveAttrib
        getActiveUniform: function(program, index){
            let p0 = Ref.alloc(Ref.refType(Ref.types.void));
            let i0 = new Int32Array(1);
            let i1 = new Int32Array(1);
            const r = CWGL.cwgl_getActiveUniform(ctx, program, index, i0, i1, p0);
            if(r == 0){
                const s = p0.deref();
                const ssiz = CWGL.cwgl_string_size(ctx, s);
                const buf = new Uint8Array(ssiz);
                CWGL.cwgl_string_read(ctx, s, buf, ssiz);
                CWGL.cwgl_string_release(ctx, s);
                const name = Ref.readCString(buf, 0);
                return {
                    size: i0[0],
                    type: i1[0],
                    name: name
                };
            }else{
                return null;
            }
        },
        getAttribLocation: function(program, name){
            return CWGL.cwgl_getAttribLocation(ctx, program, name);
        },
        // getUniform
        getUniformLocation: function(program, name){
            let ptr = CWGL.cwgl_getUniformLocation(ctx, program, name);
            wrapPointer(ptr, uniformlocationfree);
            return ptr;
        },
        // getVertexAttrib
        /* WebGLHandlesContextLoss */
        // getVertexAttribOffset
        uniform1f: function(loc, x){
            CWGL.cwgl_uniform1f(ctx, loc, x);
        },
        uniform2f: function(loc, x, y){
            CWGL.cwgl_uniform2f(ctx, loc, x, y);
        },
        uniform3f: function(loc, x, y, z){
            CWGL.cwgl_uniform3f(ctx, loc, x, y, z);
        },
        uniform4f: function(loc, x, y, z, w){
            CWGL.cwgl_uniform4f(ctx, loc, x, y, z, w);
        },
        uniform1i: function(loc, x){
            CWGL.cwgl_uniform1i(ctx, loc, x);
        },
        uniform2i: function(loc, x, y){
            CWGL.cwgl_uniform2i(ctx, loc, x, y);
        },
        uniform3i: function(loc, x, y, z){
            CWGL.cwgl_uniform3i(ctx, loc, x, y, z);
        },
        uniform4i: function(loc, x, y, z, w){
            CWGL.cwgl_uniform4i(ctx, loc, x, y, z, w);
        },
        uniform1fv: function(loc, v){
            CWGL.cwgl_uniform1fv(ctx, loc, v, v.length);
        },
        uniform2fv: function(loc, v){
            CWGL.cwgl_uniform2fv(ctx, loc, v, v.length / 2);
        },
        uniform3fv: function(loc, v){
            CWGL.cwgl_uniform3fv(ctx, loc, v, v.length / 3);
        },
        uniform4fv: function(loc, v){
            CWGL.cwgl_uniform4fv(ctx, loc, v, v.length / 4);
        },
        uniform1iv: function(loc, v){
            CWGL.cwgl_uniform1iv(ctx, loc, v, v.length);
        },
        uniform2iv: function(loc, v){
            CWGL.cwgl_uniform2iv(ctx, loc, v, v.length / 2);
        },
        uniform3iv: function(loc, v){
            CWGL.cwgl_uniform3iv(ctx, loc, v, v.length / 3);
        },
        uniform4iv: function(loc, v){
            CWGL.cwgl_uniform4iv(ctx, loc, v, v.length / 4);
        },
        uniformMatrix2fv: function(loc, transpose, v){
            const t = transpose ? 1 : 0;
            const cnt = v.length / 4;
            CWGL.cwgl_uniformMatrix2fv(ctx, loc, t, v, cnt);
        },
        uniformMatrix3fv: function(loc, transpose, v){
            const t = transpose ? 1 : 0;
            const cnt = v.length / 9;
            CWGL.cwgl_uniformMatrix3fv(ctx, loc, t, v, cnt);
        },
        uniformMatrix4fv: function(loc, transpose, v){
            const t = transpose ? 1 : 0;
            const cnt = v.length / 16;
            CWGL.cwgl_uniformMatrix4fv(ctx, loc, t, v, cnt);
        },
        vertexAttrib1f: function(index, x){
            CWGL.cwgl_vertexAttrib1f(ctx, index, x);
        },
        vertexAttrib2f: function(index, x, y){
            CWGL.cwgl_vertexAttrib2f(ctx, index, x, y);
        },
        vertexAttrib3f: function(index, x, y, z){
            CWGL.cwgl_vertexAttrib3f(ctx, index, x, y, z);
        },
        vertexAttrib4f: function(index, x, y, z, w){
            CWGL.cwgl_vertexAttrib4f(ctx, index, x, y, z, w);
        },
        vertexAttrib1fv: function(index, v){
            CWGL.cwgl_vertexAttrib1f(ctx, index, v[0]);
        },
        vertexAttrib2fv: function(index, v){
            CWGL.cwgl_vertexAttrib2f(ctx, index, v[0], v[1]);
        },
        vertexAttrib3fv: function(index, v){
            CWGL.cwgl_vertexAttrib3f(ctx, index, v[0], v[1], v[2]);
        },
        vertexAttrib4fv: function(index, v){
            CWGL.cwgl_vertexAttrib4f(ctx, index, v[0], v[1], v[2], v[3]);
        },
        vertexAttribPointer: function(index, size, type, normalized, stride, offset){
            const n = normalized ? 1 : 0;
            CWGL.cwgl_vertexAttribPointer(ctx, index, size, type, n, stride, offset);
        },
        // 5.14.11 Writing to the drawing buffer
        clear: function(mask){
            CWGL.cwgl_clear(ctx, mask);
        },
        drawArrays: function(mode, first, count){
            CWGL.cwgl_drawArrays(ctx, mode, first, count);
        },
        drawElements: function(mode, count, type, offset){
            CWGL.cwgl_drawElements(ctx, mode, count, type, offset);
        },
        finish: function(){
            CWGL.cwgl_finish(ctx);
        },
        flush: function(){
            CWGL.cwgl_flush(ctx);
        },
        // 5.14.12 Reading back pixels
        readPixels: function(x, y, width, height, format, type, pixels){
            CWGL.cwgl_readPixels(ctx, x, y, width, height, format, type, pixels, pixels.byteLength);
        },
        // 5.14.13 Detecting context lost events
        /* WebGLHandlesContextLoss */
        isContextLost: function(){
            return false;
        },
        // 5.14.14 Detecting and enabling extensions
        getSupportedExtensions: function(){
            return [];
        },
        getExtension: function(name){
            return null;
        },

        // Enums
        DEPTH_BUFFER_BIT: 0x00000100,
        STENCIL_BUFFER_BIT: 0x00000400,
        COLOR_BUFFER_BIT: 0x00004000,
        POINTS: 0x0000,
        LINES: 0x0001,
        LINE_LOOP: 0x0002,
        LINE_STRIP: 0x0003,
        TRIANGLES: 0x0004,
        TRIANGLE_STRIP: 0x0005,
        TRIANGLE_FAN: 0x0006,
        ZERO: 0,
        ONE: 1,
        SRC_COLOR: 0x0300,
        ONE_MINUS_SRC_COLOR: 0x0301,
        SRC_ALPHA: 0x0302,
        ONE_MINUS_SRC_ALPHA: 0x0303,
        DST_ALPHA: 0x0304,
        ONE_MINUS_DST_ALPHA: 0x0305,
        DST_COLOR: 0x0306,
        ONE_MINUS_DST_COLOR: 0x0307,
        SRC_ALPHA_SATURATE: 0x0308,
        FUNC_ADD: 0x8006,
        BLEND_EQUATION: 0x8009,
        BLEND_EQUATION_RGB: 0x8009,
        BLEND_EQUATION_ALPHA: 0x883D,
        FUNC_SUBTRACT: 0x800A,
        FUNC_REVERSE_SUBTRACT: 0x800B,
        BLEND_DST_RGB: 0x80C8,
        BLEND_SRC_RGB: 0x80C9,
        BLEND_DST_ALPHA: 0x80CA,
        BLEND_SRC_ALPHA: 0x80CB,
        CONSTANT_COLOR: 0x8001,
        ONE_MINUS_CONSTANT_COLOR: 0x8002,
        CONSTANT_ALPHA: 0x8003,
        ONE_MINUS_CONSTANT_ALPHA: 0x8004,
        BLEND_COLOR: 0x8005,
        ARRAY_BUFFER: 0x8892,
        ELEMENT_ARRAY_BUFFER: 0x8893,
        ARRAY_BUFFER_BINDING: 0x8894,
        ELEMENT_ARRAY_BUFFER_BINDING: 0x8895,
        STREAM_DRAW: 0x88E0,
        STATIC_DRAW: 0x88E4,
        DYNAMIC_DRAW: 0x88E8,
        BUFFER_SIZE: 0x8764,
        BUFFER_USAGE: 0x8765,
        CURRENT_VERTEX_ATTRIB: 0x8626,
        FRONT: 0x0404,
        BACK: 0x0405,
        FRONT_AND_BACK: 0x0408,
        CULL_FACE: 0x0B44,
        BLEND: 0x0BE2,
        DITHER: 0x0BD0,
        STENCIL_TEST: 0x0B90,
        DEPTH_TEST: 0x0B71,
        SCISSOR_TEST: 0x0C11,
        POLYGON_OFFSET_FILL: 0x8037,
        SAMPLE_ALPHA_TO_COVERAGE: 0x809E,
        SAMPLE_COVERAGE: 0x80A0,
        NO_ERROR: 0,
        INVALID_ENUM: 0x0500,
        INVALID_VALUE: 0x0501,
        INVALID_OPERATION: 0x0502,
        OUT_OF_MEMORY: 0x0505,
        CW: 0x0900,
        CCW: 0x0901,
        LINE_WIDTH: 0x0B21,
        ALIASED_POINT_SIZE_RANGE: 0x846D,
        ALIASED_LINE_WIDTH_RANGE: 0x846E,
        CULL_FACE_MODE: 0x0B45,
        FRONT_FACE: 0x0B46,
        DEPTH_RANGE: 0x0B70,
        DEPTH_WRITEMASK: 0x0B72,
        DEPTH_CLEAR_VALUE: 0x0B73,
        DEPTH_FUNC: 0x0B74,
        STENCIL_CLEAR_VALUE: 0x0B91,
        STENCIL_FUNC: 0x0B92,
        STENCIL_FAIL: 0x0B94,
        STENCIL_PASS_DEPTH_FAIL: 0x0B95,
        STENCIL_PASS_DEPTH_PASS: 0x0B96,
        STENCIL_REF: 0x0B97,
        STENCIL_VALUE_MASK: 0x0B93,
        STENCIL_WRITEMASK: 0x0B98,
        STENCIL_BACK_FUNC: 0x8800,
        STENCIL_BACK_FAIL: 0x8801,
        STENCIL_BACK_PASS_DEPTH_FAIL: 0x8802,
        STENCIL_BACK_PASS_DEPTH_PASS: 0x8803,
        STENCIL_BACK_REF: 0x8CA3,
        STENCIL_BACK_VALUE_MASK: 0x8CA4,
        STENCIL_BACK_WRITEMASK: 0x8CA5,
        VIEWPORT: 0x0BA2,
        SCISSOR_BOX: 0x0C10,
        COLOR_CLEAR_VALUE: 0x0C22,
        COLOR_WRITEMASK: 0x0C23,
        UNPACK_ALIGNMENT: 0x0CF5,
        PACK_ALIGNMENT: 0x0D05,
        MAX_TEXTURE_SIZE: 0x0D33,
        MAX_VIEWPORT_DIMS: 0x0D3A,
        SUBPIXEL_BITS: 0x0D50,
        RED_BITS: 0x0D52,
        GREEN_BITS: 0x0D53,
        BLUE_BITS: 0x0D54,
        ALPHA_BITS: 0x0D55,
        DEPTH_BITS: 0x0D56,
        STENCIL_BITS: 0x0D57,
        POLYGON_OFFSET_UNITS: 0x2A00,
        POLYGON_OFFSET_FACTOR: 0x8038,
        TEXTURE_BINDING_2D: 0x8069,
        SAMPLE_BUFFERS: 0x80A8,
        SAMPLES: 0x80A9,
        SAMPLE_COVERAGE_VALUE: 0x80AA,
        SAMPLE_COVERAGE_INVERT: 0x80AB,
        COMPRESSED_TEXTURE_FORMATS: 0x86A3,
        DONT_CARE: 0x1100,
        FASTEST: 0x1101,
        NICEST: 0x1102,
        GENERATE_MIPMAP_HINT: 0x8192,
        BYTE: 0x1400,
        UNSIGNED_BYTE: 0x1401,
        SHORT: 0x1402,
        UNSIGNED_SHORT: 0x1403,
        INT: 0x1404,
        UNSIGNED_INT: 0x1405,
        FLOAT: 0x1406,
        DEPTH_COMPONENT: 0x1902,
        ALPHA: 0x1906,
        RGB: 0x1907,
        RGBA: 0x1908,
        LUMINANCE: 0x1909,
        LUMINANCE_ALPHA: 0x190A,
        UNSIGNED_SHORT_4_4_4_4: 0x8033,
        UNSIGNED_SHORT_5_5_5_1: 0x8034,
        UNSIGNED_SHORT_5_6_5: 0x8363,
        FRAGMENT_SHADER: 0x8B30,
        VERTEX_SHADER: 0x8B31,
        MAX_VERTEX_ATTRIBS: 0x8869,
        MAX_VERTEX_UNIFORM_VECTORS: 0x8DFB,
        MAX_VARYING_VECTORS: 0x8DFC,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8B4D,
        MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8B4C,
        MAX_TEXTURE_IMAGE_UNITS: 0x8872,
        MAX_FRAGMENT_UNIFORM_VECTORS: 0x8DFD,
        SHADER_TYPE: 0x8B4F,
        DELETE_STATUS: 0x8B80,
        LINK_STATUS: 0x8B82,
        VALIDATE_STATUS: 0x8B83,
        ATTACHED_SHADERS: 0x8B85,
        ACTIVE_UNIFORMS: 0x8B86,
        ACTIVE_ATTRIBUTES: 0x8B89,
        SHADING_LANGUAGE_VERSION: 0x8B8C,
        CURRENT_PROGRAM: 0x8B8D,
        NEVER: 0x0200,
        LESS: 0x0201,
        EQUAL: 0x0202,
        LEQUAL: 0x0203,
        GREATER: 0x0204,
        NOTEQUAL: 0x0205,
        GEQUAL: 0x0206,
        ALWAYS: 0x0207,
        KEEP: 0x1E00,
        REPLACE: 0x1E01,
        INCR: 0x1E02,
        DECR: 0x1E03,
        INVERT: 0x150A,
        INCR_WRAP: 0x8507,
        DECR_WRAP: 0x8508,
        VENDOR: 0x1F00,
        RENDERER: 0x1F01,
        VERSION: 0x1F02,
        NEAREST: 0x2600,
        LINEAR: 0x2601,
        NEAREST_MIPMAP_NEAREST: 0x2700,
        LINEAR_MIPMAP_NEAREST: 0x2701,
        NEAREST_MIPMAP_LINEAR: 0x2702,
        LINEAR_MIPMAP_LINEAR: 0x2703,
        TEXTURE_MAG_FILTER: 0x2800,
        TEXTURE_MIN_FILTER: 0x2801,
        TEXTURE_WRAP_S: 0x2802,
        TEXTURE_WRAP_T: 0x2803,
        TEXTURE_2D: 0x0DE1,
        TEXTURE: 0x1702,
        TEXTURE_CUBE_MAP: 0x8513,
        TEXTURE_BINDING_CUBE_MAP: 0x8514,
        TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515,
        TEXTURE_CUBE_MAP_NEGATIVE_X: 0x8516,
        TEXTURE_CUBE_MAP_POSITIVE_Y: 0x8517,
        TEXTURE_CUBE_MAP_NEGATIVE_Y: 0x8518,
        TEXTURE_CUBE_MAP_POSITIVE_Z: 0x8519,
        TEXTURE_CUBE_MAP_NEGATIVE_Z: 0x851A,
        MAX_CUBE_MAP_TEXTURE_SIZE: 0x851C,
        TEXTURE0: 0x84C0,
        TEXTURE1: 0x84C1,
        TEXTURE2: 0x84C2,
        TEXTURE3: 0x84C3,
        TEXTURE4: 0x84C4,
        TEXTURE5: 0x84C5,
        TEXTURE6: 0x84C6,
        TEXTURE7: 0x84C7,
        TEXTURE8: 0x84C8,
        TEXTURE9: 0x84C9,
        TEXTURE10: 0x84CA,
        TEXTURE11: 0x84CB,
        TEXTURE12: 0x84CC,
        TEXTURE13: 0x84CD,
        TEXTURE14: 0x84CE,
        TEXTURE15: 0x84CF,
        TEXTURE16: 0x84D0,
        TEXTURE17: 0x84D1,
        TEXTURE18: 0x84D2,
        TEXTURE19: 0x84D3,
        TEXTURE20: 0x84D4,
        TEXTURE21: 0x84D5,
        TEXTURE22: 0x84D6,
        TEXTURE23: 0x84D7,
        TEXTURE24: 0x84D8,
        TEXTURE25: 0x84D9,
        TEXTURE26: 0x84DA,
        TEXTURE27: 0x84DB,
        TEXTURE28: 0x84DC,
        TEXTURE29: 0x84DD,
        TEXTURE30: 0x84DE,
        TEXTURE31: 0x84DF,
        ACTIVE_TEXTURE: 0x84E0,
        REPEAT: 0x2901,
        CLAMP_TO_EDGE: 0x812F,
        MIRRORED_REPEAT: 0x8370,
        FLOAT_VEC2: 0x8B50,
        FLOAT_VEC3: 0x8B51,
        FLOAT_VEC4: 0x8B52,
        INT_VEC2: 0x8B53,
        INT_VEC3: 0x8B54,
        INT_VEC4: 0x8B55,
        BOOL: 0x8B56,
        BOOL_VEC2: 0x8B57,
        BOOL_VEC3: 0x8B58,
        BOOL_VEC4: 0x8B59,
        FLOAT_MAT2: 0x8B5A,
        FLOAT_MAT3: 0x8B5B,
        FLOAT_MAT4: 0x8B5C,
        SAMPLER_2D: 0x8B5E,
        SAMPLER_CUBE: 0x8B60,
        VERTEX_ATTRIB_ARRAY_ENABLED: 0x8622,
        VERTEX_ATTRIB_ARRAY_SIZE: 0x8623,
        VERTEX_ATTRIB_ARRAY_STRIDE: 0x8624,
        VERTEX_ATTRIB_ARRAY_TYPE: 0x8625,
        VERTEX_ATTRIB_ARRAY_NORMALIZED: 0x886A,
        VERTEX_ATTRIB_ARRAY_POINTER: 0x8645,
        VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: 0x889F,
        IMPLEMENTATION_COLOR_READ_TYPE: 0x8B9A,
        IMPLEMENTATION_COLOR_READ_FORMAT: 0x8B9B,
        COMPILE_STATUS: 0x8B81,
        LOW_FLOAT: 0x8DF0,
        MEDIUM_FLOAT: 0x8DF1,
        HIGH_FLOAT: 0x8DF2,
        LOW_INT: 0x8DF3,
        MEDIUM_INT: 0x8DF4,
        HIGH_INT: 0x8DF5,
        FRAMEBUFFER: 0x8D40,
        RENDERBUFFER: 0x8D41,
        RGBA4: 0x8056,
        RGB5_A1: 0x8057,
        RGB565: 0x8D62,
        DEPTH_COMPONENT16: 0x81A5,
        STENCIL_INDEX8: 0x8D48,
        DEPTH_STENCIL: 0x84F9,
        RENDERBUFFER_WIDTH: 0x8D42,
        RENDERBUFFER_HEIGHT: 0x8D43,
        RENDERBUFFER_INTERNAL_FORMAT: 0x8D44,
        RENDERBUFFER_RED_SIZE: 0x8D50,
        RENDERBUFFER_GREEN_SIZE: 0x8D51,
        RENDERBUFFER_BLUE_SIZE: 0x8D52,
        RENDERBUFFER_ALPHA_SIZE: 0x8D53,
        RENDERBUFFER_DEPTH_SIZE: 0x8D54,
        RENDERBUFFER_STENCIL_SIZE: 0x8D55,
        FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: 0x8CD0,
        FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: 0x8CD1,
        FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: 0x8CD2,
        FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: 0x8CD3,
        COLOR_ATTACHMENT0: 0x8CE0,
        DEPTH_ATTACHMENT: 0x8D00,
        STENCIL_ATTACHMENT: 0x8D20,
        DEPTH_STENCIL_ATTACHMENT: 0x821A,
        NONE: 0,
        FRAMEBUFFER_COMPLETE: 0x8CD5,
        FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 0x8CD6,
        FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 0x8CD7,
        FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 0x8CD9,
        FRAMEBUFFER_UNSUPPORTED: 0x8CDD,
        FRAMEBUFFER_BINDING: 0x8CA6,
        RENDERBUFFER_BINDING: 0x8CA7,
        MAX_RENDERBUFFER_SIZE: 0x84E8,
        INVALID_FRAMEBUFFER_OPERATION: 0x0506,
        UNPACK_FLIP_Y_WEBGL: 0x9240,
        UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
        CONTEXT_LOST_WEBGL: 0x9242,
        UNPACK_COLORSPACE_CONVERSION_WEBGL: 0x9243,
        BROWSER_DEFAULT_WEBGL: 0x9244,

    };
}

CWGL.cwgl_init();

module.exports = GL;
