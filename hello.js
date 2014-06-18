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
	var change = function (map, imageryLayers, baseLayers) {
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
	var raise = function (map , show, imageryLayers, baseLayers) {
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
	var lower = function (map, show, imageryLayers, baseLayers) { 
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
		// From a table we create the itnerface.
		// It's composed of a checkbox, a label with the name of the layer and 2 arrows 
		// (1 for up and 1 for down)
		var up, down, check;
		var checkbox = document.createElement('input');
		check = document.getElementById('layerToggle_' + layerIndex);
		up = document.getElementById('layerUpArrow_' + layerIndex);
		down = document.getElementById('layerDownArrow_' + layerIndex);
		
		// creation of the checkbox and definition of the result with the onchange() function
		checkbox.type = "checkbox";
		checkbox.checked = layer.show;
		check.appendChild(checkbox);
		checkbox.onchange = function(){
			change(layer,  imageryLayers, baseLayers);
		};

        var showRaise = layerIndex >= 0 && layerIndex < imageryLayers.length - 1;
        var showLower = layerIndex > 0;

		// creation of the image and action to raise a layer
		var button1 = document.createElement('input');
		var button2 = document.createElement('input');				
		button1.type = "image";
		button1.style.visibility = (showRaise ? "" : "hidden");
		button1.src = "./Apps/Sandcastle/images/UpArrow.png";
		button1.onclick = function(){
			raise(layer, showRaise, imageryLayers, baseLayers);
		};
		up.appendChild(button1);

		// creation of the image and action to lower a layer
		button2.type = "image";
		button2.style.visibility = (showLower ? "" : "hidden");
		button2.src = "./Apps/Sandcastle/images/DownArrow.png";		
		button2.onclick = function(){
			lower(layer, showLower, imageryLayers, baseLayers);
		};
		down.appendChild(button2);
    }
	
	/**
	*	Adds tools icons which let to display or not the layer controller, and edit a request to a web service.
	*/
	var addOther = function() {
		// creation of 2 input image which let to control layers, and edit a request to web services
		var image2 = document.createElement('input');		
		var image1 = document.createElement('input');
		var target = document.getElementById('layers');			
		var form = document.getElementById('form');
		// first image  : hide or show the layer manager
		image1.type = "image";
		image1.id = "list";
		image1.title = "hide layer selector";
		image1.src = "./Apps/Sandcastle/images/icone-liste.png";
		image1.onclick = function(){			
			if(target.style.display == "")
				var hide = true;			
			target.style.display = ( hide ? "none" : "");
			form.style.display="none";
		}
		document.getElementById('hiddenList').appendChild(image1);
		
		
		//second image : show a form to edit/complete a request to send to a web service
		image2.type = "image";
		image2.id = "newReq";
		image2.title = "edit a request";
		image2.src = "./Apps/Sandcastle/images/edit.png";
		form.style.display="none";
		image2.onclick = function(){	
			target.style.display="none";
			form.style.display="";
		}
		document.getElementById('modify').appendChild(image2);			
	}

	/**
	*	Creates a list with names of web services.
	*	When one of them is selected createForm() is called.
	*/
	var createSelection = function () {
		// creation of a drop-down list with names of web services which can be requested
		var opt, sel_id, currentlayer;
		var target_id = document.getElementById('selector');	
		//	array which contains names of web services available
		var tab = ["WMTS", "WCS 1.0", "WCS 1.1", "WCS 2.0", "WCPS"];
		var sel = document.createElement('select');
		sel.id = "service";
		target_id.appendChild(sel);	
		sel_id =  document.getElementById(sel.id);	
		// creates an entry with each elements of the array
		for(var i = 0; i<tab.length; i++){
			opt = document.createElement('option');
			opt.text = tab[i];
			sel_id.appendChild(opt);	
		}	
		
		// arrays with label corresponding of parameters which are editable by users
		var wmts = ["Layer name :", "TileCol :", "TileRow :", "TileMatrixSet :", "TileMatrix :"];
		var wcs10 = ["Coverage :", "Width :", "Height :", "CRS :", "BBOX :"];	
		var wcs11 = ["Identifier :", "BoundingBox :"];
		var wcs20 = ["Coverageid :", "Subset :"];
		var wcps = ["Query :"];

		// when the user select a web service, the correct form is created
		sel.onchange = function(){
			currentlayer= sel_id.selectedIndex;
			if(sel_id.options[currentlayer].text=='WMTS')			
				createSelection(wmts);
			else if(sel_id.options[currentlayer].text=='WCS 1.0')			
				createSelection(wcs10);
			else if(sel_id.options[currentlayer].text=='WCS 1.1')			
				createSelection(wcs11);
			else if(sel_id.options[currentlayer].text=='WCS 2.0')			
				createSelection(wcs20);			
			else if(sel_id.options[currentlayer].text=='WCPS')			
				createSelection(wcps);			
		};		
	}
	
	/**
	*	Creates a form that the user can complete to send a new request.
	*	@param {Array} tab The array which contains all parameters which can be edit by users.
	*/
	var createForm = function(tab) {	
		// the form is created in a table containing 2 informations : label (name of parameter changed)
		// and the value of it
		var target_id = document.getElementById('formul');
		var val, label, line, cel1, cel2;
		var button = document.createElement('input');

		for(var i=0; i<tab.length; i++){		
			line=document.createElement('tr');
			cel1=document.createElement('td');
			cel2=document.createElement('td');		
			val = document.createElement('input');
			label = document.createElement('span');		
			line.id="lineRequest_" + i;
			cel1.id="labelParam_" + i;
			cel2.id="valueParam_" + i;
			val.type="text";	
			// the label corresponds of the i element contained in the array of the web services 
			// (defined in createSelection())
			label.innerHTML=tab[i];
			
			target_id.appendChild(line);
			document.getElementById(line.id).appendChild(cel1);
			document.getElementById(line.id).appendChild(cel2);		
			document.getElementById(cel1.id).appendChild(label);
			document.getElementById(cel2.id).appendChild(val);				
		}
		// adds the validation button
		button.type='button';
		button.id="send";
		button.value="send request";		
		target_id.appendChild(button);		
	}


	
	/**
	*	This function creates a list to select the base layer that the user want to display.
	*	@param layer the layer which is currently treated (in the list of 'imageryLayers').
	*	@param layerIndex the index of this layer.
	*	@param imageryLayers the collection of layers.
	*	@param baseLayers the array which contains all base layers created.
	*/
	var createBaseLayerSelector = function (layer, layerIndex, imageryLayers, baseLayers) {
		var opt, currentlayer, sel_id, texte;
		var sel = document.createElement('select');
		sel.id = 'base_layers';
		document.getElementById('layerLabel_'+layerIndex).appendChild(sel);
		sel_id = document.getElementById(sel.id);
		
		// when the user selects a layer in the drop-down list, the current layer is removed, and the selected is added
		// then the interface is updated
		// some display issues : in Chrome, first time we access to the app, the default base layer is displayed, but the drop-down
		// list display nothing.
		// in IE, if we select another layer, it is well displayed on the globe,but le list is still focused on the first layer.
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