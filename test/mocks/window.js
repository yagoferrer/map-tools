module.exports = {
  document: {
    createElement: function()
    {
      return {};
    },

    body: {
      appended: {},
      appendChild: function(script) {
        this.appended = script;
        if (global.GMP.maps) {
          global.GMP.maps.mymap.create();
        }

        return script;
      }
    },
    getElementById: function() {},
    querySelector: function() {}
  },
  onload: function(cb) {
    return cb();
  }
};
