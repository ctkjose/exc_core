exc.components.register({ ///NST:MARK:CLASS:check
	id: 'check',
	selectors: [".check", "[data-uiw='check']"],
	inherits: ['generic'],
	transformValue: function(v){
		if(v) return 1;
		return 0;
	},
	getter: function(o){
		return o.getAttribute("data-uiw-value");
	},
	setter: function(o, value){
		var v = 0;
		
		if(value){
			o.addClass("is-active");
			o.attr("aria-checked", "true");
			v = "1";
		}else{
			o.removeClass("is-active");
			o.attr("aria-checked", "false");
		}

		o.setAttribute("data-uiw-value", v);
	},
	fn : { //additional functionality added to the element
		setAction: function(a){
			this.data('action-message',a);
		},
		toggle: function(){
			var v = (this.getAttribute("data-uiw-value")=="1") ? 0 : 1;
			this.setValue(v);
			return this;
		},
	},
	init: function(o){

	},
	build: function(e){
		var o = $.htmlToNode("<div class='check vs vs-a' role='checkbox' tabindex='0' aria-checked=false data-uiw='check'><div class='check-mark'></div></div>");
//
		o.attr("name", e.name );
		o.attr("role", "checkbox" );

		var v = 0;
		
		if( e.hasProperty("default") ) v = (e.property("default") == "1") ? 1 : 0;
		o.setAttribute("data-uiw-value", v);

		if(v == "1"){
			o.addClass("is-active");
			o.attr("aria-checked", "true");
		}

		exc.components.installValueInterface(o,"attr", this);
		o.vs.value = v

		if( e.hasProperty("help") ){
			o.attr( "title", e.property("help") );
			o.attr( "aria-label", e.property("help") );
		}

		if( e.hasProperty("classes") ){
			for(var i in e.properties.classes) o.addClass(e.properties.classes[i]);
		}
		if( e.hasProperty("attributes") ){
			for(var ak in e.properties.attributes) o.setAttribute(ak, e.properties.attributes[ak]);
		}
		
		if(e.hasProperty("disabled") ){
			if(e.property("disabled")){
				o.addClass("is-disabled").prop('disabled',true).attr('aria-disabled',"true").prop('readonly',true);
			}else{
				o.removeClass("is-disabled").prop('disabled',false).attr('aria-disabled',"false").prop('readonly',false);
			}
		}
		
		if( e.hasProperty("label") ){
			$.append(o, "<span>" + e.property("label") + "</span>");
		}

		return o;
	},
	renderCompleted: function(o){
		var fn = function(e){
			var msg;			
			var o = exc.components.get( $.fromEvent(e,".check") );
			var n = $.name(o);

			if(o.hasClass('is-disabled')) return false;
			var v1 = (o.getAttribute("data-uiw-value")=="1") ? 1 : 0;
			o.toggle();

			var v = (o.getAttribute("data-uiw-value")=="1") ? 1 : 0;
			if(!$.hasAction(o, {event:"change",name:"publishOnChange",handler:"handler"})){
				msg = n + "_change";
				exc.components.sendMessage(o, msg, {'cmd':msg, 'event': e, "value": v});
			}
			
			///TODOo.trigger("change", [v]);

			v = (o.getAttribute("data-uiw-value")=="1") ? 1 : 0;
			v = v ? "on" : "off";
			msg = n + "_" + v;
			exc.components.sendMessage(o, msg, {'cmd':msg, 'event': e});
			
			return true;
		};

		$.onAction(o, "click.checkClick.validate()", fn);
		$.onAction(o, "keydown.checkClick.validate()", fn);
	},

});
