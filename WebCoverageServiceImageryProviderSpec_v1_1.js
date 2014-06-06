defineSuite( [
         'Scene/WebCoverageServiceImageryProvider_v1_1',
         'Core/defined',
         'Core/jsonp',
         'Core/loadImage',
         'Core/DefaultProxy',
         'Scene/Imagery',
         'Scene/ImageryLayer',
         'Scene/ImageryProvider',
         'Scene/ImageryState',
         'ThirdParty/when'
     ], function(
         WebCoverageServiceProvider,
         defined,
         jsonp,
         loadImage,
         DefaultProxy,
         Imagery,
         ImageryLayer,
         ImageryProvider,
         ImageryState,
         when) {
    "use strict";
	

	
	it('conforms to ImageryProvider interface', function(){
		expect(WebCoverageServiceProvider).toConformToInterface(ImageryProvider);	
	});
	
	
	
	it('requires identifier', function(){
		var description = {
				url : 'made/up'
		};
		function createWithoutUrl(){
			return new WebCoverageServiceProvider(description);
		}
		expect(createWithoutUrl).toThrowDeveloperError() ;
	});
	
	
	
	it('requires url', function(){
		var description = {
				identifier : 'id'
		};
		function createWithoutUrl(){
			return new WebCoverageServiceProvider(description);
		}
		expect(createWithoutUrl).toThrowDeveloperError();	
	});
	
	
	
	it('includes specified parameters in url', function(){
		var description = {
			url : 'made/up',
			identifier : 'id',
			parameters : {
				something : 'test',
				another : false
			}
		};
		var provider = new WebCoverageServiceProvider(description);
		
		waitsFor(function(){
			return provider.ready;			
		}, 'imagery provider to become ready');
		
		
		runs(function(){
			var calledLoadImage = false;
			loadImage.createImage = function(url , crossOrigin, deferred){				
				expect(url).toMatch('something=test');
				expect(url).toMatch('another=false');
				deferred.resolve();
				calledLoadImage = true;	
				return undefined;				
			};
			provider.requestImage();
			expect(calledLoadImage).toEqual(true);
		});		
	});
	
	
	
	it('contains a ? at the end of the url', function(){
		var description = {
			url : 'made/up?',
			identifier : 'id'
		};
		var provider=new WebCoverageServiceProvider(description);
	
		waitsFor(function(){
			return provider.ready;
		}, 'imagery provider to become ready');
		
		runs(function(){		
			var calledLoadImage = false;
            loadImage.createImage = function(url, crossOrigin, deferred) {
                var firstQuestionMarkIndex = url.indexOf('?');
                expect(firstQuestionMarkIndex).toBeGreaterThan(-1);

                var secondQuestionMarkIndex = url.indexOf('?', firstQuestionMarkIndex + 1);
                expect(secondQuestionMarkIndex).toBeLessThan(0);

                calledLoadImage = true;
                deferred.resolve();
                return undefined;
            };

            provider.requestImage();
            expect(calledLoadImage).toEqual(true);
		});
	});
	
	
	
	
	it('contains an & at the end of the url', function(){
		var description = {
			url : 'made/up?foo=bar&',
			identifier : 'id'
		};
		var provider = new WebCoverageServiceProvider(description);
		
		waitsFor(function(){
			return provider.ready;		
		}, 'imagery provider to become ready');
		
		runs(function(){
			var calledLoadImage = false;
            loadImage.createImage = function(url, crossOrigin, deferred) {
                var firstQuestionMarkIndex = url.indexOf('?');
                expect(firstQuestionMarkIndex).toBeGreaterThan(-1);

                var secondQuestionMarkIndex = url.indexOf('?', firstQuestionMarkIndex + 1);
                expect(secondQuestionMarkIndex).toBeLessThan(0);

                var doubleAmpersandIndex = url.indexOf('&&');
                expect(doubleAmpersandIndex).toBeLessThan(0);

                calledLoadImage = true;
                deferred.resolve();
                return undefined;
            };

            provider.requestImage();
            expect(calledLoadImage).toEqual(true);
		});
	});
	
	
	
	it('contains a query at the end of the url',function(){
		var description = {
			url : 'made/up?foo=bar',
			identifier :'id'
		};
		var provider = new WebCoverageServiceProvider(description);
		
		waitsFor(function(){
			return provider.ready;
		}, 'imagery provider to become ready');
		
        runs(function() {
            var calledLoadImage = false;
            loadImage.createImage = function(url, crossOrigin, deferred) {
                var firstQuestionMarkIndex = url.indexOf('?');
                expect(firstQuestionMarkIndex).toBeGreaterThan(-1);

                var secondQuestionMarkIndex = url.indexOf('?', firstQuestionMarkIndex + 1);
                expect(secondQuestionMarkIndex).toBeLessThan(0);

                var delimitedQueryParameterIndex = url.indexOf('foo=bar&');
                expect(delimitedQueryParameterIndex).not.toBeLessThan(0);

                calledLoadImage = true;
                deferred.resolve();
                return undefined;
            };

            provider.requestImage();
            expect(calledLoadImage).toEqual(true);
		});
	});
	
	
	
   it('requestImage returns a promise for an image and loads it for cross-origin use', function() {
        var description = {
            url : 'made/up',
			identifier : 'id'
        };
		var provider = new WebCoverageServiceProvider(description);

        expect(description.url).toEqual('made/up');
        expect(description.identifier).toEqual('id');

        waitsFor(function() {
            return provider.ready;
        }, 'imagery provider to become ready');

        var img;

        runs(function() {
            loadImage.createImage = function(url, crossOrigin, deferred) {
                // Just return any old image.
                return loadImage.defaultCreateImage('Data/Images/Blue10x10.png', crossOrigin, deferred);
            };

            when(provider.requestImage(), function(image) {
                img = image;
            });
        });
		
        waitsFor(function() {
            return defined(img);
        }, 'requested tile to be loaded');

        runs(function() {
            expect(img).toBeInstanceOf(Image);
        });		
	});
	
	
	
    it('routes requests through a proxy if one is specified', function() {
        var proxy = new DefaultProxy('/proxy/');
		var description = {
            url : 'made/up',
            identifier : 'id',
            proxy : proxy
        };
        var provider = new WebCoverageServiceProvider(description);

        waitsFor(function() {
            return provider.ready;
        }, 'imagery provider to become ready');

        var img;

        runs(function() {
            loadImage.createImage = function(url, crossOrigin, deferred) {
                expect(url.indexOf(proxy.getURL('made/up'))).toEqual(0);
                expect(provider.proxy).toEqual(proxy);

                // Just return any old image.
                return loadImage.defaultCreateImage('Data/Images/Blue10x10.png', crossOrigin, deferred);
            };

            when(provider.requestImage(), function(image) {
                img = image;
            });
        });

        waitsFor(function() {
            return defined(img);
        }, 'requested tile to be loaded');

        runs(function() {
            expect(img).toBeInstanceOf(Image);
        });
    });
	
	
	
	it('raises error event when image cannot be loaded', function() {
		var description = {
            url : 'made/up',
            identifier : 'id'
        };
        var provider = new WebCoverageServiceProvider(description);

        var layer = new ImageryLayer(provider);

        var tries = 0;
        provider.errorEvent.addEventListener(function(error) {
            expect(error.timesRetried).toEqual(tries);
            ++tries;
            if (tries < 3) 
                error.retry = true;            
        });

        loadImage.createImage = function(url, crossOrigin, deferred) {
            // Succeed after 2 tries
            if (tries === 2)                 // valid URL
                return loadImage.defaultCreateImage('Data/Images/Blue10x10.png', crossOrigin, deferred);
            
            // invalid URL
            return loadImage.defaultCreateImage(url, crossOrigin, deferred);
        };

        waitsFor(function() {
            return provider.ready;
        }, 'imagery provider to become ready');

        var imagery;
        runs(function() {
            imagery = new Imagery(layer, 0, 0, 0);
            imagery.addReference();
            layer._requestImagery(imagery);
        });

        waitsFor(function() {
            return imagery.state === ImageryState.RECEIVED;
        }, 'image to load');

        runs(function() {
            expect(imagery.image).toBeInstanceOf(Image);
            expect(tries).toEqual(2);
            imagery.releaseReference();
        });
    });	
});