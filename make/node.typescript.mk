# ----------------------------------------------------------------------------------------------------------------------

BUILD_DIR  ?= build
SOURCE_DIR ?= lib

TS_EXE   := node_modules/typescript/bin/tsc
TS_SRC   := $(filter-out $(wildcard $(SOURCE_DIR)/*/*.d.ts), $(wildcard $(SOURCE_DIR)/*.ts $(SOURCE_DIR)/*/*.ts))
TS_DST   := $(patsubst $(SOURCE_DIR)/%.ts,$(BUILD_DIR)/%.js,$(TS_SRC))

# RULES: $@: $<

# ----------------------------------------------------------------------------------------------------------------------
# helper rules to makes sure that node_modules commands are installed

$(TS_EXE): node_modules

node_modules: package.json
	@$(NPM) install
	@touch node_modules


# ----------------------------------------------------------------------------------------------------------------------
$(BUILD_DIR):
	@mkdir -p $@

# compile .ts --> .js when the following rules are true
# 1. %.js does not exists
# 2. %.js is older than %.ts
$(BUILD_DIR)/%.js: $(SOURCE_DIR)/%.ts
	@printf '\e[1;32m  %-10s\e[m%s > %s\n' 'compiling' '$<' '$@'
	@$(TS_EXE) $(TS_FLAGS) --out $@ $<

# compile and delete output if error
#	@$(TS_EXE) $(TS_FLAGS) --out $@ $< || case $$? in \
#		1|127) rm $@ \
#		; echo -e '*** Error \x1B[32mmake x\x1B[39m ***' ;; \
#		*) false ;; \
#	esac

# ----------------------------------------------------------------------------------------------------------------------
.PHONY: ts ts-clean

# compile *.ts --> *.js
ts: $(BUILD_DIR) $(TS_EXE) $(TS_DST)

ts-clean:
	rm -f lib/*.js*
	rm -rf build/**

