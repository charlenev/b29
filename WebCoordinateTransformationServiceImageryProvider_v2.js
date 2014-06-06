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
	
//	en admettant que lors d'un requête on transforme les coordonnes
//	et que l'on voit le résultat sur l'image.. on garde alors les mêmes propriètés que les autres services. 
//	requestimage(), tilingscheme/rectangle ...	
//
//

	/**
	* Provides tiled imagery hosted by a Web Coordinate Transformation Service (WCTS) server.
	*
	* @alias WebCoordinateTransformationServiceImageryProvider
	* @constructor
	*
	* @param {String} description.url The URL of the WCTS service.
	* @param {Object} [description.parameters=WebCoordinateTransformationServiceImageryProvider.DefaultParameters] Additional parameters to pass to the WCS server in the GetCoverage URL.
	* @param {Credit|String} [description.credit] A credit for the data source, which is displayed on the canvas.
	* @param {Object} [description.proxy] A proxy to use for requests. This object is
	*        expected to have a getURL function which returns the proxied URL, if needed.
	*
	*
	*	@example
	*	http://geoweb.hft-stuttgart.de/openwctsv2/wcts.php?service=wcts&request=transform&
	*	coords=3500000,5400000&sourcecrs=31463&targetcrs=4326&format=csv&delimiter=,
	*/
	var WebCoordinateTransformationServiceImageryProvider = function WebCoordinateTransformationServiceImageryProvider(description){
	    var description = defaultValue(description, {});
		
		// Verify if all required parameters for the desription are defined.
		if(!defined(description.url))
			throw new DeveloperError('description.url is required.');
		if(!defined(description.parameters.format))
			throw new DeveloperError('description.parameters.format is required.');
		if(!defined(description.parameters.coords))
			throw new DeveloperError('description.parameters.coords is required.');	
		if(!defined(description.parameters.sourcecrs))
			throw new DeveloperError('description.parameters.sourcecrs is required.');
		if(!defined(description.parameters.targetcrs))
			throw new DeveloperError('description.parameters.targetcrs is required.');	
			
		this._url = description.url;
		this._proxy = description.proxy;
		this._format = description.parameters.format;
		this._coords = description.parameters.coords;
		this._target = description.parameters.targetcrs;
		this._sourcecrs = description.parameters.sourcecrs;
		
		
		if(!defined(description.parameters))
			description.parameters = {};
			
        // Merge the parameters with the defaults, and make all parameter names lowercase
        var parameters = clone(WebCoordinateTransformationServiceImageryProvider.DefaultParameters);
        if (defined(description.parameters)) {
            for (var parameter in description.parameters) {
                if (description.parameters.hasOwnProperty(parameter)) {
                    var parameterLowerCase = parameter.toLowerCase();
                    parameters[parameterLowerCase] = description.parameters[parameter];
                }
            }
        }	
		
		this._parameters = parameters;
		var credit;
		if(defined(description.credit))
			credit = description.credit;
        if (typeof credit === 'string') 
            credit = new Credit(credit);        
        this._credit = credit;
		
	    this._ready = true;
        this._errorEvent = new Event();		
			
			
        var rectangle = defaultValue(description.rectangle, Rectangle.MAX_VALUE);
        this._tilingScheme = new GeographicTilingScheme({
            rectangle : rectangle
        });				
	};
	

	
	/**
	*	All properties of the request
	*/	
	defineProperties(WebCoordinateTransformationServiceImageryProvider.prototype, {	
        /**
         * Gets the tiling scheme used by this provider.  This function should
         * not be called before {@link WebCoordinateTransformationServiceImageryProvider#ready} returns true.
         * @memberof WebCoordinateTransformationServiceImageryProvider.prototype
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
         * not be called before {@link WebCoordinateTransformationServiceImageryProvider#ready} returns true.
         * @memberof WebCoordinateTransformationServiceImageryProvider.prototype
         * @type {Rectangle}
         */
        rectangle : {
            get : function() {
                if (!this._ready) 
                    throw new DeveloperError('rectangle must not be called before the imagery provider is ready.');
                return this._tilingScheme.rectangle;
            }   },	
			
			
        /**
         * Gets the proxy used by this provider.
         * @memberof WebCoordinateTransformationServiceImageryProvider.prototype
         * @type {Proxy}
         */
		proxy : {
			get : function(){			
				return this._proxy;
			}},

        /**
         * Gets the URL of the WCS server.
         * @memberof WebCoordinateTransformationServiceImageryProvider.prototype
         * @type {String}
         */
		url : {
			get : function(){			
				return this._url;
			}},
			
		/**
		* Gets the format in which the result of the transformation will be returned
		* @memberof WebCoordinateTransformationServiceImageryProvider.prototype
		* @type {String}
		*/
		format : {
			get : function(){			
				return this._format;
			}},

		/**
		* Gets the value of coordinates passed to be transformed.
         * @memberof WebCoordinateTransformationServiceImageryProvider.prototype
         * @type {String}
		*/			
		coords : {
			get : function(){			
				return this._coords;
			}},
			
		/**
		* Gets the value of the original crs.
         * @memberof WebCoordinateTransformationServiceImageryProvider.prototype
         * @type {String}
		*/						
		sourcecrs : {
			get : function(){			
				return this._sourcecrs;
			}},
		
		/**
		* Gets the value of the crs in which coordinates are modified.
         * @memberof WebCoordinateTransformationServiceImageryProvider.prototype
         * @type {String}
		*/			
		targetcrs : {
			get : function(){			
				return this._targetcrs;
			}},
	
        /**
         * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
         * the source of the imagery.  This function should not be called before {@link WebCoordinateTransformationServiceImageryProvider#ready} returns true.
         * @memberof WebCoordinateTransformationServiceImageryProvider.prototype
         * @type {Credit}
         */	
		credit : {
			get : function(){
				return this._credit;
			}},
		
        /**
         * Gets a value indicating whether or not the provider is ready for use.
         * @memberof WebCoordinateTransformationServiceImageryProvider.prototype
         * @type {Boolean}
         */		
		ready : {
			get : function(){
				return this._ready;
			}},

        /**
         * Gets an event that is raised when the imagery provider encounters an asynchronous error.
         * @memberof WebCoordinateTransformationServiceImageryProvider.prototype
         * @type {Event}
         */			
        errorEvent : {
            get : function() {
                return this._errorEvent;
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
     * Gets the credits to be displayed when a given tile is displayed.
     *
     * @memberof WebCoordinateTransformationServiceImageryProvider
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level.
     *
     * @returns {Credit[]} The credits to be displayed when the tile is displayed.
     *
     * @exception {DeveloperError} <code>getTileCredits</code> must not be called before the imagery provider is ready.
     */
    WebCoordinateTransformationServiceImageryProvider.prototype.getTileCredits = function(x, y, level) {
        return undefined;
    };


	
	
	/**
	*	Build the URL.
	*
	*	@param {imageryProvider} imageryProvider The Imagery Provider used.
	*/
	function buildImageUrl(imageryProvider){
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

            
		if(!defined(parameters.coords))
			url += 'coords=' + imageryProvider.coords + '&';
		if(!defined(parameters.sourcecrs))
			url += 'sourcecrs=' + imageryProvider.sourcecrs + '&';
		if(!defined(parameters.targetcrs))
			url += 'targetcrs=' + imageryProvider.targetcrs + '&';			
		if(!defined(parameters.format))
			url += 'format=' + imageryProvider.format + '&';	
			
        var proxy = imageryProvider._proxy;
        if (defined(proxy)) 
            url = proxy.getURL(url);        

        return url;		
	};
	
	
	/**
	* 	Default parameters to include in the WCS URL to obtain images
	*
	* @memberof WebCoordinateTransformationServiceImageryProvider
	*/
    WebCoordinateTransformationServiceImageryProvider.DefaultParameters = freezeObject({
        service : 'WCTS',
        version : '2.0.0',
        request : 'Transform'
    });
	
	
	
    /**
     *	Requests the image for a given tile.  This function should not be called before 
	 *	{@link WebCoordinateTransformationServiceImageryProvider#ready} returns true.
     *
     * @memberof WebCoordinateTransformationServiceImageryProvider
     *
     * @returns {Promise} A promise for the image that will resolve when the image is available, or
     *          undefined if there are too many active requests to the server, and the request
     *          should be retried later.  The resolved image may be either an
     *          Image or a Canvas DOM object.
     * @exception {DeveloperError} <code>requestImage</code> must not be called before the imagery provider is ready.
     */	
	WebCoordinateTransformationServiceImageryProvider.prototype.requestImage = function(){
		if(!this._ready)
			throw new DeveloperError('requestImage must not be called before imagery provideer is ready.');
		
		var url = buildImageUrl(this);
		return ImageryProvider.loadImage(this, url);
		//return url;		
	};
	
	return WebCoordinateTransformationServiceImageryProvider;
});