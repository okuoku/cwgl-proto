cmake_minimum_required(VERSION 3.1)
project(cwgl C CXX)


# SDL2
if(WIN32)
    if(BUILD_WIN32)
        # Vulkan SDK and SDL2
        file(TO_CMAKE_PATH $ENV{VK_SDK_PATH} vksdk)
        if(EXISTS ${vksdk})
            set(sdl2_inc ${vksdk}/Third-Party/Include/SDL2)
            set(sdl2_lib ${vksdk}/Third-Party/Bin32)
            set(sdl2_dll ${vksdk}/Third-Party/Bin32/SDL2.dll)
        endif()

        file(TO_CMAKE_PATH "C:/Imagination Technologies/PowerVR_Graphics/PowerVR_Tools" pvrroot)
        if(EXISTS ${pvrroot})
            # PVRVFrame 
            set(emu_lib "${pvrroot}/PVRVFrame/Library/Windows_x86_32")
            # PVRCarbon
            set(es2cap_lib "${pvrroot}/PVRCarbon/Recorder/GLES/Windows_x86_32")
        endif()
    else()
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
    if(sdl2_inc AND emu_lib AND es2cap_lib)
        # Do nothing
    else()
        message(FATAL_ERROR "Cannot find prerequisite(s)")
    endif()
    set(es2_lib libGLESv2)
else()
    # FIXME: Use FindSDL2 etc.
    set(sdl2_inc "/usr/include/SDL2")
    set(emu_lib)
    set(es2cap_lib)
    set(es2_lib GLESv2)
endif()

message(STATUS "sdl2_inc = ${sdl2_inc}")
message(STATUS "emu = ${emu_lib}")
message(STATUS "es2cap_lib = ${es2cap_lib}")

include_directories(include angle/include)

set(CMAKE_CXX_STANDARD 17)

add_library(cwgl SHARED
    yfrm/src-cxx17/yfrm-fs-cxx17.cpp
    yfrm/src-sdl2/yfrm-audio-sdl2.c
    yfrm/src-sdl2/yfrm-ctx-sdl2.c
    yfrm/src-sdl2/yfrm-events-sdl2.c
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
    YFRM_DLL
    YFRM_SHARED_BUILD
    CWGL_DLL
    CWGL_SHARED_BUILD)

target_link_directories(cwgl
    PUBLIC
    ${emu_lib} ${sdl2_lib})

target_link_libraries(cwgl SDL2 ${es2_lib})

target_include_directories(cwgl
    PUBLIC
    ${sdl2_inc})

if(WIN32)
    add_custom_command(TARGET cwgl
        POST_BUILD
        # Deploy SDL2.dll, GLES2
        COMMAND ${CMAKE_COMMAND} -E copy 
        ${sdl2_dll} 
        ${emu_lib}/libEGL.dll
        ${emu_lib}/libGLESv2.dll
        ${CMAKE_CURRENT_BINARY_DIR}
        )
endif()

# NCCC stub
add_subdirectory(ncccstubs)

# TestApp
add_executable(testapp
    testapp.c)
target_link_libraries(testapp cwgl)

target_compile_definitions(testapp
    PUBLIC
    YFRM_DLL
    CWGL_DLL)
