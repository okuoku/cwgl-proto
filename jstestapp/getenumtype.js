const DEPTH_BUFFER_BIT = 0x00000100;
const STENCIL_BUFFER_BIT = 0x00000400;
const COLOR_BUFFER_BIT = 0x00004000;
const POINTS = 0x0000;
const LINES = 0x0001;
const LINE_LOOP = 0x0002;
const LINE_STRIP = 0x0003;
const TRIANGLES = 0x0004;
const TRIANGLE_STRIP = 0x0005;
const TRIANGLE_FAN = 0x0006;
const ZERO = 0;
const ONE = 1;
const SRC_COLOR = 0x0300;
const ONE_MINUS_SRC_COLOR = 0x0301;
const SRC_ALPHA = 0x0302;
const ONE_MINUS_SRC_ALPHA = 0x0303;
const DST_ALPHA = 0x0304;
const ONE_MINUS_DST_ALPHA = 0x0305;
const DST_COLOR = 0x0306;
const ONE_MINUS_DST_COLOR = 0x0307;
const SRC_ALPHA_SATURATE = 0x0308;
const FUNC_ADD = 0x8006;
const BLEND_EQUATION = 0x8009;
const BLEND_EQUATION_RGB = 0x8009;
const BLEND_EQUATION_ALPHA = 0x883D;
const FUNC_SUBTRACT = 0x800A;
const FUNC_REVERSE_SUBTRACT = 0x800B;
const BLEND_DST_RGB = 0x80C8;
const BLEND_SRC_RGB = 0x80C9;
const BLEND_DST_ALPHA = 0x80CA;
const BLEND_SRC_ALPHA = 0x80CB;
const CONSTANT_COLOR = 0x8001;
const ONE_MINUS_CONSTANT_COLOR = 0x8002;
const CONSTANT_ALPHA = 0x8003;
const ONE_MINUS_CONSTANT_ALPHA = 0x8004;
const BLEND_COLOR = 0x8005;
const ARRAY_BUFFER = 0x8892;
const ELEMENT_ARRAY_BUFFER = 0x8893;
const ARRAY_BUFFER_BINDING = 0x8894;
const ELEMENT_ARRAY_BUFFER_BINDING = 0x8895;
const STREAM_DRAW = 0x88E0;
const STATIC_DRAW = 0x88E4;
const DYNAMIC_DRAW = 0x88E8;
const BUFFER_SIZE = 0x8764;
const BUFFER_USAGE = 0x8765;
const CURRENT_VERTEX_ATTRIB = 0x8626;
const FRONT = 0x0404;
const BACK = 0x0405;
const FRONT_AND_BACK = 0x0408;
const CULL_FACE = 0x0B44;
const BLEND = 0x0BE2;
const DITHER = 0x0BD0;
const STENCIL_TEST = 0x0B90;
const DEPTH_TEST = 0x0B71;
const SCISSOR_TEST = 0x0C11;
const POLYGON_OFFSET_FILL = 0x8037;
const SAMPLE_ALPHA_TO_COVERAGE = 0x809E;
const SAMPLE_COVERAGE = 0x80A0;
const NO_ERROR = 0;
const INVALID_ENUM = 0x0500;
const INVALID_VALUE = 0x0501;
const INVALID_OPERATION = 0x0502;
const OUT_OF_MEMORY = 0x0505;
const CW = 0x0900;
const CCW = 0x0901;
const LINE_WIDTH = 0x0B21;
const ALIASED_POINT_SIZE_RANGE = 0x846D;
const ALIASED_LINE_WIDTH_RANGE = 0x846E;
const CULL_FACE_MODE = 0x0B45;
const FRONT_FACE = 0x0B46;
const DEPTH_RANGE = 0x0B70;
const DEPTH_WRITEMASK = 0x0B72;
const DEPTH_CLEAR_VALUE = 0x0B73;
const DEPTH_FUNC = 0x0B74;
const STENCIL_CLEAR_VALUE = 0x0B91;
const STENCIL_FUNC = 0x0B92;
const STENCIL_FAIL = 0x0B94;
const STENCIL_PASS_DEPTH_FAIL = 0x0B95;
const STENCIL_PASS_DEPTH_PASS = 0x0B96;
const STENCIL_REF = 0x0B97;
const STENCIL_VALUE_MASK = 0x0B93;
const STENCIL_WRITEMASK = 0x0B98;
const STENCIL_BACK_FUNC = 0x8800;
const STENCIL_BACK_FAIL = 0x8801;
const STENCIL_BACK_PASS_DEPTH_FAIL = 0x8802;
const STENCIL_BACK_PASS_DEPTH_PASS = 0x8803;
const STENCIL_BACK_REF = 0x8CA3;
const STENCIL_BACK_VALUE_MASK = 0x8CA4;
const STENCIL_BACK_WRITEMASK = 0x8CA5;
const VIEWPORT = 0x0BA2;
const SCISSOR_BOX = 0x0C10;
const COLOR_CLEAR_VALUE = 0x0C22;
const COLOR_WRITEMASK = 0x0C23;
const UNPACK_ALIGNMENT = 0x0CF5;
const PACK_ALIGNMENT = 0x0D05;
const MAX_TEXTURE_SIZE = 0x0D33;
const MAX_VIEWPORT_DIMS = 0x0D3A;
const SUBPIXEL_BITS = 0x0D50;
const RED_BITS = 0x0D52;
const GREEN_BITS = 0x0D53;
const BLUE_BITS = 0x0D54;
const ALPHA_BITS = 0x0D55;
const DEPTH_BITS = 0x0D56;
const STENCIL_BITS = 0x0D57;
const POLYGON_OFFSET_UNITS = 0x2A00;
const POLYGON_OFFSET_FACTOR = 0x8038;
const TEXTURE_BINDING_2D = 0x8069;
const SAMPLE_BUFFERS = 0x80A8;
const SAMPLES = 0x80A9;
const SAMPLE_COVERAGE_VALUE = 0x80AA;
const SAMPLE_COVERAGE_INVERT = 0x80AB;
const COMPRESSED_TEXTURE_FORMATS = 0x86A3;
const DONT_CARE = 0x1100;
const FASTEST = 0x1101;
const NICEST = 0x1102;
const GENERATE_MIPMAP_HINT = 0x8192;
const BYTE = 0x1400;
const UNSIGNED_BYTE = 0x1401;
const SHORT = 0x1402;
const UNSIGNED_SHORT = 0x1403;
const INT = 0x1404;
const UNSIGNED_INT = 0x1405;
const FLOAT = 0x1406;
const DEPTH_COMPONENT = 0x1902;
const ALPHA = 0x1906;
const RGB = 0x1907;
const RGBA = 0x1908;
const LUMINANCE = 0x1909;
const LUMINANCE_ALPHA = 0x190A;
const UNSIGNED_SHORT_4_4_4_4 = 0x8033;
const UNSIGNED_SHORT_5_5_5_1 = 0x8034;
const UNSIGNED_SHORT_5_6_5 = 0x8363;
const FRAGMENT_SHADER = 0x8B30;
const VERTEX_SHADER = 0x8B31;
const MAX_VERTEX_ATTRIBS = 0x8869;
const MAX_VERTEX_UNIFORM_VECTORS = 0x8DFB;
const MAX_VARYING_VECTORS = 0x8DFC;
const MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8B4D;
const MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8B4C;
const MAX_TEXTURE_IMAGE_UNITS = 0x8872;
const MAX_FRAGMENT_UNIFORM_VECTORS = 0x8DFD;
const SHADER_TYPE = 0x8B4F;
const DELETE_STATUS = 0x8B80;
const LINK_STATUS = 0x8B82;
const VALIDATE_STATUS = 0x8B83;
const ATTACHED_SHADERS = 0x8B85;
const ACTIVE_UNIFORMS = 0x8B86;
const ACTIVE_ATTRIBUTES = 0x8B89;
const SHADING_LANGUAGE_VERSION = 0x8B8C;
const CURRENT_PROGRAM = 0x8B8D;
const NEVER = 0x0200;
const LESS = 0x0201;
const EQUAL = 0x0202;
const LEQUAL = 0x0203;
const GREATER = 0x0204;
const NOTEQUAL = 0x0205;
const GEQUAL = 0x0206;
const ALWAYS = 0x0207;
const KEEP = 0x1E00;
const REPLACE = 0x1E01;
const INCR = 0x1E02;
const DECR = 0x1E03;
const INVERT = 0x150A;
const INCR_WRAP = 0x8507;
const DECR_WRAP = 0x8508;
const VENDOR = 0x1F00;
const RENDERER = 0x1F01;
const VERSION = 0x1F02;
const NEAREST = 0x2600;
const LINEAR = 0x2601;
const NEAREST_MIPMAP_NEAREST = 0x2700;
const LINEAR_MIPMAP_NEAREST = 0x2701;
const NEAREST_MIPMAP_LINEAR = 0x2702;
const LINEAR_MIPMAP_LINEAR = 0x2703;
const TEXTURE_MAG_FILTER = 0x2800;
const TEXTURE_MIN_FILTER = 0x2801;
const TEXTURE_WRAP_S = 0x2802;
const TEXTURE_WRAP_T = 0x2803;
const TEXTURE_2D = 0x0DE1;
const TEXTURE = 0x1702;
const TEXTURE_CUBE_MAP = 0x8513;
const TEXTURE_BINDING_CUBE_MAP = 0x8514;
const TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
const TEXTURE_CUBE_MAP_NEGATIVE_X = 0x8516;
const TEXTURE_CUBE_MAP_POSITIVE_Y = 0x8517;
const TEXTURE_CUBE_MAP_NEGATIVE_Y = 0x8518;
const TEXTURE_CUBE_MAP_POSITIVE_Z = 0x8519;
const TEXTURE_CUBE_MAP_NEGATIVE_Z = 0x851A;
const MAX_CUBE_MAP_TEXTURE_SIZE = 0x851C;
const TEXTURE0 = 0x84C0;
const TEXTURE1 = 0x84C1;
const TEXTURE2 = 0x84C2;
const TEXTURE3 = 0x84C3;
const TEXTURE4 = 0x84C4;
const TEXTURE5 = 0x84C5;
const TEXTURE6 = 0x84C6;
const TEXTURE7 = 0x84C7;
const TEXTURE8 = 0x84C8;
const TEXTURE9 = 0x84C9;
const TEXTURE10 = 0x84CA;
const TEXTURE11 = 0x84CB;
const TEXTURE12 = 0x84CC;
const TEXTURE13 = 0x84CD;
const TEXTURE14 = 0x84CE;
const TEXTURE15 = 0x84CF;
const TEXTURE16 = 0x84D0;
const TEXTURE17 = 0x84D1;
const TEXTURE18 = 0x84D2;
const TEXTURE19 = 0x84D3;
const TEXTURE20 = 0x84D4;
const TEXTURE21 = 0x84D5;
const TEXTURE22 = 0x84D6;
const TEXTURE23 = 0x84D7;
const TEXTURE24 = 0x84D8;
const TEXTURE25 = 0x84D9;
const TEXTURE26 = 0x84DA;
const TEXTURE27 = 0x84DB;
const TEXTURE28 = 0x84DC;
const TEXTURE29 = 0x84DD;
const TEXTURE30 = 0x84DE;
const TEXTURE31 = 0x84DF;
const ACTIVE_TEXTURE = 0x84E0;
const REPEAT = 0x2901;
const CLAMP_TO_EDGE = 0x812F;
const MIRRORED_REPEAT = 0x8370;
const FLOAT_VEC2 = 0x8B50;
const FLOAT_VEC3 = 0x8B51;
const FLOAT_VEC4 = 0x8B52;
const INT_VEC2 = 0x8B53;
const INT_VEC3 = 0x8B54;
const INT_VEC4 = 0x8B55;
const BOOL = 0x8B56;
const BOOL_VEC2 = 0x8B57;
const BOOL_VEC3 = 0x8B58;
const BOOL_VEC4 = 0x8B59;
const FLOAT_MAT2 = 0x8B5A;
const FLOAT_MAT3 = 0x8B5B;
const FLOAT_MAT4 = 0x8B5C;
const SAMPLER_2D = 0x8B5E;
const SAMPLER_CUBE = 0x8B60;
const VERTEX_ATTRIB_ARRAY_ENABLED = 0x8622;
const VERTEX_ATTRIB_ARRAY_SIZE = 0x8623;
const VERTEX_ATTRIB_ARRAY_STRIDE = 0x8624;
const VERTEX_ATTRIB_ARRAY_TYPE = 0x8625;
const VERTEX_ATTRIB_ARRAY_NORMALIZED = 0x886A;
const VERTEX_ATTRIB_ARRAY_POINTER = 0x8645;
const VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 0x889F;
const IMPLEMENTATION_COLOR_READ_TYPE = 0x8B9A;
const IMPLEMENTATION_COLOR_READ_FORMAT = 0x8B9B;
const COMPILE_STATUS = 0x8B81;
const LOW_FLOAT = 0x8DF0;
const MEDIUM_FLOAT = 0x8DF1;
const HIGH_FLOAT = 0x8DF2;
const LOW_INT = 0x8DF3;
const MEDIUM_INT = 0x8DF4;
const HIGH_INT = 0x8DF5;
const FRAMEBUFFER = 0x8D40;
const RENDERBUFFER = 0x8D41;
const RGBA4 = 0x8056;
const RGB5_A1 = 0x8057;
const RGB565 = 0x8D62;
const DEPTH_COMPONENT16 = 0x81A5;
const STENCIL_INDEX8 = 0x8D48;
const DEPTH_STENCIL = 0x84F9;
const RENDERBUFFER_WIDTH = 0x8D42;
const RENDERBUFFER_HEIGHT = 0x8D43;
const RENDERBUFFER_INTERNAL_FORMAT = 0x8D44;
const RENDERBUFFER_RED_SIZE = 0x8D50;
const RENDERBUFFER_GREEN_SIZE = 0x8D51;
const RENDERBUFFER_BLUE_SIZE = 0x8D52;
const RENDERBUFFER_ALPHA_SIZE = 0x8D53;
const RENDERBUFFER_DEPTH_SIZE = 0x8D54;
const RENDERBUFFER_STENCIL_SIZE = 0x8D55;
const FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE = 0x8CD0;
const FRAMEBUFFER_ATTACHMENT_OBJECT_NAME = 0x8CD1;
const FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL = 0x8CD2;
const FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE = 0x8CD3;
const COLOR_ATTACHMENT0 = 0x8CE0;
const DEPTH_ATTACHMENT = 0x8D00;
const STENCIL_ATTACHMENT = 0x8D20;
const DEPTH_STENCIL_ATTACHMENT = 0x821A;
const NONE = 0;
const FRAMEBUFFER_COMPLETE = 0x8CD5;
const FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 0x8CD6;
const FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 0x8CD7;
const FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 0x8CD9;
const FRAMEBUFFER_UNSUPPORTED = 0x8CDD;
const FRAMEBUFFER_BINDING = 0x8CA6;
const RENDERBUFFER_BINDING = 0x8CA7;
const MAX_RENDERBUFFER_SIZE = 0x84E8;
const INVALID_FRAMEBUFFER_OPERATION = 0x0506;
const UNPACK_FLIP_Y_WEBGL = 0x9240;
const UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;
const CONTEXT_LOST_WEBGL = 0x9242;
const UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;
const BROWSER_DEFAULT_WEBGL = 0x9244;

