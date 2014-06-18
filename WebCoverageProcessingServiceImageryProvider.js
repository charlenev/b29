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
	* @param {String} description.url The URL of the WCPS service.
	* @param {Object} [description.parameters=WebCoverageProcessingServiceImageryProvider.DefaultParameters] Additional parameters to pass to the WCPS server in the URL.
	* @param {Credit|String} [description.credit] A credit for the data source, which is displayed on the canvas.
	* @param {Object} [description.proxy] A proxy to use for requests. This object is
	*        expected to have a getURL function which returns the proxied URL, if needed.

	* @example
	*	http://myserver.com/wcs?SERVICE=WCS&VERSION=2.0&REQUEST=ProcessCoverages&
	*	query=for%20$c%20in%20%28Scene1%29%return%20encode%28%20$c.red+42,%20
	*	%22image%2Fjp2%22%29
	*/
	var WebCoverageProcessingServiceImageryProvider = function WebCoverageProcessingServiceImageryProvider(description){
	    var description = defaultValue(description, {});
		
		if(!defined(description.query))
			throw new DeveloperError('description.query is required');	
		if(!defined(description.url))
			throw new DeveloperError('description.url is required.');			

			
		this._url = description.url;
		this._proxy = description.proxy;
		this._query = description.query;		
	
		var credit;
		if(defined(description.parameters) && defined(description.parameters.credit))
			credit = description.parameters.credit;
        if (typeof credit === 'string') 
            credit = new Credit(credit);        
        this._credit = credit;
		
	    this._ready = true;
        this._errorEvent = new Event();		

		
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

		this._parameters = parameters;		

        var rectangle = defaultValue(description.rectangle, Rectangle.MAX_VALUE);
        this._tilingScheme = new GeographicTilingScheme({
            rectangle : rectangle
        });		
	};
	
	
	
	
	/**
	*	All properties of the request
	*/		
	defineProperties(WebCoverageProcessingServiceImageryProvider.prototype, {	
        /**
         * Gets the tiling scheme used by this provider.  This function should
         * not be called before {@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
         * @memberof WebCoverageProcessingServiceImageryProvider.prototype
         * @type {TilingScheme}
         */
        tilingScheme : {
            get : function() {
                if (!this._ready) 
                    throw new DeveloperError('tilingScheme must not be called before the imagery provider is ready.');
                return this._tilingScheme;
            } },

        /**
         * Gets the rectangle, in radians, of the imagery provided by this instance.  This function should
         * not be called before {@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
         * @memberof WebCoverageProcessingServiceImageryProvider.prototype
         * @type {Rectangle}
         */
        rectangle : {
            get : function() {
                if (!this._ready) 
                    throw new DeveloperError('rectangle must not be called before the imagery provider is ready.');
				return this._tilingScheme.rectangle;
            } },	
			
			
        /**
         * Gets the proxy used by this provider.
         * @memberof WebCoverageProcessingServiceImageryProvider.prototype
         * @type {Proxy}
         */	
		proxy : {
			get : function() {
				return this._proxy;
			}},
			
			
        /**
         * Gets the URL of the WCS server.
         * @memberof WebCoverageProcessingServiceImageryProvider.prototype
         * @type {String}
         */			
		url : {
			get : function() {
				return this._url;
			}},
			
			
        /**
         * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
         * the source of the imagery.  This function should not be called before {@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
         * @memberof WebCoverageProcessingServiceImageryProvider.prototype
         * @type {Credit}
         */				
		credit : {
			get : function() {
				return this._credit;
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
         * Gets an event that is raised when the imagery provider encounters an asynchronous error.
         * @memberof WebCoverageProcessingServiceImageryProvider.prototype
         * @type {Event}
         */			
		errorEvent : {
			get : function() {
				return this._errorEvent;
			}},


		/**
		*	Gets the query which is send on the server.
		*	This function should not be called before {@link WebCoverageProcessingServiceImageryProvider#ready}
		*	returns true.
		*	@memberof WebCoverageProcessingServiceImageryProvider.prototype
		*	@type {String}
		*/
		query : {
			get : function() {
				return this._query;
			}},
			
			
        /**
         *	Gets a value indicating whether or not the images provided by this imagery provider
         *	include an alpha channel.  
		 *	If this property is false, an alpha channel, if present, will be ignored.  
		 *	If this property is true, any images without an alpha channel will be treated as if their alpha is 1.0 everywhere.  
		 *	When this property is false, memory usage and texture upload time are reduced.
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
     * @memberof WebCoverageProcessingServiceImageryProvider
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level;
     *
     * @returns {Credit[]} The credits to be displayed when the tile is displayed.
     *
     * @exception {DeveloperError} <code>getTileCredits</code> must not be called before the imagery provider is ready.
     */
    WebCoverageProcessingServiceImageryProvider.prototype.getTileCredits = function(x, y, level) {
        return undefined;
    };


	
	
	/**
	* 	Default parameters to include in the WCPS URL to obtain images
	*
	* @memberof WebCoverageProcessingServiceImageryProvider
	*/
    WebCoverageProcessingServiceImageryProvider.DefaultParameters = freezeObject({
        service : 'WCS',
        version : '1.0',
        request : 'ProcessCoverages'
    });	


	
	/**
	*	Build the URL.
	*
	*	@param {imageryProvider} imageryProvider The Imagery Provider used.
	*/
	function buildImageUrl(imageryProvider,x, y, level){
		// Recovers the url 
		var url = imageryProvider._url;
        var indexOfQuestionMark = url.indexOf('?');
		var length =  url.length;
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
						
		if(!defined(parameters.query))
			url += 'query=' + imageryProvider.query + '&';			
			
        var proxy = imageryProvider._proxy;
        if (defined(proxy)) 
            url = proxy.getURL(url);        

        return url;		
	};




    /**
     * Requests the image for a given tile.  This function should
     * not be called before {@link WebCoverageProcessingServiceImageryProvider#ready} returns true.
     *
     * @memberof WebCoverageProcessingServiceImageryProvider
     *
     * @returns {Promise} A promise for the image that will resolve when the image is available, or
     *          undefined if there are too many active requests to the server, and the request
     *          should be retried later.  The resolved image may be either an
     *          Image or a Canvas DOM object.
     * @exception {DeveloperError} <code>requestImage</code> must not be called before the imagery provider is ready.
     */	
	WebCoverageProcessingServiceImageryProvider.prototype.requestImage = function(x, y, level) {
		if(!this._ready)
			throw new DeveloperError('requestImage cannot be called before the imagery provider is ready.');
		var url = buildImageUrl(this,x, y, level);
		
		return ImageryProvider.loadImage(this, url);	
		//return url;
	};
	
	return WebCoverageProcessingServiceImageryProvider;	
});