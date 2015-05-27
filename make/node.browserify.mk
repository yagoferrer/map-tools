# ----------------------------------------------------------------------------------------------------------------------

BUILD_DIR   ?= build
SOURCE_DIR  ?= lib

BSF_FLAGS   ?= --standalone 'mapTools' --debug
BSF_EXE     ?= ./node_modules/browserify/bin/cmd.js
BSF_DIR     ?= $(BUILD_DIR)

# see main Makefile which
#BSF_SRC   := build/empty.js
#BSF_OUT   := dist/empty.js

ifeq (,$(BSF_SRC))
$(error BSF_SRC is undefined)
endif

ifeq (,$(BSF_OUT))
$(error BSF_OUT is undefined)
endif

# ----------------------------------------------------------------------------------------------------------------------
$(BSF_OUT): $(BSF_SRC)
	@printf '\e[1;32m  %-10s\e[m %s > %s\n' 'browserify' '$<' '$@'
	@mkdir -p $(dir $@)
	@$(BSF_EXE) $(BSF_FLAGS) -o $@ -- $<

.PHONY: browser browser-clean

browser: $(BSF_OUT)

browser-clean:
ifneq (,$(wildcard $(BSF_OUT)))
	rm -f $(BSF_OUT)
endif