function genenumtype(num){
    switch(num){
        case BLEND:
        case CULL_FACE:
        case DEPTH_TEST:
        case DEPTH_WRITEMASK:
        case DITHER:
        case POLYGON_OFFSET_FILL:
        case SAMPLE_ALPHA_TO_COVERAGE:
        case SAMPLE_COVERAGE:
        case SAMPLE_COVERAGE_INVERT:
        case SCISSOR_TEST:
        case STENCIL_TEST:
        case UNPACK_FLIP_Y_WEBGL:
        case UNPACK_PREMULTIPLY_ALPHA_WEBGL:
        case DELETE_STATUS:
        case LINK_STATUS:
        case VALIDATE_STATUS:
        case DELETE_STATUS:
        case COMPILE_STATUS:
        case VERTEX_ATTRIB_ARRAY_ENABLED:
        case VERTEX_ATTRIB_ARRAY_NORMALIZED:
            return "bool";
        case COLOR_WRITEMASK:
            return "b4";
        case MAX_VIEWPORT_DIMS:
            return "i2";
        case SCISSOR_BOX:
        case VIEWPORT:
            return "i4";
        case COMPRESSED_TEXTURE_FORMATS:
            return "i*";
        case RENDERER:
        case VENDOR:
        case VERSION:
        case SHADING_LANGUAGE_VERSION:
            return "str";
        case DEPTH_CLEAR_VALUE:
        case LINE_WIDTH:
        case POLYGON_OFFSET_FACTOR:
        case POLYGON_OFFSET_UNITS:
        case SAMPLE_COVERAGE_VALUE:
            return "float";
        case ALIASED_LINE_WIDTH_RANGE:
        case ALIASED_POINT_SIZE_RANGE:
        case DEPTH_RANGE:
            return "f2";
        case BLEND_COLOR:
        case COLOR_CLEAR_VALUE:
        case SCISSOR_BOX:
        case CURRENT_VERTEX_ATTRIB:
            return "f4";
        case ARRAY_BUFFER_BINDING:
        case ELEMENT_ARRAY_BUFFER_BINDING:
        case VERTEX_ATTRIB_ARRAY_BUFFER_BINDING:
            return "Buffer";
        case CURRENT_PROGRAM:
            return "Program";
        case FRAMEBUFFER_BINDING:
            return "Framebuffer";
        case RENDERBUFFER_BINDING:
            return "Renderbuffer";
        case TEXTURE_BINDING_2D:
        case TEXTURE_BINDING_CUBE_MAP:
            return "Texture";
        
        case ACTIVE_TEXTURE:
        case ALPHA_BITS:
        case BLEND_DST_ALPHA:
        case BLEND_DST_RGB:
        case BLEND_EQUATION_ALPHA:
        case BLEND_EQUATION_RGB:
        case BLEND_SRC_ALPHA:
        case BLEND_SRC_RGB:
        case BLUE_BITS:
        case CULL_FACE_MODE:
        case DEPTH_BITS:
        case DEPTH_FUNC:
        case FRONT_FACE:
        case GENERATE_MIPMAP_HINT:
        case GREEN_BITS:
        case IMPLEMENTATION_COLOR_READ_FORMAT:
        case IMPLEMENTATION_COLOR_READ_TYPE:
        case MAX_COMBINED_TEXTURE_IMAGE_UNITS:
        case MAX_CUBE_MAP_TEXTURE_SIZE:
        case MAX_FRAGMENT_UNIFORM_VECTORS:
        case MAX_RENDERBUFFER_SIZE:
        case MAX_TEXTURE_IMAGE_UNITS:
        case MAX_TEXTURE_SIZE:
        case MAX_VARYING_VECTORS:
        case MAX_VERTEX_ATTRIBS:
        case MAX_VERTEX_TEXTURE_IMAGE_UNITS:
        case MAX_VERTEX_UNIFORM_VECTORS:
        case PACK_ALIGNMENT:
        case RED_BITS:
        case SAMPLE_BUFFERS:
        case SAMPLES:
        case STENCIL_BACK_FAIL:
        case STENCIL_BACK_FUNC:
        case STENCIL_BACK_PASS_DEPTH_FAIL:
        case STENCIL_BACK_PASS_DEPTH_PASS:
        case STENCIL_BACK_REF:
        case STENCIL_BACK_VALUE_MASK:
        case STENCIL_BACK_WRITEMASK:
        case STENCIL_BITS:
        case STENCIL_CLEAR_VALUE:
        case STENCIL_FAIL:
        case STENCIL_FUNC:
        case STENCIL_PASS_DEPTH_FAIL:
        case STENCIL_PASS_DEPTH_PASS:
        case STENCIL_REF:
        case STENCIL_VALUE_MASK:
        case STENCIL_WRITEMASK:
        case SUBPIXEL_BITS:
        case UNPACK_ALIGNMENT:
        case UNPACK_COLORSPACE_CONVERSION_WEBGL:
        case FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE:
        case FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL:
        case FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE:
        case RENDERBUFFER_WIDTH:
        case RENDERBUFFER_HEIGHT:
        case RENDERBUFFER_INTERNAL_FORMAT:
        case RENDERBUFFER_RED_SIZE:
        case RENDERBUFFER_GREEN_SIZE:
        case RENDERBUFFER_BLUE_SIZE:
        case RENDERBUFFER_ALPHA_SIZE:
        case RENDERBUFFER_DEPTH_SIZE:
        case RENDERBUFFER_STENCIL_SIZE:
        case TEXTURE_MAG_FILTER:
        case TEXTURE_MIN_FILTER:
        case TEXTURE_WRAP_S:
        case TEXTURE_WRAP_T:
        case ATTACHED_SHADERS:
        case ACTIVE_ATTRIBUTES:
        case ACTIVE_UNIFORMS:
        case SHADER_TYPE:
        case VERTEX_ATTRIB_ARRAY_SIZE:
        case VERTEX_ATTRIB_ARRAY_STRIDE:
        case VERTEX_ATTRIB_ARRAY_TYPE:
            return "int";
        default:
            throw "huh?";
    }
}

module.exports = genenumtype;
