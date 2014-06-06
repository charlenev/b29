define([
        '../Core/clone',
        '../Core/DeveloperError',
        '../Core/defaultValue',
        '../Core/freezeObject',		
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/Event',
		'../Core/TerrainData',
		'../Core/TerrainProvider',
		'./ImageryLayer'
	] , function(
		clone,
		DeveloperError,
		defaultValue,
		freezeObject,
		defined,
		defineProperties,
		Event,
		TerrainData,
		TerrainProvider,
		ImageryLayer){
    "use strict";

	
	/**
	* A collection of heightmaps.  A heightmap is a rectangular array of heights in row-major order from south to north and west to east.
	*
	* @alias HeightmapCollection
	* @constructor
	*
	* @see HeightmapTerrainData
	*	
	*/			
	var HeightmapCollection = function HeightmapCollection( description){
	
		if(!description.id)
			throw new DeveloperError('description.id is required.');
		if(!description.index)
			throw new DeveloperError('description.index is required.');
		if(!description.heightmaps)
			throw new DeveloperError('description.heightmaps is required.');
			
		// the collection has an index and a name. We can have some heightmaps collections on the same map
		this._collecIndex = description.index;
		this._collecId = description.id;		
		
		// the array which contains heightmaps for one collection
		this._heightmaps=[];
		var len = description.heightmaps.length;
				
		this.heightmapRemoved = new Event();
		this.heightmapAdded = new Event();		
		
		// the contents is of the shape of:  1 - elevation1 - layer
		for(var i = 0; i < len; i++){
			this._heightmaps.push(i);
			this._heightmaps.push('elevation' + i);
			this._heightmaps.push(description.heightmaps[i]);
		}	
	};
		
	
	
	/**
	*	All properties of the request
	*/		
	defineProperties(HeightmapCollection.prototype, {
		/**
		*	Gets the index identifier of the current collection.
		*	@memberof HeightmapCollection.prototype
		* 	@type {Number}		
		*/
		collecIndex : {
			get : function () {
				return this._collecIndex;
		}},

		/**
		*	Gets the identifier of the current collection.
		*	@memberof HeightmapCollection.prototype
		* 	@type {String}		
		*/
		collecId : {
			get : function () {
				return this._collecId;
		}},
		
		/**
		*	Gets the array which contains heightmaps.
         * @memberof HeightmapCollection.prototype
         * @type {Array}		
		*/
		heightmaps : {
			get : function(){
				return this._heightmaps;
			}}
	});
	
	/**
	*	Adds a layer in the array thanks to the position given in parameter. If this index of the array is already
	*	full, we splice the array to put new informations in this place.
	*	@memberof HeightmapCollection
	*	@param {ImageryLayer} layer The layer we want to insert in the collection.
	*	@param {Number} ind The position in the array where we want to insert it.
	*/
	HeightmapCollection.prototype.add = function(layer, ind){
		var len = this._heightmaps.length;
		// we convert the index position, in the index (theorical number) of the layer 
		var valInd = ind / 3;
		// here we find the value of the next index (number) to insert in the array.
		var valLen = len / 3;
		
		if(!defined(ind))
			throw new DeveloperError('an index is required.');		
		else if(!defined(layer))
			throw new DeveloperError('a layer to add is required.');
		
		
		// we check if the layer is already in the array or not
		for(var i = len - 1; i > 1; i -= 3){
			if(layer == this._heightmaps[ i ])
				throw new DeveloperError('the layer already exists in the array.');
		}	
		
		
		// if the layer is not in the array we can add it
		// we check the index which is requested.
		// if the index position correspond to the size of the array, we put informations in the end of the array
		// if the index position is greater than the length, we return the value to the size of the array and put infos in the end of the array.
		if((ind == len) || (ind > len)){
			this._heightmaps.push(valLen);
			this._heightmaps.push('elevation' + valLen);		
			this._heightmaps.push(layer);		
		}
		// if the index is between 0 and the end of the array
		else if(ind > 0 && ind < len){
			if(ind%3 == 0){				
				this._heightmaps.splice(ind, 0, valInd, 'elevation' + valInd, layer);
			}else if(ind%3 == 1){				
				var prevInd = ind - 1 ;
				var prevValInd = prevInd / 3;
				this._heightmaps.splice(prevInd, 0, prevValInd, 'elevation' + prevValInd, layer);
			}else if(ind%3 == 2){
				var nextInd = ind + 1;
				var nextValInd = nextInd / 3;
				this._heightmaps.splice(nextInd, 0, nextValInd, 'elevation' + nextValInd, layer);
			}				
		}
		else
			throw new DeveloperError('index must be between 0 and ' + len);

		this.heightmapAdded.raiseEvent(layer, ind);		
	};
	
	/**
	*	Adds a layer in the array thanks to it index (number) given in parameter
	*	@memberof HeightmapCollection	
	*	@param {ImageryLayer} layer The layer we want to insert in the collection.
	*	@param {Number} index The index of the layer (it number/name, not the position).
	*/
	HeightmapCollection.prototype.addByIndex = function(layer, index){
		var len = this._heightmaps.length;
		// we convert the index (theorical number) of the layer, in the position in the array.
		var valInd = index * 3;		
		// here we find the value of the next index (number) to insert in the array.		
		var valLen = len / 3;	
		
		if(!defined(layer))
			throw new DeveloperError('a layer to add is required');
		else if(!defined(index))
			throw new DeveloperError('an index is required.');
		
		
		// we check if the layer is already in the array or not
		for(var i = len - 1; i > 1; i -= 3){
			if(layer == this._heightmaps[ i ])
				throw new DeveloperError('the layer already exists in the array.');
		}			

		
		// if the layer is not in the array we can add it
		// we check the index which is requested.
		// if the index requested is the one we wait, or if it is greater than that value, we put infos in the end of the array
		if((index == valLen) || (index > valLen)){
			this._heightmaps.push(valLen);
			this._heightmaps.push('elevation' + valLen);
			this._heightmaps.push(layer);
		}
		// if the index is between 0 and the end of the array
		// we splice the array to insert the infos 
		else if(index >= 0 && index < valLen){
			this._heightmaps.splice(valInd, 0, index, 'elevation' + index, layer);				
		}else
			throw new DeveloperError('index must be between 0 and ' + valLen);					
						
		this.heightmapAdded.raiseEvent(layer, index);	
	};
	
	
	
	
	/**
	*	Adds a layer in the array of heightmaps without specified an index. The new layer will be added in
	*	the end of the array.
	*	@memberof HeightmapCollection	
	*	@param {ImageryLayer} layer The layer we want to insert in the collection.
	*/
	HeightmapCollection.prototype.addLayer = function(layer){
		var len = this._heightmaps.length;
		var valLen = len / 3;
		
		if(!defined(layer))
			throw new DeveloperError('the layer is required.');
			
		
		// we check if the layer is already in the array or not
		for(var i = len - 1; i > 1; i -= 3){
			if(layer == this._heightmaps[ i ])
				throw new DeveloperError('the layer already exists in the array.');
		}	
		
		// if the layer is not in the array we can add it
		// we put it in the end of the array
		this._heightmaps.push(valLen);
		this._heightmaps.push('elevation' + valLen);
		this._heightmaps.push(layer);
	
		this.heightmapAdded.raiseEvent(layer);	
	};
	
	
	/**
	*	Removes a layer thanks to it position in the array
	*	@memberof HeightmapCollection	
	*	@param {Number} ind The index (position) we want to delete.
	*/
	HeightmapCollection.prototype.remove = function(ind){
		var len = this._heightmaps.length;
		
		if(!defined(ind))
			throw new DeveloperError('an index is required.');
		else if(len <= 0)
			throw new DeveloperError('the array is empty.');		
		else if(ind < 0)
			throw new DeveloperError('the index must be positive.');
		else if(ind > len)
			throw new DeveloperError('the index cannot be greater than length.');

		// we check that the index really correspond to a valid position (i.e: a position which contain a value 'index')
		// we delete from this position to 3 elements in the array
		if(ind%3 == 0){
			this._heightmaps.splice(ind, 3);
			this.heightmapRemoved.raiseEvent(ind);
		}else
			throw new DeveloperError('the index is false. it does\'t correspond at the start of an entry.');		
	};


	/**
	*	Removes a layer.
	*	@memberof HeightmapCollection	
	*	@param {ImageryLayer} layer The layer we want to remove of the collection.
	*/
	HeightmapCollection.prototype.removeLayer = function(layer){
		var len = this._heightmaps.length;
		var ind = 0;

		if(!defined(layer))
			throw new DeveloperError('the layer is required.');		
		
		// we browse the array and test if the current element correspond to the layer requested
		for(var i = len - 1; i > 1; i -= 3){
			if(this._heightmaps[ i ] == layer){
				// value of the position corresponding of the 'index' value of the current layer treated
				ind = i - 2;		
				// we delete the informations linked of this layer
				this._heightmaps.splice(ind, 3);
				this.heightmapRemoved.raiseEvent(ind);
			}
		}	
	};
	

	/**
	*	Selects a layer by the value of it index (number/name) and deletes all the others.
	*	@memberof HeightmapCollection	
	*	@param {Number} index The index (number/name) of the layer.
	*/
	HeightmapCollection.prototype.selectByIndex = function(index){
		var len = this._heightmaps.length;		

		if(!defined(index))
			throw new DeveloperError('an index is required.');		
		else if(index > len)
			throw new DeveloperError('the index must be between 0 and ' + len);		
		else if(index < 0)
			throw new DeveloperError('the index must be positive.');
		

		// we do this treatment only if we have more than one heightmaps in the array
		if(len > 3){
			for(var i = len - 3 ; i >= 0 ; i -= 3){
				if(this._heightmaps[ i ] != index)
					// deletes all elements which do not correspond of informations of the layer requested.
					this.remove( i );
			}				
		}
	};
	
	/**
	*	Selects a layer by it identifier and deletes all the others.
	*	@memberof HeightmapCollection	
	*	@param {String} id The identifier of the layer.
	*/
	HeightmapCollection.prototype.selectById = function(id){
		var len = this._heightmaps.length;
		
		if(!defined(id))
			throw new DeveloperError('an identifier is required.');		
		
		// we do this treatment only if we have more than one heightmaps in the array
		if(len > 3){
			for(var i = len - 2; i > 0 ; i -= 3){
				if(this._heightmaps[ i ] != id)
					// deletes all elements which do not correspond of informations of the layer requested.
					this.remove( i - 1 );
			}		
		}
	};	
	
	
	

	/**
	*	Gets the layer requested by its index value.
	*	@memberof HeightmapCollection	
	*	@param {Number} index The index (number/name) of the layer.
	*	@returns  {ImageryLayer} The layer associated
	*/
	HeightmapCollection.prototype.getLayer = function(index){
		var len = this._heightmaps.length;
		var valLen = len / 3;
		
		if(!defined(index))
			throw new DeveloperError('an index is required.');
		else if(index < 0 )
			throw new DeveloperError('the index must be positive.');
		else if(index > valLen)
			throw new DeveloperError('the index cannot be greater than ' + valLen);

		// if there are more than one layer with this 'index' we return the first encountered in the array.
		// returns infos about the layer : 'index' - elevation 'index' - layer
		for(var i = len - 3; i >= 0; i -= 3){
			if(this._heightmaps[ i ] == index)
				return this._heightmaps[ i + 2 ];
		}	
	};
	
	
	/**
	*	Gets the index value (number/name) about a layer.
	*	@memberof HeightmapCollection	
	*	@param {ImageryLayer} layer The layer we want to return informations.
	*	@returns {Number} The index value of this layer.
	*/
	HeightmapCollection.prototype.getIndex = function(layer){
		var len = this._heightmaps.length;
		
		if(!defined(layer))
			throw new DeveloperError('a layer is required.');

		// returns infos about the layer : 'index' - elevation 'index' - layer
		for(var i = len - 1; i > 1; i -= 3){
			if(this._heightmaps[ i ] == layer)
				return this._heightmaps[ i - 2 ];
		}	
	};


	/**
     * Creates a new heightmap layer using the given TerrainProvider and adds it to the collection.
     * @memberof HeightmapCollection
     * @param {TerrainProvider} terrainProvider the terrain provider to create a new layer for.
     * @param {Number} [index] the index (number/name) that the new layer will take.
     * @returns {ImageryLayer} The newly created layer.
	*/
    HeightmapCollection.prototype.addTerrainProvider = function(terrainProvider, index) {
		var len = this._heightmaps.length;
		var valInd = len / 3;
		
        if (!defined(terrainProvider)) 
            throw new DeveloperError('terrainProvider is required.');        
		else if(!defined(index))
			throw new DeveloperError('an index is required.');		
		else if(index < 0)
			throw new DeveloperError('the index must be positive.');		
		else if(index > valInd)
			throw new DeveloperError('the index in greater than the maximum index.');
		

        var layer = new ImageryLayer(terrainProvider);
        this.addByIndex(layer, index);
		return layer;
    };	

	

	/**
     * Creates a new heightmap layer using the given TerrainProvider and adds it to the collection.
     *	The layer will be in the end of the array.
     * @memberof HeightmapCollection
     * @param {TerrainProvider} terrainProvider the terrain provider to create a new layer for.
     * @returns {ImageryLayer} The newly created layer.
	*/
	HeightmapCollection.prototype.addTerrain = function(terrainProvider){
        if (!defined(terrainProvider)) 
            throw new DeveloperError('imageryProvider is required.');        
		
		var layer = new ImageryLayer(terrainProvider);
		this.addLayer(layer);
		return layer;
	};

		
    /**
     * Requests the geometry for a given tile. The result must include terrain data and
     * may optionally include a water mask and an indication of which child tiles are available.
     * @memberof HeightmapCollection
     * @returns {Promise|TerrainData} A promise for the requested geometry.  If this method
     *          returns undefined instead of a promise, it is an indication that too many requests are already
     *          pending and the request will be retried later.
     */
    HeightmapCollection.prototype.requestTileGeometry = DeveloperError.throwInstantiationError;

	
	
    /**
     * Gets the maximum geometric error allowed in a tile at a given level.
     * @memberof HeightmapCollection
     */
    HeightmapCollection.prototype.getLevelMaximumGeometricError = DeveloperError.throwInstantiationError;

	
	
    /**
     * Gets a value indicating whether or not the provider includes a water mask.  The water mask
     * indicates which areas of the globe are water rather than land, so they can be rendered
     * as a reflective surface with animated waves.  
     * @memberof HeightmapCollection
     * @returns {Boolean} True if the provider has a water mask; otherwise, false.
     */
    HeightmapCollection.prototype.hasWaterMask = DeveloperError.throwInstantiationError;	

	
    return HeightmapCollection;
});



