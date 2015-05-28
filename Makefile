# $@: $<

## prologue
# ----------------------------------------------------------------------------------------------------------------------
#

MAKEFLAGS += --warn-undefined-variables
MAKE  := /usr/bin/make

SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help
.SUFFIXES:


## Always use GNU Make
# ----------------------------------------------------------------------------------------------------------------------
#
MAKE_VERSION := $(shell $(MAKE) --version)
ifneq ($(firstword $(MAKE_VERSION)),GNU)
$(error Use GNU Make)
endif

# ----------------------------------------------------------------------------------------------------------------------

CWD  := $(realpath $(dir $(lastword $(MAKEFILE_LIST))))
NODE ?= node
NPM  ?= npm

NODE_PATH=build

# Project specific vars
# ----------------------------------------------------------------------------------------------------------------------

BUILD_DIR     := build
SOURCE_DIR    := lib

TS_FLAGS   := --target ES5 --module commonjs
TS_SRC     := lib/*.ts
BSF_FLAGS  := --standalone mapTools --debug --verbose
BSF_DIR    := $(BUILD_DIR)/
BSF_SRC    := $(BUILD_DIR)/mapTools.js
BSF_OUT    := dist/map-tools.js

# include sub Makefiles
# ----------------------------------------------------------------------------------------------------------------------

include make/common.debug.mk

include make/node.typescript.mk
include make/node.browserify.mk

# app targets calling other targets in sub Makefile
# ----------------------------------------------------------------------------------------------------------------------
.PHONY: compile clean

clean: ts-clean browser-clean
	@printf '\e[1;32m  %-10s\e[m%s\n' 'done'

compile: ts browser
	@printf '\e[1;32m  %-10s\e[m%s\n' 'done'
