# NB: It's not compatible with MSVC for now

cmake_minimum_required(VERSION 3.0) # FIXME: Hex notation in MATH?
project(apps)

if(NOT WITH_WASM2C)
    # FIXME: WABT path
    set(WITH_WASM2C "c:/cygwin64/home/oku/repos/cwgl/wabt-static/wasm2c.exe") 
endif()

set(STUBGEN "${CMAKE_CURRENT_LIST_DIR}/../stubgen")
set(WASMSTUB "${CMAKE_CURRENT_LIST_DIR}/../wasmstub")

function(translate_wasm proj wasmpath)
    set(WASM2C "${WITH_WASM2C}")

    set(base "${CMAKE_CURRENT_BINARY_DIR}/${proj}")
    set(wasmcpath "${base}_wasm.c")
    set(wasmhpath "${base}_wasm.h")
    set(bcpath "${base}_wasm.bc")
    set(outpath "${base}_wasm.o")
    set(stubhpath "${base}_stubdata.h")
    set(stubcpath "${base}_stub.c")

    # .wasm => .c
    add_custom_command(OUTPUT ${wasmcpath} ${wasmhpath}
        COMMAND ${WASM2C} -o ${proj}_wasm.c ${wasmpath}
        DEPENDS ${wasmpath}
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
        COMMENT "WASM: Translating .wasm => .c (${proj})")

    # .c => .bc
    add_custom_command(OUTPUT ${bcpath}
        COMMAND clang -g3 -c -emit-llvm -O0
        -Xclang -disable-O0-optnone
        -DWASM_RT_MEMCHECK_SIGNAL_HANDLER=1
        -I${WASMSTUB}
        -o ${bcpath} ${wasmcpath}
        DEPENDS ${wasmcpath} ${wasmhpath}
        COMMENT "WASM: Translating .c => LLVM (${proj})")

    # .bc => .o
    add_custom_command(OUTPUT ${outpath}
        COMMAND clang -g3 -O1 -c
        -o ${outpath} ${bcpath}
        DEPENDS ${bcpath}
        COMMENT "WASM: Generating machine code LLVM => bin (${proj})")

    # Stub info(h)
    add_custom_command(OUTPUT ${base}_hdr.cmake
        COMMAND ${CMAKE_COMMAND} -DIN=${wasmhpath}
        -DOUT=${base}_hdr.cmake -P ${STUBGEN}/NcccParseW2cHeader.cmake
        DEPENDS ${STUBGEN}/NcccParseW2cHeader.cmake ${wasmhpath}
        COMMENT "STUBGEN: Reading import/exports (${proj})")
    add_custom_command(OUTPUT ${base}_src.cmake
        COMMAND ${CMAKE_COMMAND} -DIN=${wasmcpath}
        -DOUT=${base}_src.cmake -P ${STUBGEN}/NcccParseW2cSource.cmake
        DEPENDS ${STUBGEN}/NcccParseW2cSource.cmake ${wasmcpath}
        COMMENT "STUBGEN: Reading table (${proj})")
    add_custom_command(OUTPUT ${base}_sym.cmake
        COMMAND ${CMAKE_COMMAND} -DIN=${base}_hdr.cmake
        -DOUT=${base}_sym.cmake -P ${STUBGEN}/NcccW2cDataGen.cmake
        DEPENDS ${STUBGEN}/NcccW2cDataGen.cmake ${base}_hdr.cmake
        COMMENT "STUBGEN: Extracting symbol data (${proj})")
    add_custom_command(OUTPUT ${stubhpath}
        COMMAND ${CMAKE_COMMAND} -DIN_HDR=${base}_hdr.cmake
        -DIN_SYM=${base}_sym.cmake -DIN_SRC=${base}_src.cmake
        -DOUT=${stubhpath} -P ${STUBGEN}/NcccTemplateW2cMetadata.cmake
        DEPENDS ${STUBGEN}/NcccTemplateW2cMetadata.cmake
        ${base}_sym.cmake ${base}_hdr.cmake ${base}_src.cmake
        COMMENT "STUBGEN: Generating stub information (${proj})")

    # Stub
    configure_file(${WASMSTUB}/_stub.c.in ${stubcpath} @ONLY)
endfunction()

function(addapp app wasmpath)
    set(base ${CMAKE_CURRENT_BINARY_DIR}/${app})
    translate_wasm(${app} ${wasmpath})
    add_library(appdll_${app} SHARED
        ${base}_wasm.o
        ${base}_stub.c
        ${base}_stubdata.h
        ${WASMSTUB}/rt.c)
endfunction()

set(APPROOT "${CMAKE_CURRENT_LIST_DIR}/../jstestapp")

include_directories(${WASMSTUB} ${CMAKE_CURRENT_BINARY_DIR})

addapp(app ${APPROOT}/app/example_emscripten_opengl3.wasm)
addapp(app2 ${APPROOT}/app2/gltest2.wasm)
addapp(app3 ${APPROOT}/app3/webgl.wasm)
addapp(app4 ${APPROOT}/app4/webgl.wasm)
addapp(app5 ${APPROOT}/app5/webgl.wasm)
addapp(app6 ${APPROOT}/app6/dosbox-x.wasm)

