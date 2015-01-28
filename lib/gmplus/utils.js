function clone(o) {
  var out, v, key;
  out = Array.isArray(o) ? [] : {};
  for (key in o) {
    v = o[key];
    out[key] = (typeof v === "object") ? clone(v) : v;
  }
  return out;
}

function createUid() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r, v;
    r = Math.random() * 16 | 0;
    v = c === 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}

/**
 * Transforms flat keys to Setters. For example visible becomes: setVisible.
 * @param options
 * @returns {{count: number, setterKey: *, setters: {}}}
 * @private
 */
function createSetters(options)
{
  var setters = {};
  var count = 0;
  var setterKey;


  for (var key in options) {
    setterKey = 'set' + key[0].toUpperCase() + key.slice(1);
    setters[setterKey] = options[key];
    count++;
  }

  var result = {
    count: count,
    setterKey: setterKey,
    setters: setters
  };

  return result;
}

module.exports = {
  clone: clone,
  createUid: createUid,
  createSetters: createSetters
}
