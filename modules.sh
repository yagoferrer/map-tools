#!/bin/bash
for file in build/*.js; do
  if grep -e "module.exports" $file; then
   continue;
  fi
  a=${file##*/} # cleans up path
  b=${a%.*} # removes extension
  c="$(tr '[:lower:]' '[:upper:]' <<< ${b:0:1})${b:1}" # Uppercase
  printf "\nmodule.exports=${c};" >> "$file"
done
