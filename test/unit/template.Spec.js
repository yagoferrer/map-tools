describe('Given the template Module', function () {

  var template, that;

  beforeEach(function () {
    that = {
      templates: {
        panel: {}
      }
    };

    global.XMLHttpRequest = function() {

      this.readyState = 4;
      this.status = 404;
      this.onload = function() {}
      this.open = function() {}
      this.responseText =  '<div><button id="clickMe" class="test-button">ctrl 1</button></div>';
      this.send = function(){
        this.onload()
      }

      return this;
    };

  });

  describe('when loading a template already in Cache', function () {

    it('should return the value from cache', function () {

      that.templates.panel['template.html'] = '<div></div>';
      template = require('template');
      template = new template(that);
      var result = template.load('panel', 'template.html');
      expect(result).to.eql(that.templates.panel['template.html']);
    });
  });

  describe('when loading a template that does not exist', function () {
    it('should return an error in the first callback argument', function (done) {

      template = require('template');
      template = new template(that);

      template.load('panel', 'fake.html', function(err) {
        done();
        expect(err).to.eql(new Error());
      });
    });
  });

});
