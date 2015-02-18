var UglifyJS = require('uglify-js');
var fs = require('fs');
var file = 'dist/map-tools.js';

var result = UglifyJS.minify(file, {
  mangle: true,
  compress: {
    sequences: true,
    dead_code: true,
    conditionals: true,
    booleans: true,
    unused: true,
    if_return: true,
    join_vars: true,
    drop_console: true
  }
});

var pjson = require('../package.json');
var credits = '/* map-tools.js ' + pjson.version + ' MIT License. ' + new Date().getFullYear() + ' Yago Ferrer <yago.ferrer@gmail.com> */\n';
fs.writeFileSync('dist/map-tools.min.js', credits + result.code);

var data = fs.readFileSync(file, 'utf-8');
fs.writeFileSync('dist/map-tools.js', credits + data, 'utf-8');

