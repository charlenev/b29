	// dojo is only used for sandcastle
	// all the interface (ui) is create by createElement() methods.
	
	// stores the value of the name of selected layer
	var buffer;
	
	/**
	*	Updates all parts of the interface.
	*	@param imageryLayers the collection of layers.
	*	@param baseLayers	the array of base layers.
	*/
    var updateUserInterface = function (imageryLayers, baseLayers) {
		//	the table which contains all informations for layer controller is updating here.
		//	it contains 4 parts (checkbox, label and arrows).
		//	we check if the current layer in the collection is part of the array of base layers
		//	Ilinked to the answer, we build a list to select a base layer or we just add
		//	a line for additionel layer.
		var layer, newLine, col1, col2, col3, col4, span, newLine_id;
		var length = imageryLayers.length;
		var table = document.getElementById('layerTable');
        document.getElementById('layerTable').innerHTML = '';
        for (var i = length - 1; i >= 0; --i) {
            layer = imageryLayers.get(i);		
			newLine = document.createElement('tr');
			col1 = document.createElement('td');
			col2 = document.createElement('td');
			col3 = document.createElement('td');
			col4 = document.createElement('td');
			newLine.id = 'line_' + i;
			col1.id = 'layerToggle_' + i;
			col2.id = 'layerLabel_' + i;
			col3.id = 'layerUpArrow_' + i;
			col4.id = 'layerDownArrow_' + i;
			table.appendChild(newLine);
			newLine_id = document.getElementById(newLine.id);
			newLine_id.appendChild(col1);
			newLine_id.appendChild(col2);		
			newLine_id.appendChild(col3);	
			newLine_id.appendChild(col4);	
            if (baseLayers.indexOf(layer) < 0) {	
				span = document.createElement('span');					
				span.innerHTML= layer.name;
				document.getElementById(col2.id).appendChild(span);	
            }  else {
                createBaseLayerSelector(layer, i, imageryLayers, baseLayers);
            }
           createUserInterfaceForLayer(layer, i , imageryLayers, baseLayers);	
		}
    }		
			

	/**
	*	The status 'show' of the layer is changed. 
	*	@param map the layer which is treated.
	*	@param imageryLayers the collection of layers.
	*	@param baseLayers	the array of base layers.
	*/	
	var change = function (map, imageryLayers, baseLayers){
		map.show = !map.show;
		updateUserInterface( imageryLayers, baseLayers);
	}
	
	/**
	*	The layer is put above in the display.
	*	@param map the layer which is treated.
	*	@param show a status of the layer, which determines if it is shown or not.
	*	@param imageryLayers the collection of layers.
	*	@param baseLayers	the array of base layers.
	*/	
	var raise = function (map , show, imageryLayers, baseLayers){
		if(show){
			imageryLayers.raise(map);
			updateUserInterface(imageryLayers, baseLayers);			
		}
	}	
	
	/**
	*	The layer is put below in the display.
	*	@param map the layer which is treated.
	*	@param show a status of the layer, which determines if it is shown or not.
	*	@param imageryLayers the collection of layers.
	*	@param baseLayers	the array of base layers.
	*/	
	var lower = function (map, show, imageryLayers, baseLayers){
		if(show){
			imageryLayers.lower(map);
			updateUserInterface(imageryLayers, baseLayers);	
		}
	}
	
		
	/**
	*	Creates the interface of the layer controler (additional layers).
	*	@param layer the layer which is currently treated (in the list of 'imageryLayers').
	*	@param layerIndex the index of this layer.
	*	@param imageryLayers the collection of layers.
	*	@param baseLayers the array of base layers.
	*/
    var createUserInterfaceForLayer = function (layer, layerIndex, imageryLayers, baseLayers) {
		// From a table whe create the itnerface.
		// It's composed of a checkbox, a label with the name of the layer and 2 arrows 
		// (1 for up and 1 for down)
		var up, down, check;
		var checkbox = document.createElement('input');
		check = document.getElementById('layerToggle_' + layerIndex);
		up = document.getElementById('layerUpArrow_' + layerIndex);
		down = document.getElementById('layerDownArrow_' + layerIndex);
		
		checkbox.type = "checkbox";
		checkbox.checked = layer.show;
		check.appendChild(checkbox);
		checkbox.onchange = function(){
			change(layer,  imageryLayers, baseLayers);
		};

        var showRaise = layerIndex >= 0 && layerIndex < imageryLayers.length - 1;
        var showLower = layerIndex > 0;

		var button1 = document.createElement('input');
		var button2 = document.createElement('input');				
		button1.type = "image";
		button1.style.visibility = (showRaise ? "" : "hidden");
		button1.src = "./Apps/Sandcastle/images/UpArrow.png";
		button1.onclick = function(){
			raise(layer, showRaise, imageryLayers, baseLayers);
		};
		up.appendChild(button1);

		button2.type = "image";
		button2.style.visibility = (showLower ? "" : "hidden");
		button2.src = "./Apps/Sandcastle/images/DownArrow.png";		
		button2.onclick = function(){
			lower(layer, showLower, imageryLayers, baseLayers);
		};
		down.appendChild(button2);
    }
	
	/**
	*	Adds an icon which let to display or not the layer controller.
	*/
	var addOther = function(){
		var image = document.createElement('input');
		var target = document.getElementById('layers');		
		image.type="image";
		image.id = "list";
		image.src = "./Apps/Sandcastle/images/icone-liste.png";
		image.onclick = function(){			
			if(target.style.display == "")
				var hide = true;			
			target.style.display = ( hide ? "none" : "");
		}
		document.getElementById('hiddenList').appendChild(image);
	}

	/**
	*	This function creates a list to select the base layer that the user want to display.
	*	@param layer the layer which is currently treated (in the list of 'imageryLayers').
	*	@param layerIndex the index of this layer.
	*	@param imageryLayers the collection of layers.
	*	@param baseLayers the array which contains all base layers created.
	*/
	var createBaseLayerSelector = function (layer, layerIndex,  imageryLayers, baseLayers) {
		var opt, currentlayer, sel_id, texte;
		var sel = document.createElement('select');
		sel.id = 'base_layers';
		document.getElementById('layerLabel_'+layerIndex).appendChild(sel);
		sel_id = document.getElementById(sel.id);
		
		sel.onchange = function(){
			currentlayer = sel_id.selectedIndex;
			imageryLayers.remove(layer, false);	
			imageryLayers.add(baseLayers[currentlayer], layerIndex);
			updateUserInterface(imageryLayers, baseLayers);	
			texte = sel_id.options[currentlayer].text;
			document.getElementById(sel.id).value = buffer = texte;
		};

		for (var i = 0, len = baseLayers.length; i < len; ++i) {
			opt = document.createElement('option');
			opt.text = baseLayers[i].name;
			opt.id = i;
			//currentlayer=baseLayers[i];
			sel_id.appendChild(opt);
		}			
		sel_id.value = buffer;
	}