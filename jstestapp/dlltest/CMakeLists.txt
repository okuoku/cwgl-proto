cmake_minimum_required(VERSION 3.1)
project(appdll C)

add_library(appdll SHARED
    dll.c)
