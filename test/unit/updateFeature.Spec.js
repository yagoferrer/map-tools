describe('Given the updateFeature Module', function() {
  var that, updateFeature, spy;
  beforeEach(function(){

    mapTools.maps.mymap.json.all = {
      "1": {data: {uid: 1}}
    };

    that = {
      id: 'mymap',
      instance : {
        data :{/* overrideStyle mock*/}
      }
    };

    spy = sinon.spy();
    that.instance.data.overrideStyle = spy;
    updateFeature = require('updateFeature');
    updateFeature = new updateFeature(that);
  });


  it('should update a Feature', function() {
    updateFeature.update({data: {uid:1}}, {style: {fillColor: '#ffffff'}});
    expect(spy).to.have.been.calledWith({data: {uid:1}},{fillColor: '#ffffff'});
  });


  it('should update a Feature from a filter data result', function() {
    updateFeature.update({uid:1}, {style: {fillColor: '#ffffff'}});
    expect(spy).to.have.been.calledWith({data: {uid:1}},{fillColor: '#ffffff'});
  });


  it('should update an array of Features', function() {
    updateFeature.update([{data: {uid:1}}, {data: {uid:2}}], {style: {fillColor: '#ffffff'}});
    expect(spy).to.have.been.calledTwice;
    expect(spy.firstCall.args).to.eql([{data: {uid:1}}, {fillColor: '#ffffff'}]);
    expect(spy.secondCall.args).to.eql([{data: {uid:2}}, {fillColor: '#ffffff'}]);
  });


  it('should update the Features based on the styling function', function() {
    var spyStyling = sinon.spy();
    updateFeature.update({data: {uid:1}}, {style: spyStyling});
    expect(spyStyling).to.have.been.called;
  });


});
