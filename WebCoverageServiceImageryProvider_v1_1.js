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
	* Provides tiled imagery hosted by a Web Coverage Service (WCS) server.
	*
	* @alias WebCoverageServiceImageryProvider
	* @constructor
	*
	* @param {String} description.url The URL of the WCS service.
	* @param {Object} [description.parameters=WebCoverageServiceImageryProvider.DefaultParameters] Additional parameters to pass to the WCS server in the GetCoverage URL.
	* @param {Credit|String} [description.credit] A credit for the data source, which is displayed on the canvas.
	* @param {Object} [description.proxy] A proxy to use for requests. This object is
	*        expected to have a getURL function which returns the proxied URL, if needed.
	*
	*
	* @example
	*	version 1.1 :
	*	http://nsidc.org/cgi-bin/atlas_north?service=WCS&version=1.1.1&request=GetCoverage&
	*	format=GeoTIFF&boundingbox=-2700000,-2700000,6700000,6700000,urn:ogc:def:crs:EPSG::32661&
	*	identifier=sea_ice_concentration_01
	*/
	 

	var WebCoverageServiceImageryProvider = function WebCoverageServiceImageryProvider(description){
	    var description = defaultValue(description, {});
		
		// Verify if all required parameters for the desription are defined.
		if(!defined(description.url))
			throw new DeveloperError('description.url is required.');		
		if(!defined(description.identifier))
			throw new DeveloperError('description.identifier is required.');

		this._url = description.url;	
		this._proxy = description.proxy;
		this._id = description.identifier;			
		
		var credit;
		if(defined(description.credit))
			credit = description.credit;
        if (typeof credit === 'string') 
            credit = new Credit(credit);        
        this._credit = credit;
		
	    this._ready = true;
        this._errorEvent = new Event();		

		if(!defined(description.parameters))
			description.parameters = {};
		// Defines the format of the image requested				
		else if(defined(description.parameters.format) && (description.parameters.format.indexOf('jpg') !== -1))
			description.parameters.format = 'jpeg';
		else if(defined(description.parameters.format) && (description.parameters.format == "tiff" 
				|| description.parameters.format == "tif" || description.parameters.format == "image/tif"))
			description.parameters.format = 'image/tiff';

        // Merge the parameters with the defaults, and make all parameter names lowercase
        var parameters = clone(WebCoverageServiceImageryProvider.DefaultParameters);
        if (defined(description.parameters)) {
            for (var parameter in description.parameters) {
                if (description.parameters.hasOwnProperty(parameter)) {
                    var parameterLowerCase = parameter.toLowerCase();
                    parameters[parameterLowerCase] = description.parameters[parameter];
                }
            }
        }
		this._parameters = parameters;	
		
        var rectangle = defaultValue(description.rectangle, Rectangle.MAX_VALUE);
        this._tilingScheme = new GeographicTilingScheme({
            rectangle : rectangle
        });		
	};
	


	
	/**
	*	All properties of the request
	*/	
	defineProperties(WebCoverageServiceImageryProvider.prototype, {	
        /**
         * Gets the tiling scheme used by this provider.  This function should
         * not be called before {@link WebCoverageServiceImageryProvider#ready} returns true.
         * @memberof WebCoverageServiceImageryProvider.prototype
         * @type {TilingScheme}
         */
        tilingScheme : {
            get : function() {
                if (!this._ready) 
                    throw new DeveloperError('tilingScheme must not be called before the imagery provider is ready.');
                return this._tilingScheme;
            }},

        /**
         * Gets the rectangle, in radians, of the imagery provided by this instance.  This function should
         * not be called before {@link WebCoverageServiceImageryProvider#ready} returns true.
         * @memberof WebCoverageServiceImageryProvider.prototype
         * @type {Rectangle}
         */
        rectangle : {
            get : function() {
                if (!this._ready) 
                    throw new DeveloperError('rectangle must not be called before the imagery provider is ready.');
                return this._tilingScheme.rectangle;
            }},	
			
		
        /**
         * Gets the proxy used by this provider.
         * @memberof WebCoverageServiceImageryProvider.prototype
         * @type {Proxy}
         */
		proxy : {
			get : function(){			
				return this._proxy;
			}},

        /**
         * Gets the URL of the WCS server.
         * @memberof WebCoverageServiceImageryProvider.prototype
         * @type {String}
         */
		url : {
			get : function() {			
				return this._url;
			}},
	
        /**
         * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
         * the source of the imagery.  This function should not be called before {@link WebCoverageServiceImageryProvider#ready} returns true.
         * @memberof WebCoverageServiceImageryProvider.prototype
         * @type {Credit}
         */	
		credit : {
			get : function() {
				return this._credit;
			}},
		
        /**
         * Gets a value indicating whether or not the provider is ready for use.
         * @memberof WebCoverageServiceImageryProvider.prototype
         * @type {Boolean}
         */		
		ready : {
			get : function() {
				return this._ready;
			}},

        /**
         * Gets an event that is raised when the imagery provider encounters an asynchronous error.
         * @memberof WebCoverageServiceImageryProvider.prototype
         * @type {Event}
         */			
        errorEvent : {
            get : function() {
                return this._errorEvent;
            }},


		/**
		*	Gets the identifier of the coverage. This function should not be called before
		*	{@link WebCoverageServiceImageryProvider#ready} returns true.
		*	@memberof WebCoverageServiceImageryProvider
		*	@type {String}
		*/
		identifier : {
			get : function() {
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
			get : function() {
				return true;
			}}
	});
	
	
	
    /**
     * Gets the credits to be displayed when a given tile is displayed.
     *
     * @memberof WebCoverageServiceImageryProvider
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level;
     *
     * @returns {Credit[]} The credits to be displayed when the tile is displayed.
     *
     * @exception {DeveloperError} <code>getTileCredits</code> must not be called before the imagery provider is ready.
     */
    WebCoverageServiceImageryProvider.prototype.getTileCredits = function(x, y, level) {
        return undefined;
    };


	
	
	/**
	*	Build the URL.
	*
	*	@param {imageryProvider} imageryProvider The Imagery Provider used.
	*/
	function buildImageUrl(imageryProvider,x, y, level){
		// Recovers the url 
		var url = imageryProvider._url;
        var indexOfQuestionMark = url.indexOf('?');
		var length = url.length;
		// Adds a separator between parameters of the request
        if (indexOfQuestionMark >= 0 && indexOfQuestionMark < length - 1) {
            if (url[length - 1] !== '&') 
                url += '&';
        } else if (indexOfQuestionMark < 0) 
            url += '?';
        		
		var parameters = imageryProvider._parameters;		
		// Creates the url based on the list of parameters
		for(var parameter in parameters)
            if (parameters.hasOwnProperty(parameter)) 
                url += parameter + '=' + parameters[parameter] + '&';
            
		// Serie of tests which determine if the url is defined correctly
		// If some of these params are not defined we fix their value
		
		// We test the value of the bounding box
		if(!defined(parameters.boundingbox)){
			var nativeRectangle = imageryProvider._tilingScheme.tileXYToNativeRectangle(x, y, level);
            var bbox = nativeRectangle.west + ',' + nativeRectangle.south + ',' + nativeRectangle.east + ',' + nativeRectangle.north;
			url += 'BoundingBox=' + bbox + ',urn:ogc:def:crs:EPSG::4326&'; 
		}

		if(!defined(parameters.identifier))
			url += 'identifier=' + imageryProvider.identifier + '&'; 	


		/*
		If an alternate spatial resolution is desired, then the following set of keywords 
		must be used to specify the sample origin and step size of the output grid to be produced.
		= GRIDBASECRS , GRIDCS, GRIDTYPE, GRIDORIGIN, GRIDOFFSETS
		
		Others URNs can be : 
		urn:ogc:def:crs:EPSG:27700
		urn:ogc:def:crs:OGC::CRS84
		
		*/ 
        var proxy = imageryProvider._proxy;
        if (defined(proxy)) 
            url = proxy.getURL(url);        

        return url;		
	};
	
	
	/**
	* 	Default parameters to include in the WCS URL to obtain images
	*
	* @memberof WebCoverageServiceImageryProvider
	*/
    WebCoverageServiceImageryProvider.DefaultParameters = freezeObject({
        service : 'WCS',
        version : '1.1.0',
        request : 'GetCoverage',
        //style : 'default',								// default		
        format : 'tiff'
    });
	
	
	
    /**
     *	Requests the image for a given tile.  This function should not be called before 
	 *	{@link WebCoverageServiceImageryProvider#ready} returns true.
     *
     * @memberof WebCoverageServiceImageryProvider
     *
     * @returns {Promise} A promise for the image that will resolve when the image is available, or
     *          undefined if there are too many active requests to the server, and the request
     *          should be retried later.  The resolved image may be either an
     *          Image or a Canvas DOM object.
     * @exception {DeveloperError} <code>requestImage</code> must not be called before the imagery provider is ready.
     */	
	WebCoverageServiceImageryProvider.prototype.requestImage = function(x, y, level){
		if(!this._ready)
			throw new DeveloperError('requestImage must not be called before imagery provideer is ready.');
		
		var url = buildImageUrl(this,x, y, level);
		return ImageryProvider.loadImage(this, url);	
		//return url;
	};
	
	return WebCoverageServiceImageryProvider;
});