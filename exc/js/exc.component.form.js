exc.components.register({ ///NST:MARK:CLASS:formRow
	id: 'formRow',
	isContainer: true,
	selectors: [".form-row"],
	vs: "none", //value source
	inherits: [],
	fn : { //additional functionality added to the element


	},
	build: function(e){
		var o = $.htmlToNode("<div class=\"form-row\"></div>");

		if( e.hasOwnProperty("name") ) o.setAttribute("name", e.name);
		if( e.hasProperty("classes") ){
			e.properties.classes.forEach( function(className){ o.addClass(className); });
		}
		
		return o;
	},
	renderCompleted: function(o){

	}
});
exc.components.register({ ///NST:MARK:CLASS:formSpan
	id: 'formSpan',
	isContainer: false,
	selectors: [".span"],
	vs: "none", //value source
	inherits: [],
	fn : { //additional functionality added to the element


	},
	build: function(e){
		var o = $.htmlToNode("<div class=\"span\"></div>");
		if( e.hasProperty("caption") ){
			$.append(o, e.property("caption"));
		}
		if( e.hasProperty("classes") ){
			e.properties.classes.forEach( function(className){ o.addClass(className); });
		}

		return o;
	},
	renderCompleted: function(o){

	}
});
exc.components.register({ ///NST:MARK:CLASS:formField
	id: 'formField',
	isContainer: true,
	selectors: [".field"],
	vs: "none", //value source
	inherits: [],
	fn : { //additional functionality added to the element


	},
	build: function(e){
		var o = $.htmlToNode("<div class=\"field\"></div>");
		if( e.hasOwnProperty("name") ) o.setAttribute("name", e.name);
		if( e.hasProperty("caption") ){
			var caption = e.property("caption");
			var lbl = "<label class='label'>" + caption + "</label>";
			$.append(o, lbl);
		}
		if( e.hasProperty("classes") ){
			e.properties.classes.forEach( function(className){ o.addClass(className); });
		}
		return o;
	},
	renderCompleted: function(o){

	}
});