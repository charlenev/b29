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
     * Provides tiled imagery hosted by a Web Map Tile Service (WMTS) server.
     *
     * @alias WebMapTileServiceImageryProvider
     * @constructor
     *
     * @param {String} description.url The URL of the WMTS service.
     * @param {String} description.layer The layers to include.
     * @param {Object} [description.parameters=WebMapTileServiceImageryProvider.DefaultParameters] Additional parameters to pass to the WMTS server in the GetTile URL.
     * @param {Credit|String} [description.credit] A credit for the data source, which is displayed on the canvas.
     * @param {Object} [description.proxy] A proxy to use for requests. This object is
     *        expected to have a getURL function which returns the proxied URL, if needed.
	 *
	 *	@example
	 *		http://www.maps.bob/maps.cgi?service=WMTS&request=GetTile&version=1.0.0
     * 	&layer=etopo2&style=default&format=image/png&
	 *		TileMatrixSet=WholeWorld_CRS_84&TileMatrix=10m&TileRow=1&TileCol=3	
	 *
	 *	@example
	 *		http://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS?
	 *		service=WMTS&version=1.0.0&request=gettile&layer=WorldTimeZones&style=default&
	 *		tileMatrixSet=default028mm&tileMatrix=1&TileRow=0&TileCol=0&format=image/png
	 *
	 *		http://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi?service=WMTS&version=1.0.0&
	 *		request=GetTile&style=default&format=image/jpeg&tilerow=0&tilecol=1&tilematrix=1&
	 *		tilematrixset=EPSG4326_250m&layer=MODIS_Terra_CorrectedReflectance_TrueColor&
     */	

	var WebMapTileServiceImageryProvider = function WebMapTileServiceImageryProvider(description){
	    var description = defaultValue(description, {});
		
		// Verifies if all required parameters for the desription are defined.
		if(!defined(description.url))
			throw new DeveloperError('description.url is required.');
		
		if(!defined(description.layer))
			throw new DeveloperError('description.layer is required.');
		
		if(!defined(description.parameters.tilerow))
			throw new DeveloperError('description.parameters.tilerow is required.');
		
		if(!defined(description.parameters.tilecol))
			throw new DeveloperError('description.parameters.tilecol is required.');
		
		if(!defined(description.parameters.tilematrix))
			throw new DeveloperError('description.parameters.tilematrix is required.');
		
		if(!defined(description.parameters.tilematrixset))
			throw new DeveloperError('description.parameters.tilematrixset is required.');

		
		this._url = description.url;
		this._proxy = description.proxy;		
		// the name of the layer
		this._layer = description.layer;	
	
		// Defines the format of the image requested		
		if(defined(description.parameters.format) && (description.parameters.format.indexOf('jpg') !== -1))
			description.parameters.format = 'jpeg';
        // Merges the parameters with the defaults, and make all parameter names lowercase
        var parameters = clone(WebMapTileServiceImageryProvider.DefaultParameters);
        if (defined(description.parameters)) {
            for (var parameter in description.parameters) {
                if (description.parameters.hasOwnProperty(parameter)) {
                    var parameterLowerCase = parameter.toLowerCase();
                    parameters[parameterLowerCase] = description.parameters[parameter];
                }
            }
        }
		
		// Defines width and height of the tile, if it is not defined, it takes 256
		this._tileWidth = defaultValue(description.parameters.tileWidth, 256);								
		this._tileHeight = defaultValue(description.parameters.tileHeight, 256);
		// We define a value for the maximum and the minimum of level of detail
		this._minLOD = defaultValue(description.parameters.minimumLevel, 0);			
		this._maxLOD = defaultValue(description.parameters.maximumLevel, 18);		
		// Tile which is treated if it is not defined in le list of parameters (top-left-corner)
		this._tileRow = defaultValue(description.parameters.tilerow, 0);	
		this._tileCol = defaultValue(description.parameters.tilecol, 0);
		// We define 2 dimensions for the data
		this._dimensions = defaultValue(description.parameters.dimensions, 2);
		// Defines the name of the matrix which contain the tile
		this._tilematrix = description.parameters.tilematrix;
		// Defines the name of the images pyramid
		this._tilematrixset = description.parameters.tilematrixset;
		
		
		
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
	defineProperties(WebMapTileServiceImageryProvider.prototype, {
        /**
         * Gets the tiling scheme used by this provider.  This function should
         * not be called before {@link WebMapTileServiceImageryProvider#ready} returns true.
         * @memberof WebMapTileServiceImageryProvider.prototype
         * @type {TilingScheme}
         */
        tilingScheme : {
            get : function() {
                if (!this._ready) 
                    throw new DeveloperError('tilingScheme must not be called before the imagery provider is ready.');
                return this._tilingScheme;
            }
        },	
	
        /**
         * Gets the rectangle, in radians, of the imagery provided by this instance.  This function should
         * not be called before {@link WebMapTileServiceImageryProvider#ready} returns true.
         * @memberof WebMapTileServiceImageryProvider.prototype
         * @type {Rectangle}
         */
        rectangle : {
            get : function() {
                if (!this._ready) 
                    throw new DeveloperError('rectangle must not be called before the imagery provider is ready.');
                return this._tilingScheme.rectangle;
            }},
	
        /**
         * Gets a value indicating whether or not the provider is ready for use.
         * @memberof WebMapTileServiceImageryProvider.prototype
         * @type {Boolean}
         */	
		ready : {
            get : function() {
                return this._ready;
            }},		
		
        /**
         * Gets the URL of the WMTS server.
         * @memberof WebMapTileServiceImageryProvider.prototype
         * @type {String}
		 */
		url : {
			get : function(){
				return this._url;
			}},

        /**
         * Gets the proxy used by this provider.
         * @memberof WebMapTileServiceImageryProvider.prototype
         * @type {Proxy}
         */			
		proxy : {
			get : function(){
				return this._proxy;
			}},

        /**
         * Gets an event that is raised when the imagery provider encounters an asynchronous error.
         * @memberof WebMapTileServiceImageryProvider.prototype
         * @type {Event}
         */			
        errorEvent : {
            get : function() {
                return this._errorEvent;
            }},

        /**
         * Gets the name of the WMTS layer.
         * @memberof WebMapTileServiceImageryProvider.prototype
         * @returns {String}
         */			
		layer : {
			get : function(){
				return this._layer;
			}},

        /**
         * Gets the credit to display when this imagery provider is active. 
         * @memberof WebMapTileServiceImageryProvider.prototype
         * @type {Credit}
         */			
        credit : {
            get : function() {
                return this._credit;
            }},
			
        /**
         * Gets a value indicating whether or not the images provided by this imagery provider
         * include an alpha channel.  
		 *	If this property is false, an alpha channel, if present, will be ignored.  
		 *	If this property is true, any images without an alpha channel will be treated as if their alpha is 1.0 everywhere.  
		 *	When this property is false, memory usage and texture upload time are reduced.
         * @type {Boolean}
         */			
		hasAlphaChannel : {
            get : function() {
                return true;
            }},


        /**
         * Gets the width of each tile, in pixels. This function should
         * not be called before {@link WebMapTileServiceImageryProvider#ready} returns true.
         * @memberof WebMapTileServiceImageryProvider.prototype
         * @type {Number}
         */			
		tileWidth : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('tileWidth must not be called before imagery provider is ready.');				
				return this._tileWidth;
			}},
			
		/**
		*	Gets the height of each tile, in pixels. This function should not be called before
		*	{@link WebMapTileServiceImageryProvider#ready} returns true.
		*	@memberof WebMapTileServiceImageryProvider
		*	@type {Number}
		*/
		tileHeight : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('tileHeight must not be called before imagery provider is ready.');				
				return this._tileHeight;			
			}},
		
		/**
		*	Gets the maximum level-of-detail that can be requested. This function should not be called before
		*	{@link WebMapTileServiceImageryProvider#ready} returns true.
		*	@memberof WebMapTileServiceImageryProvider
		*	@type {Number}
		*/		
		maximumLevel : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('maximumLevel must not be called before imagery provider is ready.');				
				return this._maxLOD;
			}},
			
		/**
		*	Gets the minimum level-of-detail that can be requested. This function should not be called before
		*	{@link WebMapTileServiceImageryProvider#ready} returns true.
		*	@memberof WebMapTileServiceImageryProvider
		*	@type {Number}
		*/					
		minimumLevel : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('minimumLevel must not be called before imagery provider is ready.');				
				return this._minLOD;			
			}},

		/**
		*	Gets the number of the tile(X axis). This function should not be called before
		*	{@link WebMapTileServiceImageryProvider#ready} returns true.
		*	@memberof WebMapTileServiceImageryProvider
		*	@type {Number}
		*/					
		tileRow : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('tileRow must not be called before imagery provider is ready.');				
				return this._tileRow;
			}},
		
		/**
		*	Gets the number of the tile(Y axis). This function should not be called before
		*	{@link WebMapTileServiceImageryProvider#ready} returns true.
		*	@memberof WebMapTileServiceImageryProvider
		*	@type {Number}
		*/				
		tileCol : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('tileCol must not be called before imagery provider is ready.');				
				return this._tileCol;
			}},

		/**
		*	Gets the number of dimensions which are defined. This function should not be called before
		*	{@link WebMapTileServiceImageryProvider#ready} returns true.
		*	@memberof WebMapTileServiceImageryProvider
		*	@type {Number}
		*/					
		dimensions : {
			get : function(){
				if(!this._ready)
					throw new DeveloperError('dimensions must not be called before imagery provider is ready.');				
				return this._dimensions;
			}},
			
		/**
		*	Gets the value which corresponds of the zoom level of the 'tilematrixset'.This function should not be called before
		*	{@link WebMapTileServiceImageryProvider#ready} returns true.
		*	@memberof WebMapTileServiceImageryProvider
		*	@type {Number}	
		*/		
		tilematrix	: {
			get : function() {
				if(!this._ready)
					throw new DeveloperError('tilematrix must not be called before imagery provider is ready.');				
				return this._tilematrix;
			}},
			
		/**
		*	Gets the identifier of the pyramid of images. We know it after a GetCapabilities response.
		*	This function should not be called before {@link WebMapTileServiceImageryProvider#ready} returns true.
		*	@memberof WebMapTileServiceImageryProvider
		*	@type {String}
		*/
		tilematrixset : {
			get : function() {
				if(!this._ready)
					throw new DeveloperError('tilematrixset must not be called before imagery provider is ready.');				
				return this._tilematrixset;
			}}
	});
	


    /**
     * Gets the credits to be displayed when a given tile is displayed.
     *
     * @memberof WebMapTileServiceImageryProvider
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level;
     *
     * @returns {Credit[]} The credits to be displayed when the tile is displayed.
     *
     * @exception {DeveloperError} <code>getTileCredits</code> must not be called before the imagery provider is ready.
     */
    WebMapTileServiceImageryProvider.prototype.getTileCredits = function(x, y, level) {
        return undefined;
    };
	
	
	/**
	*	Build the URL.
	*
	*	@param {imageryProvider} imageryProvider The ImageryProvider used.
	*/
	function buildImageUrl(imageryProvider){
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
			
		// Serie of tests which determine if the url is great defined
		// If some of these parameters are not defined, we fix their value
		
		// We test the value of the name of the layer, the tile matrix which is the level of zoom from 
		// the TileMatrixSet, the index of the tile which is currently treated, the set of tiles, the number of dimensions we used
		if(!defined(parameters.layer))
			url += 'layer=' + imageryProvider._layer + '&';
			
		if(!defined(parameters.tilematrixset))
			url += 'TileMatrixSet=' + imageryProvider._tilematrixset + '&';
								
        if (!defined(parameters.tilematrix)) {	
			url += 'TileMatrix=' + imageryProvider._tilematrix + '&';
        }		
        
	    var proxy = imageryProvider._proxy;
        if (defined(proxy)) 
            url = proxy.getURL(url);

		return url;		
	};
	
	


	/**
	* 	Default parameters to include in the WMS URL to obtain images
	*
	* @memberof WebMapTileServiceImageryProvider
	*/
    WebMapTileServiceImageryProvider.DefaultParameters = freezeObject({
        service : 'WMTS',
        version : '1.0.0',
        request : 'GetTile',
        style : 'default',								// default
        format : 'image/png'
    });	
	
	
	
	
    /**
     * Requests the image for a given tile.  This function should
     * not be called before {@link WebMapTileServiceImageryProvider#ready} returns true.
     *
     * @memberof WebMapTileServiceImageryProvider
     *
     * @returns {Promise} A promise for the image that will resolve when the image is available, or
     *          undefined if there are too many active requests to the server, and the request
     *          should be retried later.  The resolved image may be either an
     *          Image or a Canvas DOM object.
     * @exception {DeveloperError} <code>requestImage</code> must not be called before the imagery provider is ready.
     */	
	WebMapTileServiceImageryProvider.prototype.requestImage = function() {
		if(!this._ready)
			throw new DeveloperError('requestImage cannot be called before the imagery provider is ready.');
		
		var url = buildImageUrl(this);
		return ImageryProvider.loadImage(this, url);	
		//return url ;
	};
	
	
	return WebMapTileServiceImageryProvider;
});