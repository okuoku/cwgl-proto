cmake_minimum_required(VERSION 3.1)
project(cwgl C)

include_directories(include angle/include)

add_library(cwgl STATIC
    src-gles2/cwgl-gles2-s2.c
    src-gles2/cwgl-gles2-s3.c
    src-gles2/cwgl-gles2-s4.c
    src-gles2/cwgl-gles2-s5.c
    src-gles2/cwgl-gles2-s6obj.c
    )
