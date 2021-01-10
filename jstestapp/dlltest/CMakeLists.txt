cmake_minimum_required(VERSION 3.1)
project(appdll C)

include_directories(.)
add_library(appdll SHARED
    ../../stubgen/stub.c
    rt.c
    dll.c)
