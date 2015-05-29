/// <reference path="typings/tsd.d.ts"/>
var UpdateFeature = (function () {
    function UpdateFeature(that) {
        this.that = that;
    }
    UpdateFeature.prototype.updateStyle = function (f, style) {
        if (typeof style === 'function') {
            var styleOptions = style.call(f);
            return this.that.instance.data.overrideStyle(f, styleOptions);
        }
        this.that.instance.data.overrideStyle(f, style);
    };
    UpdateFeature.prototype.findAndUpdate = function (args, options) {
        if (args.data && args.data.uid) {
            return this.updateFeature(args, options);
        }
        if (args.uid && mapTools.maps[this.that.id].json && mapTools.maps[this.that.id].json.all[args.uid]) {
            return this.updateFeature(mapTools.maps[this.that.id].json.all[args.uid], options);
        }
    };
    UpdateFeature.prototype.update = function (args, options) {
        var type = Object.prototype.toString.call(args);
        if (type === '[object Array]') {
            var feature, x;
            for (x in args) {
                if (args.hasOwnProperty(x)) {
                    feature = args[x];
                    this.findAndUpdate(feature, options);
                }
            }
        }
        if (type === '[object Object]') {
            this.findAndUpdate(args, options);
        }
    };
    UpdateFeature.prototype.updateFeature = function (feature, options) {
        if (options.style) {
            this.updateStyle(feature, options.style);
        }
    };
    return UpdateFeature;
})();
module.exports = UpdateFeature;
