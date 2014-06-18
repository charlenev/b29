/*global defineSuite*/
defineSuite([
         'Scene/WebMapTileServiceImageryProvider',
		 'Core/defined',
         'Core/loadImage',
         'Core/DefaultProxy',
         'Core/Rectangle',
         'Core/Math',
        'Core/jsonp',		 
         'Core/GeographicTilingScheme',
         'Scene/Imagery',
         'Scene/ImageryLayer',
         'Scene/ImageryProvider',
         'Scene/ImageryState',
         'ThirdParty/when'
     ], function(
         WebMapTileServiceProvider,
		 defined,
         loadImage,
         DefaultProxy,
         Rectangle,
         CesiumMath,
		 jsonp,
         GeographicTilingScheme,
         Imagery,
         ImageryLayer,
         ImageryProvider,
         ImageryState,
         when) {
    "use strict";
	
	/*	
		http://www.maps.bob/maps.cgi?service=WMTS&request=GetTile&version=1.0.0&
		layer=etopo2&style=default&format=image/png&TileMatrixSet=WholeWorld_CRS_84&
		TileMatrix=10m&Tiletilerow=1&Tiletilecol=3
	*/
	
	
    afterEach(function() {
        jsonp.loadAndExecuteScript = jsonp.defaultLoadAndExecuteScript;
        loadImage.createImage = loadImage.defaultCreateImage;
    });

	
	it('conforms to ImageryProvider interface ',function(){
		expect(WebMapTileServiceProvider).toConformToInterface(ImageryProvider);
	});	
	

	
	it('requires the url to be specified',function(){
		function createWithoutUrl(){
			return new WebMapTileServiceProvider({
				layer : 'someLayer',
				parameters : {
					tilerow : 2,
					tilecol : 1,
					tilematrix : 'matrix',
					tilematrixset : 'reference' 
				}
			});		
		}
        expect(createWithoutUrl).toThrowDeveloperError();				
	});
	
	
	
	it('requires layer to be specified',function(){
		function createWithoutUrl(){
			return new WebMapTileServiceProvider({
				url : 'made/up',
				parameters : {
					tilerow : 2,
					tilecol : 1,
					tilematrix : 'matrix',
					tilematrixset : 'reference' 
				}
			});
		}
        expect(createWithoutUrl).toThrowDeveloperError();				
	});
	

	it('requires tilematrix to be specified',function(){
		function createWithoutUrl(){
			return new WebMapTileServiceProvider({
				url : 'made/up',
				layer : 'someLayer',
				parameters : {
					tilerow : 2,
					tilecol : 1,
					tilematrixset : 'reference' 
				}
			});
		}
        expect(createWithoutUrl).toThrowDeveloperError();				
	});

	it('requires tilematrixset to be specified',function(){
		function createWithoutUrl(){
			return new WebMapTileServiceProvider({
				url : 'made/up',
				layer : 'someLayer',				
				parameters : {
					tilerow : 2,
					tilecol : 1,
					tilematrix : 'matrix' 
				}
			});
		}
        expect(createWithoutUrl).toThrowDeveloperError();				
	});
	
		
	it('supports a ? at the end of the url', function(){
		var description = {
			url : 'made/up?',
			layer : 'someLayer',
			parameters : {
				tilerow : 2,
				tilecol : 1,
				tilematrix : 'matrix',
				tilematrixset : 'reference' 				
			}
		};
		var provider = new WebMapTileServiceProvider(description);
		
		waitsFor(function() {
            return provider.ready;
        }, 'imagery provider to become ready');
		
        runs(function() {
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
	
	
	
	it('supports an & at the end of the url',function(){
		var description = {
			url : 'made/up?foo=bar&',
			layer : 'someLayer',
			parameters : {
				tilerow : 2,
				tilecol : 1,
				tilematrix : 'matrix',
				tilematrixset : 'reference' 						
			}
		};
		var provider = new WebMapTileServiceProvider(description);
	
        waitsFor(function() {
            return provider.ready;
        }, 'imagery provider to become ready');

        runs(function() {
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
	
	
	
	it('contains a query at the end of the url', function(){
		var description = {
			url : 'made/up?foo=bar',
			layer : 'someLayer',
			parameters : {
				tilerow :2,
				tilecol : 1,
				tilematrix : 'matrix',
				tilematrixset : 'reference' 						
			}
		};
		var provider = new WebMapTileServiceProvider(description);
	
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
	
	
	
	it('routes requests through a proxy if one is specified', function(){
		var proxy = new DefaultProxy('/proxy/');
		var description = {
			url : 'made/up',
			layer : 'someLayer',
			proxy : proxy,
			parameters : {
				tilerow : 2,
				tilecol : 1,
				tilematrix : 'matrix',
				tilematrixset : 'reference' 						
			}
		};
		var provider = new WebMapTileServiceProvider(description);
	
		waitsFor(function(){
			return provider.ready;
		}, 'imagery provider to become ready');
		
		var img;

        runs(function() {
            loadImage.createImage = function(url, crossOrigin, deferred) {
                expect(url.indexOf(proxy.getURL('made/up'))).toEqual(0);
                expect(description.proxy).toEqual(proxy);

                // Just return any old image.
                return loadImage.defaultCreateImage('Data/Images/Green4x4.png', crossOrigin, deferred);
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

		
	
	it('includes specified parameters in the url', function(){
		var description = {
			url : 'made/up',
			layer : 'someLayer',
			parameters : {
				tilerow : 2,
				tilecol : 1,
				tilematrix : 'matrix',
				tilematrixset : 'reference', 						
				something : 'test',
				another : false
			}
		};
		var provider = new WebMapTileServiceProvider(description);
	
		waitsFor(function(){
			return provider.ready;		
		}, 'imagery provider to become ready');
		
		runs(function(){
			var calledLoadImage=false;
			loadImage.createImage=function(url, crossOrigin, deferred){				
				expect(url).toMatch('something=test');
				expect(url).toMatch('another=false');
				calledLoadImage=true;
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
            layer : 'someLayer',
			parameters : {
				tilerow : 2,
				tilecol : 1,
				tilematrix : 'matrix',
				tilematrixset : 'reference' 						
			}
        };
        var provider = new WebMapTileServiceProvider(description);

        expect(description.url).toEqual('made/up');
        expect(description.layer).toEqual('someLayer');

        waitsFor(function() {
            return provider.ready;
        }, 'imagery provider to become ready');

        var img;

        runs(function() {
            loadImage.createImage = function(url, crossOrigin, deferred) {
                // Just return any old image.
                return loadImage.defaultCreateImage('Data/Images/Green4x4.png', crossOrigin, deferred);
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
	
	
	
	it('raises error when image cannot be loaded' , function(){
		var description = {
			url : 'made/up',
			layer : 'someLayer',
			parameters : {
				tilerow : 2,
				tilecol : 1,
				tilematrix : 'matrix',
				tilematrixset : 'reference' 						
			}
		};
		var provider = new WebMapTileServiceProvider(description);		
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
            if (tries === 2)              // valid URL
                return loadImage.defaultCreateImage('Data/Images/Green4x4.png', crossOrigin, deferred);            

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