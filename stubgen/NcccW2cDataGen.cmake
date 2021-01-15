#
# INPUTs:
#   IN: full path to data
#  OUT: full path to .cmake
#
cmake_policy(SET CMP0054 NEW)

if(NOT IN)
    message(FATAL_ERROR "Huh?")
endif()

if(NOT OUT)
    message(FATAL_ERROR "Huh?")
endif()

include(${IN})

set(imports)
set(exports)
set(importidx 0)
set(exportidx 0)

macro(count var)
    math(EXPR ${var} "${${var}}+1")
endmacro()

function(decodename out nam)
    set(q ${nam})
    set(acc)
    while(1)
        if("${q}" MATCHES "^([^Z]*)Z([0-9A-F][0-9A-F])(.*)")
            #message(STATUS "Decode: ${acc}+${CMAKE_MATCH_1} [${CMAKE_MATCH_2}] ${CMAKE_MATCH_3}")
            set(hex ${CMAKE_MATCH_2})
            math(EXPR dec "0x${hex}")
            string(ASCII ${dec} c)
            set(acc "${acc}${CMAKE_MATCH_1}${c}")
            set(q "${CMAKE_MATCH_3}")
        elseif("${q}" MATCHES "^([^Z]+)(Z.*)")
            #message(STATUS "Next: ${acc}+${CMAKE_MATCH_1} ${CMAKE_MATCH_2}")
            set(acc "${acc}${CMAKE_MATCH_1}")
            set(q "${CMAKE_MATCH_2}")
        elseif("${q}" MATCHES "^(Z_?)(.*)")
            #message(STATUS "Next: ${acc}+${CMAKE_MATCH_1} ${CMAKE_MATCH_2}")
            set(acc "${acc}${CMAKE_MATCH_1}")
            set(q "${CMAKE_MATCH_2}")
        else()
            #message(STATUS "Done: ${acc}+${q}")
            set(acc "${acc}${q}")
            break()
        endif()
    endwhile()
    set(${out} ${acc} PARENT_SCOPE)
endfunction()

function(splitexportvarname nam out)
    if(nam MATCHES "Z_(.+)")
        set(p1 ${CMAKE_MATCH_1})
        set(${out} ${p1} PARENT_SCOPE)
    else()
        message(FATAL_ERROR "Invalid export name: ${nam}")
    endif()
endfunction()

function(splitexportfuncname nam out1 out2)
    if(nam MATCHES "Z_([^Z]+)Z_(.*)")
        set(p1 ${CMAKE_MATCH_1})
        set(p2 ${CMAKE_MATCH_2})
        set(${out1} ${p1} PARENT_SCOPE)
        set(${out2} ${p2} PARENT_SCOPE)
    else()
        message(FATAL_ERROR "Unrecognised name: ${nam}")
    endif()
endfunction()

function(splitimportname nam out1 out2 out3)
    if(nam MATCHES "Z_([^Z]+)Z_([^Z]+)Z_(.*)")
        set(p1 ${CMAKE_MATCH_1})
        set(p2 ${CMAKE_MATCH_2})
        set(p3 ${CMAKE_MATCH_3})
        set(${out1} ${p1} PARENT_SCOPE)
        set(${out2} ${p2} PARENT_SCOPE)
        set(${out3} ${p3} PARENT_SCOPE)
    else()
        message(FATAL_ERROR "Unrecognised name: ${nam}")
    endif()
endfunction()

function(splitimportvarname nam out1 out2)
    if(nam MATCHES "Z_([^Z]+)Z_([^Z]+)")
        set(p1 ${CMAKE_MATCH_1})
        set(p2 ${CMAKE_MATCH_2})
        set(${out1} ${p1} PARENT_SCOPE)
        set(${out2} ${p2} PARENT_SCOPE)
    else()
        message(FATAL_ERROR "Unrecognised name: ${nam}")
    endif()
endfunction()

file(WRITE ${OUT} "# Autogenerated\n\n")

foreach(s ${syms})
    set(type ${sym_${s}_symtype})
    decodename(sd "${s}")
    #message(STATUS "Decodename: [${s}] => [${sd}]")
    if(${type} STREQUAL IMPORT_FUNCTION)
        splitimportname(${sd} n1 n2 n3)
        file(APPEND ${OUT} "set(sym_${s}_importidx ${importidx})\n")
        file(APPEND ${OUT} "set(sym_${s}_importname1 ${n1})\n")
        file(APPEND ${OUT} "set(sym_${s}_importname2 ${n2})\n")
        file(APPEND ${OUT} "set(sym_${s}_jstype ${n3})\n")
        count(importidx)
    elseif(${type} STREQUAL IMPORT_VARIABLE)
        splitimportvarname(${sd} n1 n2)
        file(APPEND ${OUT} "set(sym_${s}_importidx ${importidx})\n")
        file(APPEND ${OUT} "set(sym_${s}_importname1 ${n1})\n")
        file(APPEND ${OUT} "set(sym_${s}_importname2 ${n2})\n")
        count(importidx)
    elseif(${type} STREQUAL EXPORT_FUNCTION)
        splitexportfuncname(${sd} s0 s1)
        file(APPEND ${OUT} "set(sym_${s}_exportidx ${exportidx})\n")
        file(APPEND ${OUT} "set(sym_${s}_exportname ${sn})\n")
        count(exportidx)
    elseif(${type} STREQUAL EXPORT_VARIABLE)
        splitexportvarname(${sd} s0)
        file(APPEND ${OUT} "set(sym_${s}_exportidx ${exportidx})\n")
        file(APPEND ${OUT} "set(sym_${s}_exportname ${sn})\n")
        count(exportidx)
    else()
        message(FATAL_ERROR "Unknown symbol type: ${s}")
    endif()
endforeach()

file(APPEND ${OUT} "\n\n")
file(APPEND ${OUT} "set(symtotal_imports ${importidx})\n")
file(APPEND ${OUT} "set(symtotal_exports ${exportidx})\n")
