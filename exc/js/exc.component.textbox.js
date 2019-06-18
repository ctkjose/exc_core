exc.components.register({ ///NST:MARK:CLASS:textbox
	id: 'textbox',
	selectors: ["[data-uiw='textbox']"],
	vs: "value", //value source
	inherits: ['generic'],
	getter: function(o){
		var v = o.val();
		if(o.hasAttr("value-without-suffix")){
			v = this.valueWithoutSuffix(o,v);
		}
		if(o.hasAttr("value-with-suffix")){
			v = this.valueWithSuffix(o,v);
		}
		if(o.hasAttr("value-strip")){
			v = this.valueStrip(o,v);
		}
		if(o.hasAttr("value-min")){
			v = this.valueMin(o,v);
		}
		if(o.hasAttr("value-max")){
			v = this.valueMax(o,v);
		}
		
		return v;
	},
	setter: function(o, value){
		$.data(o,"uiw-value-last", o.val() );
		o.val(value);
	},
	valueStrip: function(o, v){
		var rs = o.getAttribute("value-strip");
				
		var re = new RegExp("(" + rs + ")$");
		var s = "" + v;
		var m = re.exec(s);
		if(m){
			s = s.replace(m[1],"");
		}
		return s;
	},
	valueWithoutSuffix: function(o, v){
		var rs = o.getAttribute("value-without-suffix");
				
		var re = new RegExp("(" + exc.types.strings.makeRegEx(rs) + ")$");
		var s = "" + v;
		var m = re.exec(s);
		if(m){
			s = s.replace(m[1],"");
		}
		return s;
	},
	valueWithSuffix: function(o, v){
		var rs = o.getAttribute("value-with-suffix");
			
		var re = new RegExp("(" + exc.types.strings.makeRegEx(rs) + ")$");
		var s = "" + v;
		var m = re.exec(s);
		if(!m){
			s+= rs;
		}
		return s;
	},
	valueMax: function(o,v){
		var b = o.getAttribute("value-max");
		var a = v * 1;
		if(a > b) return b;
		return v;
	},
	valueMin: function(o,v){
		var b = o.getAttribute("value-min");
		var a = v * 1;
		if(a < b) return b;
		return v;
	},
	fn : { //additional functionality added to the element
		
	},
	build: function(e){

		var inputType = (["email","password"].indexOf(e.type) >= 0) ? e.type : "text"
		var t = $.htmlToNode("<input type='" + inputType +"' value=''>");
		var k = "";
		
		t.addClass("textbox vs vs-v").setAttribute("data-uiw", "textbox");
		t.attr("name", e.name );

		if(e.hasProperty("size")){
			t.attr("size", e.property("size"));
			$.css(t, {"flex-grow":0, "flex-shrink":0});
		}

		if(e.hasProperty("placeholder")) t.attr("placeholder", e.property("placeholder"));
		if(e.hasProperty("help")) t.attr("title", e.property("help"));
		if(e.hasProperty("border") && !e.property("border")) t.addClass("no-border");

		if( e.hasProperty("classes") ){
			e.properties.classes.forEach( function(className){ t.addClass(className); });
		}
		if( e.hasProperty("attributes") ){
			for(var ak in e.properties.attributes) t.attr(ak, e.properties.attributes[ak]);
		}
		
		if(e.hasProperty("disabled") ){
			if(e.property("disabled")){
				t.addClass("is-disabled").prop('disabled',true).prop('readonly',true);
			}else{
				t.removeClass("is-disabled").prop('disabled',false).prop('readonly',false);
			}
		}

		exc.components.installValueInterface(t,"value", this);
		var suffix = e.property("suffix");
		var prefix = e.property("prefix");
		
		if((typeof(suffix) != "undefined") || (typeof(prefix) != "undefined") ){
			
			t.addClass("inside-container exc-rendered");
			var container = exc.components.items.container.createContainerForElement(t, prefix, suffix);
			container.addClass("exc-rendered");

			if(e.hasProperty("width")){
				$.css(container,{"width": e.property("width"), "flex-grow":0});
			}
			return container;
		}

		if(e.hasProperty("width")){
			$.css(t,{"width": e.property("width"), "flex-grow":0, "flex-shrink":0});
		}

		return t;
	},
	renderCompleted: function(o){

		if(o.hasAttr("data-container-uiw")){
			var cn = o;
			o = cn.child("[data-uiw=textbox]");
			
			var fnDecorationClick = function(e){ //static callback
					var d = $.fromEvent(e, ".decoration");
				
					var cn = $.closest(d, ".exc-textbox-container");
					var o = $.get("[data-uiw=textbox]", cn);
					if(o.hasClass('is-disabled')) return;
					var msg = (cn.child(".decoration:last-child") == d) ? o.attr("data-exc-publishonsuffixclick") : o.attr("data-exc-publishonprefixclick");

					var v = $.value(o);
					//app.publish(msg, {'cmd':msg, 'event': e, 'value': v });
					exc.components.sendMessage(o, msg, {'cmd':msg, 'event': e, 'value': v });
			};
			if(o.hasAttr("data-exc-publishonsuffixclick")){
				$.onAction(cn.child(".decoration:last-child"), "click.suffixBttn.handler()", fnDecorationClick);
			}
			if(o.hasAttr("data-exc-publishonprefixclick")){
				$.onAction(cn.child(".decoration:first-child"), "click.prefixBttn.handler()", fnDecorationClick);
			}
		}
		o.onfocus = function(e){
			var o = $.parent(e.target,".field");
			if(!o) return;
			o.addClass("has-focus");
		};
		o.onblur = function(e){
			var o = $.parent(e.target,".field");
			if(!o) return;
			o.removeClass("has-focus");
		};
		
		if(o.hasClass("value-modifiers-enforce")){
			$.onAction(o, "change.textboxValueObserver.validation()", function(e){
				var o = $.fromEvent(e, "[data-uiw]");
				var v1 = o.val();
				var v2 = $.value(o);
				if(v2 != v1) {
					o.val(v2);
				}
				return true;
			});
		}
		if(!$.hasAction(o,{event:"change",name:"onChangePublish",handler:"handler"})){
			var fnChange = function(e){ //static callback
				var o = $.fromEvent(e, "[data-uiw]");
				if(o.hasClass('is-disabled')) return;
				var v1 = $.value(o);

				var msg = $.name(o) + "_change";
				o.assignValue(v1);
				
				exc.components.sendMessage(o, msg, {'cmd':msg, 'event': e, 'value': v1, "previous_value": $.data(o, "uiw-value-last") });
				$.data(o, "uiw-value-last", o.val() );
			};
			$.onAction(o, "change.textChange.handler()", fnChange);
		}

	}
});

(function(){
	var p = core.extend({}, exc.components.items.textbox);
	p.id = "password";
	exc.components.register(p); ///NST:MARK:CLASS:password

	var e = core.extend({}, exc.components.items.textbox);
	p.id = "email";
	exc.components.register(e); ///NST:MARK:CLASS:email

})();