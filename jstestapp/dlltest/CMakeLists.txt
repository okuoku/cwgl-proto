cmake_minimum_required(VERSION 3.1)
project(appdll C)

include_directories(.)

add_custom_command(OUTPUT 
    ${CMAKE_CURRENT_BINARY_DIR}/dll_bc.bc
    COMMAND clang -g3 -c -emit-llvm -O0
    -o ${CMAKE_CURRENT_BINARY_DIR}/dll_bc.bc
    dll.c
    DEPENDS dll.c
    WORKING_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}
    COMMENT "WASM: Translating .c => LLVM")

add_custom_command(OUTPUT 
    ${CMAKE_CURRENT_BINARY_DIR}/dll_bc.o
    COMMAND clang -g3 -O0 -c
    -o ${CMAKE_CURRENT_BINARY_DIR}/dll_bc.o
    ${CMAKE_CURRENT_BINARY_DIR}/dll_bc.bc
    DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/dll_bc.bc
    COMMENT "WASM: Generating machine code LLVM => bin")

add_library(appdll SHARED
    ../../stubgen/stub.c
    rt.c
    dll_bc.o)
