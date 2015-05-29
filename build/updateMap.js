/// <reference path="maps.ts"/>
var maps = require('./maps');
var UpdateMap = (function () {
    function UpdateMap(that) {
        this.that = that;
    }
    UpdateMap.prototype.updateMap = function (args) {
        var mapOptions = maps.mapOptions(args);
        return this.that.instance.setOptions(mapOptions);
    };
    return UpdateMap;
})();
module.exports = UpdateMap;
