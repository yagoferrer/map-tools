describe('Given the updateFeature Module', function() {
  var global, that;
  beforeEach(function(){
    global = {
      GMP: {
        maps: {mymap: {}}}
    };

    that = {
      id: 'mymap',
      instance : {
        data :{/* overrideStyle mock*/}
      }
    };

  });

  it('should update a Feature', function() {

    var spy = sinon.spy();

    that.instance.data.overrideStyle = spy;

    var updateFeature = require('map-tools/updateFeature')(global, that);

    updateFeature({uid:1}, {style: {fillColor: '#ffffff'}});

    expect(spy).to.have.been.calledWith({uid:1},{fillColor: '#ffffff'});

  });

   it('should update an array of Features', function() {

    var spy = sinon.spy();

    that.instance.data.overrideStyle = spy;

    var updateFeature = require('map-tools/updateFeature')(global, that);

    updateFeature([{uid:1}, {uid:2}], {style: {fillColor: '#ffffff'}});

    expect(spy).to.have.been.calledTwice;

    expect(spy.firstCall.args).to.eql([{uid:1}, {fillColor: '#ffffff'}]);

    expect(spy.secondCall.args).to.eql([{uid:2}, {fillColor: '#ffffff'}]);

  });



});
