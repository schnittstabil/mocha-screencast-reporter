describe('foo', function(){

  it('should be foo', function(){
    expect('foo').to.be('foo');
  });

  it('should be bar (I will fail!)', function(){
    expect('foo').to.be('bar');
  });

  it('should be foo after 5 seconds', function(done){
    // set test-specific timeout:
    this.timeout(10000);

    // long running test:
    setTimeout(function(){
      expect('foo').to.be('foo');
      done();
    }, 5000);
  });

});
