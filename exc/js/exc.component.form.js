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
exc.components.register({ ///NST:MARK:CLASS:form
	id: 'form',
	isContainer: true,
	selectors: [".form"],
	vs: "none", //value source
	inherits: [],
	fn : { //additional functionality added to the element


	},
	init: function(){
		
	},
	decorate: function(e, node){
		o.addClass("form");
		
	},
	build: function(e){

		var o;
		var flgIsForm = false;
		if(e.hasOwnProperty("node") && e.node){
			o = e.node;
			flgIsForm = ($.tag(o) == "form") ? true : false;
		}

		if(!flgIsForm){
			console.log("cmp.building from tag");
			o = $.htmlToNode("<form class=\"form\"></form>");
		}else{
			console.log("cmp.using existing from tag");
		}

		if(!o) return undefined;

		if( e.hasProperty("attributes") ){
			for(var ak in e.properties.attributes) o.attr(ak, e.properties.attributes[ak]);
		}

		
		if( !e.hasAttr("method") && e.hasOwnProperty("name") ) o.setAttribute("name", e.name);

		if(!e.hasAttr("method")){
			if(e.hasProperty("method")){
				o.setAttribute("method",e.properties.method);
			}else{
				o.setAttribute("method","post");
			}
		}

		if( e.hasProperty("classes") ){
			e.properties.classes.forEach( function(className){ o.addClass(className); });
		}

		return (flgIsForm) ? undefined : o;
	},
	renderCompleted: function(o){

	}
});