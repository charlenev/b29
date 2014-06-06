/*global defineSuite*/
defineSuite([
		'Scene/HeightmapCollection',
		'Core/TerrainProvider',
         'Core/defined',
         'Core/jsonp',
         'Core/loadImage',
         'Core/DefaultProxy',
         'Core/Math',
         'Scene/Imagery',
         'Scene/ImageryLayer',
         'Scene/ImageryProvider',
         'Scene/ImageryState',
         'ThirdParty/when'
	], function(
		HeightmapCollection,
		TerrainProvider,
		defined,
		jsonp,
		loadImage,
		DefaultProxy,
		Math,
		Imagery,
		ImageryLayer,
		ImageryProvider,
		ImageryState,
		when) {
    "use strict";



	var fakeProvider = {
        isReady : function() { return false; }
    };
	
	
	it('conforms to TerrainProvider interface', function(){
	    expect(HeightmapCollection).toConformToInterface(TerrainProvider);	
	});

	

	it('requires an index', function(){	
		var description = {
				id : 'collection1',
				heightmaps: [] 
		};
		function createWithoutIndex(){
			return new HeightmapCollection(description);		
		}
		expect(createWithoutIndex).toThrowDeveloperError();			
	});



	
	it('requires an identifier', function(){
		var description = {
				index : 0,
				heightmaps : []
		};
		function createWithoutId(){
			return new HeightmapCollection( description);
		}
		expect(createWithoutId).toThrowDeveloperError();
	});



	it('requires an array', function(){
		var description = {
				id : 'elevationCollec5',
				index : 5
		};
		function createWithoutArray(){
			return new HeightmapCollection( description);
		}
		expect(createWithoutArray).toThrowDeveloperError();
	});




	it('tries to add an elevation layer (indice=length)', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var layer3 = new ImageryLayer(fakeProvider);
		var layer4 = new ImageryLayer(fakeProvider);
		var layer5 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps : [layer1, layer2, layer3]
		};
		var collection = new HeightmapCollection( description);
		var len = collection.heightmaps.length;
		
		collection.add(layer4, len);
		var len2 = collection.heightmaps.length;
		
		
		expect(len2).toBeGreaterThan(len);		
		expect(collection.heightmaps).toContain(layer2);
		expect(collection.heightmaps).toContain(layer4);
		expect(collection.heightmaps[len2 - 1]).toEqual(layer4);		//collection[len2 - 1] = collection[len + 2]
		expect(collection.heightmaps[len2]).toBeUndefined();	
		//expect(collection.heightmaps).not.toContain(layer5);
	});

	
	
	it('tries to add an elevation layer (indice > length)', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var layer3 = new ImageryLayer(fakeProvider);
		var layer4 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2, layer3]
		};
		var collection = new HeightmapCollection( description);
		var len = collection.heightmaps.length;
		
		collection.add(layer4, len + 1);
		var len2 = collection.heightmaps.length;
		
		expect(collection.heightmaps).toContain(layer4);
		expect(collection.heightmaps[len + 2]).toEqual(layer4);
		expect(collection.heightmaps[len + 3]).toBeUndefined();	
	});
	
	
	it('tries to add an elevation layer (indice in middle array/modulo)', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var layer3 = new ImageryLayer(fakeProvider);
		var layer4 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2, layer3]
		};
		var collection = new HeightmapCollection( description);
		var len = collection.heightmaps.length;
		
		collection.add(layer4, 3);
		var len2 = collection.heightmaps.length;
		
		
		expect(collection.heightmaps).toContain(layer4);
		expect(len2).toEqual(len + 3);
		expect(len2).toBeGreaterThan(len);
		expect(collection.heightmaps[3]).toEqual(1);
		expect(collection.heightmaps[4]).toEqual('elevation1');
		expect(collection.heightmaps[5]).toEqual(layer4);
		expect(collection.heightmaps[6]).toBeDefined();		//on a décalé, les autres layer se trouvent après : 1-4-2-3
	});
	
	
	it('tries to add an elevation layer (indice in middle array/no modulo)', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var layer3 = new ImageryLayer(fakeProvider);
		var layer4 = new ImageryLayer(fakeProvider);
		var layer5 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2, layer3]
		};
		var collection = new HeightmapCollection( description);
		var len = collection.heightmaps.length;			
		collection.add(layer4, 5);						// apres modulo, on trouve que l'emplacement sera en 6
		var len2 = collection.heightmaps.length		
		
		expect(collection.heightmaps).toContain(layer4);
		expect(len2).toEqual(len + 3);
		expect(len2).toBeGreaterThan(len);	
		expect(collection.heightmaps[6]).toEqual(2);				//valeur de index : indice emplacement/3
		expect(collection.heightmaps[7]).toEqual('elevation2');
		expect(collection.heightmaps[8]).toEqual(layer4);
		
		
		collection.add(layer5, 4);						//apres modulo, on trouve que l'emplacement sera en 3 
		var len3 = collection.heightmaps.length;
		
		expect(collection.heightmaps).toContain(layer5);
		expect(len3).toBeGreaterThan(len2);
		expect(len3).toEqual(len2 + 3);
		expect(collection.heightmaps[3]).toEqual(1);
		expect(collection.heightmaps[4]).toEqual('elevation1');
		expect(collection.heightmaps[5]).toEqual(layer5); 

		// enchainement final des layers : 1 - 5 - 2 - 4 - 3
	});
	
	
	it('add a layer by the value of its index (index - id - layer)', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var layer3 = new ImageryLayer(fakeProvider);
		var layer4 = new ImageryLayer(fakeProvider);
		var layer5 = new ImageryLayer(fakeProvider);
		var layer6 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2, layer3]			
		};
		var collection = new HeightmapCollection( description);
		var len = collection.heightmaps.length;
		
		collection.addByIndex(layer4, 5);		//index superieur à la valeur max du prochain attendu
		var len2 = collection.heightmaps.length;			//donne enchainement layers : 1 2 3 4
		
		collection.addByIndex(layer5, 2);						// donnerait enchainement layer : 1 2 5 3 4
		var len3 = collection.heightmaps.length;
		
		collection.addByIndex(layer6, 5);		//index normalement attendu par rapport à la taille du tableau
		var len4 = collection.heightmaps.length;			// donne enchainement layer : 1 2 5 3 4 6
		
		expect(collection.heightmaps).toContain(layer4);
		expect(collection.heightmaps).toContain(layer5);
		expect(collection.heightmaps).toContain(layer6);
		expect(len2).toEqual(len + 3);
		expect(collection.heightmaps[len2 - 1]).toEqual(layer4);
		expect(collection.heightmaps[len3 - 1]).toEqual(layer5);
		expect(collection.heightmaps[len4 - 1]).toEqual(layer6);
		expect(collection.heightmaps[len]).toEqual(2);
		expect(collection.heightmaps[len - 3]).toEqual(2);
		expect(collection.heightmaps[len2]).toEqual(3);
		expect(collection.heightmaps[len3]).toEqual(5);
		expect(collection.heightmaps[len4]).toBeUndefined();
	});
	
	
	it('tries to add an elevation layer (by layer)', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var layer3 = new ImageryLayer(fakeProvider);
		var layer4 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2, layer3]
		};
		var collection = new HeightmapCollection( description);
		var len  = collection.heightmaps.length;
	
		collection.addLayer(layer4);
		var len2 = collection.heightmaps.length;
		
		expect(len2).toBeGreaterThan(len);
		expect(len2).toEqual(len + 3);
		expect(collection.heightmaps).toContain(layer4);
		expect(collection.heightmaps[len2]).toBeUndefined();
		expect(collection.heightmaps[len2 - 1]).toEqual(layer4);
	});
	
	
	it('tries to remove an elevation layer (by layer)', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var layer3 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2, layer3]
		};
		var collection = new HeightmapCollection( description);
		var len = collection.heightmaps.length;
		
		collection.removeLayer(layer2);
		var len2 = collection.heightmaps.length;
		
		
		expect(collection.heightmaps).toContain(layer3);
		expect(collection.heightmaps).toContain(layer2);
		expect(len2).toBeLessThan(len);
		expect(collection.heightmaps[2]).toEqual(layer1);			// index - id - layer
		expect(collection.heightmaps[5]).toEqual(layer3);			// index - id - layer
		expect(collection.heightmaps[6]).toBeUndefined();
	});
	
	
	it('tries to remove an elevation layer (by index)', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var layer3 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2, layer3]
		};
		var collection = new HeightmapCollection( description);
		var len = collection.heightmaps.length;
		
		// on admet qu'on entre la bonne valeur d'index (multiple de 3)
		collection.remove(3);					//suppression de layer2 : index - id - layer
		var len2 = collection.heightmaps.length;
		
		
		expect(len2).toBeLessThan(len);	
		expect(collection.heightmaps).toContain(layer1);
		expect(collection.heightmaps).toContain(layer3);
		//expect(collection.heightmaps).not.toContain(layer2);
		expect(collection.heightmaps[2]).toEqual(layer1);
		expect(collection.heightmaps[5]).toEqual(layer3);
		expect(collection.heightmaps[6]).toBeUndefined();
	});
	
	
	it('tries to select a layer from the collection by its id', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var layer3 = new ImageryLayer(fakeProvider);
		var layer4 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2, layer3, layer4]
		};
		var collection = new HeightmapCollection( description);
		var len = collection.heightmaps.length;
		var id = 'elevation2';					//layer3
		
		collection.selectById(id);
		var len2 = collection.heightmaps.length;
		
		
		expect(len).toBeGreaterThan(len2);
		expect(len2).toEqual(3);							// ici c'est vrai car 1 seul layer se nomme 'elevation2'
		expect(collection.heightmaps).toContain(layer3);
		expect(collection.heightmaps).toContain(id);		
		//expect(collection.heightmaps).not.toContain(layer1);
		expect(collection.heightmaps[1]).toEqual(id);
		expect(collection.heightmaps[2]).toEqual(layer3);		
		expect(collection.heightmaps[3]).toBeUndefined();
	});
	
	
	it('tries to select a layer from the collection by its index', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var layer3 = new ImageryLayer(fakeProvider);
		var layer4 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2, layer3, layer4]
		};
		var collection = new HeightmapCollection( description);
		var len = collection.heightmaps.length;
		var ind = 2;										// donnée : 2 - elevation2 - layer3

		collection.selectByIndex(ind);
		var len2 = collection.heightmaps.length;
		
		
		expect(len2).toEqual(3);									//vrai car ici un seul layer posséde cet index, donc une seule entrée restante
		expect(len).toBeGreaterThan(len2);				
		expect(collection.heightmaps).toContain(layer3);
		//expect(collection.heightmaps).not.toContain(layer1);
		//expect(collection.heightmaps).not.toContain(layer2);
		expect(collection.heightmaps).toContain(ind);
		expect(collection.heightmaps[0]).toEqual(ind);
		expect(collection.heightmaps[1]).toEqual('elevation' + ind);
		expect(collection.heightmaps[2]).toEqual(layer3);
		expect(collection.heightmaps[3]).toBeUndefined();
	});
	
	
	it('get a layer by its index', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var layer3 = new ImageryLayer(fakeProvider);
		var layer4 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2, layer3, layer4]
		};
		var collection = new HeightmapCollection( description);
		var len = collection.heightmaps.length;
	
		// la valeur d'index est celle qui est liée à une entrée pour un layer
		collection.getLayer(2);				//correspond au layer3
		
		expect(collection.heightmaps).toContain(layer2);
		expect(collection.heightmaps).toContain(layer3);
		expect(collection.heightmaps).not.toContain(4);
		expect(collection.heightmaps).toContain(2);
		expect(collection.heightmaps[6]).toEqual(2);
		expect(collection.heightmaps[8]).toEqual(layer3);		
	});
	
	
	it('get an index by its layer', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var layer3 = new ImageryLayer(fakeProvider);
		var layer4 = new ImageryLayer(fakeProvider);
		var layer5 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2, layer3, layer4]
		};
		var collection = new HeightmapCollection( description);
		var len = collection.heightmaps.length;
		
		collection.getIndex(layer3);				//correspond à l'index 2
		
		expect(collection.heightmaps[8]).toEqual(layer3);
		expect(collection.heightmaps[6]).toEqual(2);
		expect(collection.heightmaps).toContain(layer3);
		expect(collection.heightmaps).toContain(1);
		expect(collection.heightmaps).toContain(2);
		//expect(collection.heightmaps).not.toContain(layer5);
	});
	
	
	
	it('addTerrainProvider throws when terrainProvider is undefined', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2]
		};
		var collection = new HeightmapCollection( description);
		
        expect(function() {
            collection.addTerrain(undefined);
        }).toThrowDeveloperError();	
	});
	
	
	it('addTerrainProvider throws when terrainProvider and index is undefined', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps :  [layer1, layer2]
		};
		var collection = new HeightmapCollection( description);
		
        expect(function() {
            collection.addTerrainProvider(undefined, undefined);
        }).toThrowDeveloperError();	
	});
	
	
	it('addTerrainProvider throws when terrainProvider is undefined, and index is defined', function(){
		var layer1 = new ImageryLayer(fakeProvider);
		var layer2 = new ImageryLayer(fakeProvider);
		var description = {
			id : 'collection1',
			index : 1,
			heightmaps : [layer1, layer2]
		};
		var collection = new HeightmapCollection( description);
		var index = 7;
		
        expect(function() {
            collection.addTerrainProvider(undefined, index);
        }).toThrowDeveloperError();	
	});

});