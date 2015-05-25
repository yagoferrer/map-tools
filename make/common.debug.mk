
export DEBUG=""
export DEBUG_LEVEL="verbose"

.PHONY: print-vars debug-help
# ----------------------------------------------------------------------------------------------------------------------

print-vars:
	@$(MAKE) -pn | grep -A1 "^# makefile"| grep -v "^#\|^--" | sort | uniq

# Helper: make print-SRC would print the variable
print-%:
	@echo $* = $($*)

debug-help:
	@echo "-------------------"

silent:
	@:
