function clone(o) {
  var out, v, key;
  out = Array.isArray(o) ? [] : {};
  for (key in o) {
    v = o[key];
    out[key] = (typeof v === "object") ? clone(v) : v;
  }
  return out;
}

module.exports = {
  clone: clone
}
