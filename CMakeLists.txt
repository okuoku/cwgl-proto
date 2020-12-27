cmake_minimum_required(VERSION 3.1)
project(cwgl C)

# SDL2
if(WIN32)
    # Vulkan SDK and SDL2
    file(TO_CMAKE_PATH $ENV{VK_SDK_PATH} vksdk)
    if(EXISTS ${vksdk})
        set(sdl2_inc ${vksdk}/Third-Party/Include/SDL2)
        set(sdl2_lib ${vksdk}/Third-Party/Bin)
        set(sdl2_dll ${vksdk}/Third-Party/Bin/SDL2.dll)
    endif()

    file(TO_CMAKE_PATH "C:/Imagination Technologies/PowerVR_Graphics/PowerVR_Tools" pvrroot)
    if(EXISTS ${pvrroot})
        # PVRVFrame 
        set(emu_lib "${pvrroot}/PVRVFrame/Library/Windows_x86_64")
        # PVRCarbon
        set(es2cap_lib "${pvrroot}/PVRCarbon/Recorder/GLES/Windows_x86_64")
    endif()
endif()

message(STATUS "sdl2_inc = ${sdl2_inc}")
message(STATUS "emu = ${emu_lib}")
message(STATUS "es2cap_lib = ${es2cap_lib}")

if(sdl2_inc AND emu_lib AND es2cap_lib)
    # Do nothing
else()
    message(FATAL_ERROR "Cannot find prerequisite(s)")
endif()

include_directories(include angle/include)

add_library(cwgl SHARED
    src-gles2/cwgl-gles2-ctxsdl2.c
    src-gles2/cwgl-gles2-objstr.c
    src-gles2/cwgl-gles2-snone.c
    src-gles2/cwgl-gles2-s2.c
    src-gles2/cwgl-gles2-s3.c
    src-gles2/cwgl-gles2-s4.c
    src-gles2/cwgl-gles2-s5.c
    src-gles2/cwgl-gles2-s6obj.c
    src-gles2/cwgl-gles2-s6shader.c
    )

target_compile_definitions(cwgl
    PUBLIC
    CWGL_DLL
    CWGL_SHARED_BUILD)

target_link_directories(cwgl
    PUBLIC
    ${emu_lib} ${sdl2_lib})

target_link_libraries(cwgl SDL2 libGLESv2)

target_include_directories(cwgl
    PUBLIC
    ${sdl2_inc})

add_custom_command(TARGET cwgl
    POST_BUILD
    # Deploy SDL2.dll, GLES2
    COMMAND ${CMAKE_COMMAND} -E copy 
    ${sdl2_dll} 
    ${emu_lib}/libEGL.dll
    ${emu_lib}/libGLESv2.dll
    ${CMAKE_CURRENT_BINARY_DIR}
    )

# TestApp
add_executable(testapp
    testapp.c)
target_link_libraries(testapp cwgl)

if(WIN32)
    target_compile_definitions(testapp
        PUBLIC
        CWGL_DLL)
endif()
