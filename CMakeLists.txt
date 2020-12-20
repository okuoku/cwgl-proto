cmake_minimum_required(VERSION 3.1)
project(cwgl C)

include_directories(include angle/include)

add_library(cwgl STATIC
    src-gles2/check.c)
