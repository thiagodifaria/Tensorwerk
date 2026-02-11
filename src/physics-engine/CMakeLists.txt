cmake_minimum_required(VERSION 3.20)
project(tensorwerk_engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# AVX-512 — only enable if the CPU supports it
option(BUILD_ASM "Build with AVX-512 Assembly kernels (requires NASM and AVX-512 CPU)" OFF)

# Optional CUDA
find_package(CUDAToolkit)
if(CUDAToolkit_FOUND)
    enable_language(CUDA)
    file(GLOB CUDA_SOURCES "cuda/*.cu")
    message(STATUS "CUDA found. Building with GPU support.")
else()
    message(STATUS "CUDA not found. Building CPU only.")
endif()

# Optional NASM (AVX-512) — only if BUILD_ASM is ON
if(BUILD_ASM)
    find_program(NASM_PATH nasm)
    if(NASM_PATH)
        enable_language(ASM_NASM)
        set(CMAKE_ASM_NASM_FLAGS "-f elf64")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -mavx512f -mavx512dq")
        file(GLOB ASM_SOURCES "asm/*.asm")
        message(STATUS "NASM found. Building with AVX-512 Assembly kernels.")
    else()
        message(STATUS "NASM not found. Skipping Assembly kernels.")
    endif()
else()
    message(STATUS "AVX-512 ASM disabled (use -DBUILD_ASM=ON to enable).")
endif()

# Include directories
include_directories(include)
include_directories(src/tensor)
include_directories(src/solvers)
include_directories(src/geometry)

# Source files
file(GLOB_RECURSE SOURCES "src/*.cpp")

# Executable
add_executable(tensorwerk_engine ${SOURCES} ${CUDA_SOURCES} ${ASM_SOURCES})

# CUDA configuration
if(CUDAToolkit_FOUND)
    target_link_libraries(tensorwerk_engine PRIVATE CUDA::cudart)
    set_target_properties(tensorwerk_engine PROPERTIES CUDA_ARCHITECTURES "80")
endif()

# Installation
# Installation
install(TARGETS tensorwerk_engine DESTINATION bin)

# Testing
enable_testing()
add_executable(unit_tests tests/unit_test.cpp)
target_include_directories(unit_tests PRIVATE src)
add_test(NAME AlgebraTest COMMAND unit_tests)

