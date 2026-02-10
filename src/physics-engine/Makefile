BUILD_DIR = build
TARGET_NAME = tensorwerk_engine
CMAKE_FLAGS = -DCMAKE_BUILD_TYPE=Release

# Check if CUDA is requested (passed from root Makefile)
ifeq ($(USE_CUDA),ON)
    CMAKE_FLAGS += -DUSE_CUDA=ON
endif

ifeq ($(USE_AVX512),ON)
    CMAKE_FLAGS += -DUSE_AVX512=ON
endif

all: build

build:
	mkdir -p $(BUILD_DIR)
	cd $(BUILD_DIR) && cmake .. $(CMAKE_FLAGS)
	cd $(BUILD_DIR) && $(MAKE)

clean:
	rm -rf $(BUILD_DIR)

test:
	@echo "[Physics Engine] Running tests..."
	cd $(BUILD_DIR) && ctest --output-on-failure --verbose

.PHONY: all build clean test
