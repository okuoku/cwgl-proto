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
            CWGL.cwgl_stencilOpSeparate(ctx, face, fail, zefail, zpass);
        },
        // 5.14.4 Viewing and clipping
        scissor: function(x, y, width, height){
            CWGL.cwgl_scissor(ctx, x, y, width, height);
        },
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
