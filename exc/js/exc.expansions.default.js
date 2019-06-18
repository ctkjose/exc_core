
/*
exc.expansions.define( { ///NST:MARK:CLASS:exc-build
	name: "exc-build",
	apply: function(o){ //returns true if this event can be used with this component
		return true;
	},
	install: function(any){ //static callback
		var o = $.get(any);
		console.log("callback for build...");
		console.log(o);
	}
});
*/

exc.expansions.define( { ///NST:MARK:CLASS:exc-publishOnChange
	name: "exc-publishOnChange",
	apply: function(o){ //returns true if this event can be used with this component
		return true;
	},
	install: function(any){ //static callback
		var o = $.get(any);
		
		if($.hasAction(o, {event:"change",name:"publishOnChange",handler:"handler"})) return;
		var fn = function(e){ //static callback
			var o = $.fromEvent(e, "[data-uiw]");
			if(o.hasClass('is-disabled')) return;

			var msg = o.attr("data-exc-publishOnChange");
			app.publish(msg, {'cmd':msg, 'event': e});
		};
		$.onAction(o, "change.publishOnChange", fn);
	}
});
exc.expansions.define( { ///NST:MARK:CLASS:exc-publishOnClick
	name: "exc-publishOnClick",
	apply: function(o){ //returns true if this event can be used with this component
		return true;
	},
	install: function(any){ //static callback
		var o = $.get(any);
		
		if($.hasAction(o, {event:"click",name:"publishOnClick",handler:"handler"})) return;
		var fn = function(e){ //static callback
			var o = $.fromEvent(e, "[data-uiw]");
			if(o.hasClass('is-disabled')) return;

			var msg = o.getAttribute("data-exc-publishOnClick");
			app.publish(msg, {'cmd':msg, 'event': e});
		};
		$.onAction(o, "click.publishOnClick", fn);
	}
});
exc.expansions.define( { ///NST:MARK:CLASS:exc-publishOnBlur
	name: "exc-publishOnBlur",
	apply: function(o){ //returns true if this event can be used with this component
		return true;
	},
	install: function(any){ //static callback
		var o = $.get(any);
		
		if($.hasAction(o, {event:"blur",name:"publishOnBlur",handler:"handler"})) return;
		var fn = function(e){ //static callback
			var o = $.fromEvent(e, "[data-uiw]");
			if(o.hasClass('is-disabled')) return;

			var msg = o.getAttribute("data-exc-publishOnBlur");
			app.publish(msg, {'cmd':msg, 'event': e});
		};
		$.onAction(o, "blur.publishOnBlur", fn);
	}
});
exc.expansions.define( { ///NST:MARK:CLASS:exc-publishOnFocus
	name: "exc-publishOnFocus",
	apply: function(o){ //returns true if this event can be used with this component
		return true;
	},
	install: function(any){ //static callback
		var o = $.get(any);
		
		if($.hasAction(o, {event:"focus",name:"publishOnFocus",handler:"handler"})) return;
		var fn = function(e){ //static callback
			var o = $.fromEvent(e, "[data-uiw]");
			if(o.hasClass('is-disabled')) return;

			var msg = o.getAttribute("data-exc-publishOnFocus");
			app.publish(msg, {'cmd':msg, 'event': e});
		};
		$.onAction(o, "blur.publishOnFocus", fn);
	}
});
exc.expansions.define( { ///NST:MARK:CLASS:exc-publishOnPaste
	name: "exc-publishOnPaste",
	apply: function(o){ //returns true if this event can be used with this component
		return true;
	},
	install: function(any){ //static callback
		var o = $.get(any);
		
		if($.hasAction(o, {event:"paste",name:"publishOnPaste",handler:"handler"})) return;
		var fn = function(e){ //static callback
			var o = $.fromEvent(e, "[data-uiw]");
			if(o.hasClass('is-disabled')) return;

			var msg = o.getAttribute("data-exc-publishOnPaste");
			app.publish(msg, {'cmd':msg, 'event': e});
		};
		$.onAction(o, "paste.publishOnPaste", fn);
	}
});
exc.expansions.define( { ///NST:MARK:CLASS:exc-clickConfirm
	name: "exc-clickconfirm",
	install: function(any){
		var o = $.get(any);
		
		if($.hasAction(o, {event:"click",name:"clickconfirm",handler:"validation"})) return;
		var fn = function(e){
			var o = $.fromEvent(e, "[data-uiw]");
			if(o.hasClass('is-disabled')) return false;

			var msg = o.getAttribute("data-exc-clickconfirm");
			var ok = confirm(msg);
			if(ok) return true;
			return false;
		};
		$.onAction(o, "click.clickconfirm.validation()", fn);
	}
});
exc.expansions.define( { ///NST:MARK:CLASS:exc-autoDisable
	name: "exc-autoDisable",
	install: function(any){
		var o = $.get(any);
		
		if($.hasAction(o, {event:"click",name:"autodisable",handler:"done"})) return;
		var fn = function(e){ 
			var o = $.fromEvent(e, "[data-uiw]");
			if(o.hasClass('is-disabled')) return;

			var ok = o.getAttribute("data-exc-autoDisable");
			if( !ok ) return;
			$.component(o).disable();
		};
		$.onAction(o, "click.autodisable()", fn);
	}
});
exc.expansions.define( { ///NST:MARK:CLASS:exc-clickDisable
	name: "exc-clickDisable",
	install: function(any){
		var o = $.get(any);
		if($.hasAction(o, {event:"click",name:"clickdisable",handler:"done"})) return;
		
		var fn = function(e){
			var o = $.fromEvent(e, "[data-uiw]");
			//if(o.hasClass('is-disabled')) return;

			var sel = o.getAttribute("data-exc-clickDisable");
			var t = $.component(sel);
			if(t){
				try{
					t.disable();
				}catch(e){}
			}
		};
		$.onAction(o, "click.clickdisable.done()", fn);
	}
});
exc.expansions.define( { ///NST:MARK:CLASS:exc-clickEnable
	name: "exc-clickEnable",
	install: function(any){ //static callback
		var o = $.get(any);
		
		if($.hasAction(o, {event:"click",name:"clickenable",handler:"done"})) return;
		var fn = function(e){ //static callback
			var o = $.fromEvent(e, "[data-uiw]");
			//if(o.hasClass('is-disabled')) return;
			var sel = o.getAttribute("data-exc-clickEnable");
			var t = $.component(sel);
			if(t){
				try{
					t.enable();
				}catch(e){}
			}
		};
		$.onAction(o, "click.clickenable.done()", fn);
	}
});

