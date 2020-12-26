const DLLPATH = "../out/build/x64-Debug/cwgl.dll";
const FFI = require("ffi-napi");
const REF = require("ref-napi");

// Types
const cwglCtx = REF.refType(REF.types.void);
const cwglString = REF.refType(REF.types.void);
const cwglBuffer = REF.refType(REF.types.void);
const cwglShader = REF.refType(REF.types.void);
const cwglProgram = REF.refType(REF.types.void);
const cwglTexture = REF.refType(REF.types.void);
const cwglFramebuffer = REF.refType(REF.types.void);
const cwglRenderbuffer = REF.refType(REF.types.void);
const cwglUniformLocation = REF.refType(REF.types.void);

function genlibdef() {
    const Int = "int";
    const Float = "float";
    const _ = "void";
    const C = cwglCtx;
    return {
        /* Context, Platform */
        cwgl_init: [Int, []],
        cwgl_terminate: [_, []],
        cwgl_ctx_create: [C, [Int,Int,Int,Int]],
        cwgl_ctx_release: [_, [C]],
        cwgl_ctx_frame_begin: [_, [C]],
        cwgl_ctx_frame_end: [_, [C]],

        /* Heap Objects */
        // FIXME: String
        cwgl_Buffer_release: [_, [cwglBuffer]],
        cwgl_Shader_release: [_, [cwglShader]],
        cwgl_Program_release: [_, [cwglProgram]],
        cwgl_Texture_release: [_, [cwglTexture]],
        //cwgl_Framebuffer_release: [_, [cwglFramebuffer]], // FIXME:
        cwgl_Renderbuffer_release: [_, [cwglRenderbuffer]],
        cwgl_UniformLocation_release: [_, [cwglUniformLocation]],

        /* Context, Platform */
        // cwgl_getContextAttributes: [Int, [C]],
        // cwgl_isContextLost: [Int, [C]],
        // cwgl_getSupportedExtensions
        // getExtension

        /* OpenGL State */
        cwgl_disable: [_, [C, Int]],
        cwgl_enable: [_, [C, Int]],

        // 2.5 GL Errors
        cwgl_getError: [Int, [C]],

        // 2.7 Current Vertex State
        cwgl_vertexAttrib1f: [_, [C, Int, Float]],
        cwgl_vertexAttrib2f: [_, [C, Int, Float, Float]],
        cwgl_vertexAttrib3f: [_, [C, Int, Float, Float, Float]],
        cwgl_vertexAttrib4f: [_, [C, Int, Float, Float, Float, Float]],

        // 2.8 Vertex Arrays
        cwgl_vertexAttribPointer: [_, [C, Int, Int, Int, Int, Int, Int]],
        cwgl_enableVertexAttribArray: [_, [C, Int]],
        cwgl_disableVertexAttribArray: [_, [C, Int]],
        cwgl_drawArrays: [_, [C, Int, Int]],
        cwgl_drawElements: [_, [C, Int, Int, Int, Int]],

        // 2.9 Buffer Objects
        cwgl_bindBuffer: [_, [C, Int, cwglBuffer]],
        cwgl_deleteBuffer: [_, [C, cwglBuffer]],
        cwgl_createBuffer: [cwglBuffer, [C]],
        cwgl_bufferData: [_, [C, Int, Int, "void *", Int]],
        cwgl_bufferSubData: [_, [C, Int, Int, "void *", Int]],

        // 2.10.1 Loading and Creating Shader Source
        cwgl_createShader: [cwglShader, [C, Int]],
        cwgl_shaderSource: [_, [C, cwglShader, "string", Int]],
        cwgl_compileShader: [_, [C, cwglShader]],
        cwgl_deleteShader: [_, [C, cwglShader]],

        // 2.10.3 Program Objects
        cwgl_createProgram: [cwglProgram, [C]],
        cwgl_attachShader: [_, [C, cwglProgram, cwglShader]],
        cwgl_detachShader: [_, [C, cwglProgram, cwglShader]],
        cwgl_linkProgram: [_, [C, cwglProgram]],
        cwgl_useProgram: [_, [C, cwglProgram]],
        cwgl_deleteProgram: [_, [C, cwglProgram]],

        // 2.10.4 Shader Variables
        // cwgl_getActiveAttrib: FIXME:
        cwgl_getAttribLocation: [Int, [C, cwglProgram, "string"]],
        cwgl_bindAttribLocation: [_, [C, cwglProgram, Int, "string"]],
        cwgl_getUniformLocation: [cwglUniformLocation, [C, cwglProgram, "string"]],
        // cwgl_getActiveUniform: FIXME:
        // FIXME: UNIFORMS

        // 2.10.5 Shader Execution
        cwgl_validateProgram: [_, [C, cwglProgram]],

        // 2.12.1 Controlling the Viewport
        cwgl_depthRange: [_, [C, Float, Float]],
        cwgl_viewport: [_, [C, Int,Int,Int,Int]],

        // 3.4 Line Segments
        cwgl_lineWidth: [_, [C, Float]],

        // 3.5 Polygons
        cwgl_frontFace: [_, [C, Int]],
        cwgl_cullFace: [_, [C, Int]],

        // 3.5.2 Depth offset
        cwgl_polygonOffset: [_, [C, Float, Float]],

        // 3.6.1 Pixel Storage Modes
        cwgl_pixelStorei: [_, [C, Int, Int]],

        // 3.7 Texturing
        cwgl_activeTexture: [_, [C, Int]],

        // 3.7.1 Texture Image Specification
        cwgl_texImage2D: [_, [C, Int, Int, Int, Int, Int, Int, Int, Int, "void *", Int]],

        // 3.7.2 Alternate Texture Image Specification Commands
        cwgl_copyTexImage2D: [_, [C, Int, Int, Int, Int, Int, Int, Int, Int]],
        cwgl_texSubImage2D: [_, [C, Int, Int, Int, Int, Int, Int, Int, Int, "void *", Int]],
        cwgl_copyTexSubImage2D: [_, [C, Int, Int, Int, Int, Int, Int, Int, Int]],

        // 3.7.3 Compressed Texture Images
        cwgl_compressedTexImage2D: [_, [C, Int, Int, Int, Int, Int, Int, "void *", Int]],
        cwgl_compressedTexSubImage2D: [_, [C, Int, Int, Int, Int, Int, Int, Int, "void *", Int]],

        // 3.7.4 Texture Parameters
        cwgl_texParameterf: [_, [C, Int, Int, Float]],
        cwgl_texParameteri: [_, [C, Int, Int, Int]],

        // 3.7.11 Mipmap Generation
        cwgl_generateMipmap: [_, [C, Int]],

        // 3.7.13 Texture Objects
        cwgl_bindTexture: [_, [C, Int, cwglTexture]],
        cwgl_deleteTexture: [_, [C, cwglTexture]],
        cwgl_createTexture: [cwglTexture, [C]],

        // 4.1.2 Scissor Test
        cwgl_scissor: [_, [C, Int, Int, Int, Int]],

        // 4.1.3 Multisample Fragment Operations
        cwgl_sampleCoverage: [_, [C, Float, Int]],

        // 4.1.4 Stencil Test
        cwgl_stencilFunc: [_, [C, Int, Int, Int]],
        cwgl_stencilFuncSeparate: [_, [C, Int, Int, Int, Int]],
        cwgl_stencilOp: [_, [C, Int, Int, Int]],
        cwgl_stencilOpSeparate: [_, [C, Int, Int, Int, Int]],

        // 4.1.5 Depth Buffer Test
        cwgl_depthFunc: [_, [C, Int]],

        // 4.1.6 Blending
        cwgl_blendEquation: [_, [C, Int]],
        cwgl_blendEquationSeparate: [_, [C, Int, Int]],
        cwgl_blendFuncSeparate: [_, [C, Int, Int, Int, Int]],
        cwgl_blendFunc: [_, [C, Int, Int]],
        cwgl_blendColor: [_, [C, Float, Float, Float, Float]],

        // 4.2.2 Fine Control of Buffer Updates
        cwgl_colorMask: [_, [C, Int, Int, Int, Int]],
        cwgl_depthMask: [_, [C, Int]],
        cwgl_stencilMask: [_, [C, Int]],
        cwgl_stencilMaskSeparate: [_, [C, Int, Int]],

        // 4.2.3 Clearing the Buffers
        cwgl_clear: [_, [C, Int]],
        cwgl_clearColor: [_, [C, Float, Float, Float, Float]],
        cwgl_clearDepth: [_, [C, Float]],
        cwgl_clearStencil: [_, [C, Int]],

        // 4.3.1 Reading Pixels
        cwgl_readPixels: [_, [C, Int, Int, Int, Int, Int, Int, "void *", Int]],

        // 4.4.1 Binding and Managing Framebuffer Objects
        cwgl_bindFramebuffer: [_, [C, Int, cwglFramebuffer]],
        cwgl_deleteFramebuffer: [_, [C, cwglFramebuffer]],
        cwgl_createFramebuffer: [cwglFramebuffer, [C]],

        // 4.4.3 Renderbuffer Objects
        cwgl_bindRenderbuffer: [_, [C, Int, cwglRenderbuffer]],
        cwgl_deleteRenderbuffer: [_, [C, cwglRenderbuffer]],
        cwgl_createRenderbuffer: [cwglRenderbuffer, [C]],
        cwgl_renderbufferStorage: [_, [C, Int, Int, Int, Int]],
        cwgl_framebufferRenderbuffer: [_, [C, Int, Int, Int, cwglRenderbuffer]],
        cwgl_framebufferTexture2D: [_, [C, Int, Int, Int, cwglTexture, Int]],

        // 4.4.5 Framebuffer Completeness
        cwgl_checkFramebufferStatus: [Int, [C, Int]],

        // 5.1 Flush and Finish
        cwgl_finish: [_, [C]],
        cwgl_flush: [_, [C]],

        // 5.2 Hints
        cwgl_hint: [_, [C, Int, Int]],

        // 6.1.1 Simple Queries
        cwgl_getParameter_b1: [Int, [C, Int, "void *"]],
        cwgl_getParameter_b4: [Int, [C, Int, "void *", "void *", "void *", "void *"]],
        cwgl_getParameter_i1: [Int, [C, Int, "void *"]],
        cwgl_getParameter_i2: [Int, [C, Int, "void *", "void *"]],
        cwgl_getParameter_i4: [Int, [C, Int, "void *", "void *", "void *", "void *"]],
        cwgl_getParameter_f1: [Int, [C, Int, "void *"]],
        cwgl_getParameter_f4: [Int, [C, Int, "void *", "void *", "void *", "void *"]],
        cwgl_getParameter_str: [Int, [C, Int, "void *"]],
        cwgl_getParameter_Buffer: [Int, [C, Int, "void *"]],
        cwgl_getParameter_Program: [Int, [C, Int, "void *"]],
        cwgl_getParameter_Framebuffer: [Int, [C, Int, "void *"]],
        cwgl_getParameter_Renderbuffer: [Int, [C, Int, "void *"]],
        cwgl_getParameter_Texture: [Int, [C, Int, "void *"]],
        // 6.1.3 Enumerated Queries
        cwgl_getTexParameter_i1: [Int, [C, Int, Int, "void *"]],
        cwgl_getBufferParameter_i1: [Int, [C, Int, Int, "void *"]],
        cwgl_getFramebufferAttachmentParameter_i1: [Int, [C, Int, Int, Int, "void *"]],
        cwgl_getFramebufferAttachmentParameter_Renderbuffer: [Int, [C, Int, Int, Int, "void *"]],
        cwgl_getFramebufferAttachmentParameter_Texture: [Int, [C, Int, Int, Int, "void *"]],
        cwgl_getRenderbufferParameter_i1: [Int, [C, Int, Int, "void *"]],

        // 6.1.4 Texture Queries
        cwgl_isTexture: [Int, [C, cwglTexture]],
        // 6.1.6 Buffer Object Queries
        cwgl_isBuffer: [Int, [C, cwglBuffer]],
        // 6.1.7 Framebuffer Object and Renderbuffer Queries
        cwgl_isFramebuffer: [Int, [C, cwglFramebuffer]],
        cwgl_isRenderbuffer: [Int, [C, cwglRenderbuffer]],

        // 6.1.8 Shader and Program Queries
        cwgl_isShader: [Int, [C, cwglShader]],
        cwgl_getShaderParameter_i1: [Int, [C, cwglShader, Int, "void *"]],
        cwgl_isProgram: [Int, [C, cwglProgram]],
        cwgl_getProgramParameter_i1: [Int, [C, cwglProgram, Int, "void *"]]
        // cwgl_getAttachedShaders FIXME: Implement readback
        // cwgl_getProgramInfoLog
        // cwgl_getShaderInfoLog
        // cwgl_getShaderSource
        // cwgl_getShaderPrecisionFormat
        // cwgl_getVertexAttrib_i1
        // cwgl_getVertexAttrib_f4
        // cwgl_getVertexAttrib_Buffer
        // cwgl_getVertexAttribOffset
        // cwgl_getUniform_i1
        // cwgl_getUniform_i2
        // cwgl_getUniform_i3
        // cwgl_getUniform_i4
        // cwgl_getUniform_f1
        // cwgl_getUniform_f2
        // cwgl_getUniform_f3
        // cwgl_getUniform_f4
        // cwgl_getUniform_m2
        // cwgl_getUniform_m3
        // cwgl_getUniform_m4
    };
}

const libdef = genlibdef();
const CWGL = FFI.Library(DLLPATH, libdef);

module.exports = CWGL;
