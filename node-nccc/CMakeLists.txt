cmake_minimum_required(VERSION 3.0)
project(node-nccc C)

link_directories(napi-lib)
include_directories(napi-includes)

add_library(node-nccc SHARED
    node-nccc.c
    )

if(WIN32)
    target_link_libraries(node-nccc node)
endif()

set_target_properties(node-nccc
    PROPERTIES
    PREFIX ""
    SUFFIX ".node")

