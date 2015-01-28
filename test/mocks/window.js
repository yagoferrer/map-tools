module.exports = {
  document: {
    createElement: function()
    {
      return {}
    },

    body: {
      appendChild: function(script) {
        return script;
      }
    },
    getElementById: function() {}
  }
};
