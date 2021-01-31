cmake_minimum_required(VERSION 3.0)
project(ncccstubs C)

include(../stubgen/NcccStubMacros.cmake)
include(./stub_yfrm.cmake)

include_directories(../include)
include_directories(${CMAKE_CURRENT_BINARY_DIR})

add_library(yfrm_stubs SHARED
    colroot.c
    stublead.c)

target_link_libraries(yfrm_stubs cwgl)
