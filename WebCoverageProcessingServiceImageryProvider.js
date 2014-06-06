/*global define*/
define([
        '../Core/clone',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/freezeObject',
        '../Core/DeveloperError',
        '../Core/Event',
        '../Core/Rectangle',
        '../Core/Credit',
        './ImageryProvider',
        '../Core/GeographicTilingScheme'
    ], function(
        clone,
        defaultValue,
        defined,
        defineProperties,
        freezeObject,
        DeveloperError,
        Event,
        Rectangle,
        Credit,
        ImageryProvider,
        GeographicTilingScheme) {
    "use strict";
	

    /**
     * Provides tiled imagery hosted by a Web Coverage Processing Service (WCPS) server.
     *
     * @alias WebCoverageProcessingServiceImageryProvider
     * @constructor
     *
     * @param {String} description.url The URL of the WMTS service.
     * @param {Object} [description.parameters=WebCoverageProcessingServiceImageryProvider.DefaultParameters] Additional parameters to pass to the WCPS server in the URL.
     * @param {Credit|String} [description.credit] A credit for the data source, which is displayed on the canvas.
     * @param {Object} [description.proxy] A proxy to use for requests. This object is
     *        expected to have a getURL function which returns the proxied URL, if needed.
	 */	
	var WebCoverageProcessingServiceImageryProvider = function WebCoverageProcessingServiceImageryProvider(description){
	    var description = defaultValue(description, {});
	
		// Test if required parameters are defined
		// Throws an exception in the other case
		if(!defined(description.url))
			throw new DeveloperError('description.url is required.');		
			
		if(!defined(description.identifier))
			throw new DeveloperError('desccription.identifier is required.');
		
		this._id = description.identifier;
		this._url = description.url;
		this._proxy = description.proxy;

        // Merge the parameters with the defaults, and make all parameter names lowercase
        var parameters = clone(WebCoverageProcessingServiceImageryProvider.DefaultParameters);
        if (defined(description.parameters)) {
            for (var parameter in description.parameters) {
                if (description.parameters.hasOwnProperty(parameter)) {
                    var parameterLowerCase = parameter.toLowerCase();
                    parameters[parameterLowerCase] = description.parameters[parameter];
                }
            }
        }		
		
		// Defines the value of the dimensions (number of dimensions)
		// If it cannot be find in the list of parameters, we fix it at 2.
		this._dim = defaultValue(parameters.dimensions, 2);				
		// Defines the value of the minimum level of detail, 0 for this time.
		this._minLOD = defaultValue(parameters.minimumLOD, 0);		
		// Defines the value of the maximum level of detail, 20 for this time.
		this._maxLOD = defaultValue(parameters.maximumLOD, 20);	
		// Defines the tile which is treated.
		// By default, we fix the first tile, in the top-left-corner
		this._numCol =defaultValue(parameters.col, 0);				
		this._numRow = defaultValue(parameters.row, 0);
		// Defines the type of format of the image which is returned.
		if(parameters.format !== 'image/tiff' || parameters.format !== 'image/tif')
			this._format = 'image/tiff';
		else 
			this._format = parameters.format;
	

		this._errorEvent = new Event();
		
	    var credit = description.credit;
        if (typeof credit === 'string') 
            credit = new Credit(credit);
        this._credit = credit;
		this._ready = true;

		// Defines a default bounding box to which represent the cover of the image
		var defaultBBox = [-180, -90, 180, 90];
		this._bbox = parameters.bbox;
		// If this._bbox is not defined, we will use this default bounding box
        var rectangle = defaultValue(this._bbox, defaultBBox);
        this._tilingScheme = new GeographicTilingScheme({
            rectangle : rectangle
        });	
		
		this._parameters = parameters;
	};	

	
	/**
	*	All properties of the request
	*/	
	defineProperties(WebCoverageProcessingServiceImageryProvider.prototype, {
        /**
         * Gets the proxy used by this provider.
         * @memberof WebCoverageProcessingServiceImageryProvider.prototype
         * @type {Proxy}
         */
		proxy : {
			get : function(){
				return this._proxy;
			}},
		
        /**
         * Gets the credit to display when this imagery provider is active. Typically this is used to credit
         * the source of the imagery.  This function should not be called before {@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
         * @memberof WebCoverageProcessingServiceImageryProvider.prototype
         * @type {Credit}
         */		
		credit : {
			get : function(){
				return this._credit;
			}},

        /**
         * Gets the URL of the WCPS server.
         * @memberof WebCoverageProcessingServiceImageryProvider.prototype
         * @type {String}
         */			
		url : {
			get : function(){
				return this._url;
			}},
			
			
        /**
         * Gets an event that is raised when the imagery provider encounters an asynchronous error.
         * @memberof WebCoverageProcessingServiceImageryProvider.prototype
         * @type {Event}
         */			
		errorEvent : {
			get : function() {
				return this._errorEvent;
			}},
		
		/**
         * Gets a value indicating whether or not the provider is ready for use.
         * @memberof WebCoverageProcessingServiceImageryProvider.prototype
         * @type {Boolean}
         */
		ready : {
			get : function() {
				return this._ready;
			}},
			
        /**
         * Gets the tiling scheme used by this provider.  This function should not be called before 
         * {@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
         * @memberof WebCoverageProcessingServiceImageryProvider.prototype
         * @type {TilingScheme}
         */			
		tilingScheme : {
			get : function(){
				if(!this._ready){
					throw new DeveloperError('tilingScheme must not be called before imagery provider is ready.');
				}
				return this._tilingScheme;
			}},
			
		/*rectangle : {
			get : function(){
				if(!this._ready){
					throw new DeveloperError('rectangle must not be called before imagery provider is ready.');
				}
				return this._tilingScheme.rectangle;
			}},*/
			
		/**
		*	Gets the bounding box used by this provider. This function should not be called before
		*	{@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
		*	@memberof WebCoverageProcessingServiceImageryProvider.prototype
		*	@type {Array}
		*/				
		bbox : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('bbox must not be called before imagery provider is ready.');
				return this._bbox;
			}},					
			
			
		/**
		*	Gets the maximum level of detail that can be requested. This function shoould not be called before
		*	{@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
		*	@memberof WebCoverageProcessingServiceImageryProvider.prototype
		*	@type {Number}
		*/
		maximumLevel : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('maximumLevel must not be called before imagery provider is ready.');
				return this._maxLOD;
			}},
		
		
		/**
		*	Gets the minimum level of detail that can be requested. This function should not be called before
		*	{@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
		*	@memberof WebCoverageProcessingServiceImageryProvider.prototype
		*	@type {Number}
		*/
		minimumLevel : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('minimumLevel must not be called before imagery provider is ready.');				
				return this._minLOD;
			}},
		
		
		/**
		*	Gets the number of dimensions which are defined. This function should not be called before
		*	{@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
		*	@memberof WebCoverageProcessingServiceImageryProvider.prototype
		*	@type {Number}
		*/
		dimensions : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('dimensions must not be called before imagery provider is ready.');				
				return this._dim;
			}},
			
		/**
		*	Gets the format of the image which is requested. This function should not be called before
		*	{@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
		*	@memberof WebCoverageProcessingServiceImageryProvider.prototype
		*	@type {String}
		*/			
		format : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('format must not be called before imagery provider is ready.');				
				return this._format;
			}},

		/**
		*	Gets the number of the tile which is treated (X axis). This function should not be called before
		*	{@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
		*	@memberof WebCoverageProcessingServiceImageryProvider.prototype
		*	@type {Number}
		*/
		numCol : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('numCol must not be called before imagery provider is ready.');				
				return this._numCol;
			}},
			
		/**
		*	Gets the number of the tile which is treated (Y axis). This function should not be called before
		*	{@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
		*	@memberof WebCoverageProcessingServiceImageryProvider.prototype
		*	@type {Number}
		*/
		numRow : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('numRow must not be called before imagery provider is ready.');				
				return this._numRow;
			}},
		
		/**
		*	Gets the identifier of the coverage. This function should not be called before
		*	{@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
		*	@memberof WebCoverageProcessingServiceImageryProvider
		*	@type {String}
		*/		
		identifier : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('identifier must not be called before imagery provider is ready.');
				return this._id;
			}},

		/**
         * Gets a value indicating whether or not the images provided by this imagery provider
         * include an alpha channel.  If this property is false, an alpha channel, if present, will
         * be ignored.  If this property is true, any images without an alpha channel will be treated
         * as if their alpha is 1.0 everywhere.  When this property is false, memory usage
         * and texture upload time are reduced.
         * @type {Boolean}
         */
		 hasAlphaChannel : {
			get : function(){
				return true;			
			}}
	});
	
	
	/**
	*	Build the URL.
	*
	*	@param {imageryProvider} imageryProvider The Imagery Provider used.
     *	@param {Number} x The tile X coordinate.
     *	@param {Number} y The tile Y coordinate.
     *	@param {Number} level The tile level.
	*/	
	function buildImage(imageryProvider, x, y, level){
		// Recovers the url 
		var url = imageryProvider._url;
		
		// Adds a separator between parameters of the request
        var indexOfQuestionMark = url.indexOf('?');
        if (indexOfQuestionMark >= 0 && indexOfQuestionMark < url.length - 1) {
            if (url[url.length - 1] !== '&') 
                url += '&';            
        } else if (indexOfQuestionMark < 0) 
            url += '?';
        
		
		var parameters = imageryProvider._parameters;
		// Creates the url based on the list of parameters
		for(parameter in parameters)
			if(parameters.hasOwnProperty(parameter))
				url += parameter + '='  + parameters[parameter] + '&';
		
	
		// Serie of tests which determine if the url is great defined
		// If some of these parameters are not defined, we fix their value
		
		// We test the name of the service, the request, format of the image requested and the bounding box
		if(!defined(parameters.service))
			url += 'service=WCPS&';
		
		if(!defined(parameters.request))
			url += 'request=GetCoverage&';
					
		if(!defined(parameters.format))
			url += 'format=image/tiff&';						
		
		if(!defined(parameters.bbox)){
			var nativeRectangle = imageryProvider._tilingScheme.tileXYToNativeRectangle(x, y, level);
            var bbox = nativeRectangle.west + ',' + nativeRectangle.south + ',' + nativeRectangle.east + ',' + nativeRectangle.north;
			url += 'BoundingBox=' + bbox + 'urn:ogc:def:crs:EPSG::4326&'; 		
		}

	/*	if(!defined(parameters.numrow))
			url += 'TileRow=' + imageryProvider._numRow+'&';
				
		if(!defined(parameters.numcol))
			url += 'TileCol=' + imageryProvider._numCol+'&' ;
			*/
			
			
        var proxy = imageryProvider._proxy;
        if (defined(proxy)) 
            url = proxy.getURL(url);
       
        return url;	
	};
	
	
	
    /**
     *	Requests the image for a given tile.  This function should not be called before 
	 *	{@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
     *
     * @memberof WebCoverageProcessingServiceImageryProvider
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level.
     *
     * @returns {Promise} A promise for the image that will resolve when the image is available, or
     *          undefined if there are too many active requests to the server, and the request
     *          should be retried later.  The resolved image may be either an
     *          Image or a Canvas DOM object.
     * @exception {DeveloperError} <code>requestImage</code> must not be called before the imagery provider is ready.
     */	
	WebCoverageProcessingServiceImageryProvider.prototype.requestImage=function(x,y,level){
		if(!this._ready)
			throw new DeveloperError('requestImage must not be called before imagery provider is ready.');
		
		var url = buildImage(this, x,y,level) ;
		return ImageryProvider.loadImage(this, url);		
	};
	
	
	
	/**
	* 	Default parameters to include in the WCPS URL to obtain images
	*
	* @memberof WebCoverageProcessingServiceImageryProvider
	*/	
	WebCoverageProcessingServiceImageryProvider.DefaultParameters= freezeObject({
        service : 'WCPS',
        version : '1.1.1',
        request : 'GetCoverage',
        styles : '',								// default
        format : 'image/tiff'
    });	
	
	return WebCoverageProcessingServiceImageryProvider;
});