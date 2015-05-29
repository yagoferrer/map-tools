var Template = (function () {
    function Template(that) {
        this.that = that;
    }
    Template.prototype.load = function (type, url, cb) {
        var _this = this;
        if (this.that.templates[type][url]) {
            return this.that.templates[type][url];
        }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    _this.that.templates[type][url] = xhr.responseText;
                    cb(false, xhr.responseText);
                }
                else {
                    cb(new Error(xhr.statusText));
                }
            }
        };
        xhr.send(null);
    };
    return Template;
})();
module.exports = Template;
