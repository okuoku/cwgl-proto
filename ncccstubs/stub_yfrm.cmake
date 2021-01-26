nccc_stub_begin(yfrm)

# Context
nccc_api(yfrm_init IN OUT u32)
nccc_api(yfrm_terminate IN OUT)
nccc_api(yfrm_cwgl_ctx_create
    IN u32 u32 u32 u32
    OUT ptr)
nccc_api(yfrm_cwgl_ctx_release
    IN ptr OUT)

# Events
nccc_api(yfrm_query0
    IN u32 ptr u64
    OUT u32)

# Frame
nccc_api(yfrm_frame_begin0
    IN ptr OUT)
nccc_api(yfrm_frame_end0
    IN ptr OUT)

# Audio
nccc_api(yfrm_audio_enqueue0
    IN ptr ptr u32
    OUT)
nccc_api(yfrm_audio_pause0
    IN OUT)

nccc_stub_end(yfrm)
