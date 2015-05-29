var Locate = (function () {
    function Locate() {
    }
    Locate.prototype.locate = function () {
        var center = this.instance.getCenter();
        return { lat: center.lat(), lng: center.lng() };
    };
    return Locate;
})();
module.exports = Locate;
