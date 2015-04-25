describe('Given the addPanel module', function () {

  describe('with a template that does not exist', function () {

    it('should error ', function (done) {

      var that = {templates: {panel: {}}};

      global.XMLHttpRequest = function() {

        this.readyState = 4;
        this.status = 404;
        this.onload = function() {};
        this.open = function() {};
        this.send = function(){
          this.onload();
        };

        return this;
      };

      var addPanel = require('map-tools/addPanel')(window, that);

      addPanel({templateURL: 'test/fake-test.html'}, function(err) {
        expect(err).to.eql(new Error());
        done()
      });

    });

  });



});
