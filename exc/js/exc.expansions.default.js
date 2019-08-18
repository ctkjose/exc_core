
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

exc.expansions.addAction(  
	{'type': 'msg', ///NST:MARK:CLASS:action_jose
		'r': /\[([A-Za-z0-9_]+)\]/,
		'args': [
			{'name': 'msg', 'idx': 1, 'default': '', 'type':'string', 'transform': null },
		]
	}
);
exc.expansions.addAction( 
	{'type': 'cfn', ///NST:MARK:CLASS:action-controllerfunction
		'r': /\[([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\]/,
		'args': [
			{'name': 'controller', 'idx': 1, 'default': '', 'transform': null },
			{'name': 'fn', 'idx': 2, 'default': '', 'type':'string', 'transform': null }
		]
	}
);
exc.expansions.addAction( 
	{'type':'hndl', ///NST:MARK:CLASS:action-enable-disable
		'r':/(disable|enable)\(\$([A-Za-z0-9_.]+)\)/,
		'args': [
			{'name': 'action', 'idx': 1, 'default': '', 'type':'string', 'transform': null },
			{'name': 'sel', 'idx': 2, 'default': '', 'type':'string', 'transform': null },
		],
		'handler': function(evt, args){
			var o;
			if(args.sel == 'self'){
				o = $.fromEvent(e, "[data-uiw]");
			}else{
				o = $.component(args.sel);
			}
			if(!o) return;
			try{
				if(args.action == "enable"){
					o.enable();
				}else if(args.action == "disable"){
					o.disable();
				}
			}catch(err){}
		}
	}
);
/*
exc.expansions.addAction( 
	{'type':'hndl', ///NST:MARK:CLASS:action-validate-value
		'r':/(value)\((\/.+\/|[<>!]?\=?\s?\-?[0-9.]+|\'[^\']*\'|\"[^\"]*\")\s?,\s?(\'[^\']*\'|\"[^\"]*\"|__\((\'[^\']*\'|\"[^\"]*\")\)|\[[a-zA-Z\_\.]+\])\)/
		'args': [
			{'name': 'action', 'idx': 1, 'default': 'value', 'type':'string', 'transform': null },
			{'name': 'value', 'idx': 2, 'default': '', 'type':'string', 'transform': null },
			{'name': 'msg', 'idx': 3, 'default': '', 'type':'string', 'transform': null },
		],
		'handler': function(evt, args){
			var o = $.fromEvent(e, "[data-uiw]");
			if(!o) return;
			try{
				var v = o.getValue();
				if(args.action == "enable"){
					o.enable();
				}else if(args.action == "disable"){
					o.disable();
				}
			}catch(err){}
		}
	}
);
*/

(function(){
	var _events = ['click', 'change', 'blur', 'focus', 'dblclick', 'keydown','keyup','keypress', 'mouseenter','mousemove','mouseover','mouseup', 'copy','cut','paste'];

	

	var fndecorate = function(def, evt){
		var eattr = "m-" + evt;
		var fnMagicAction =  function(e){ //static callback
			var o = $.fromEvent(e, "[data-uiw]");
			if(o.hasClass('is-disabled')) return;
			var attr = o.getAttribute(eattr);
			
			if( exc.expansions.performAction(attr, e, [])){
				
			}
		};
		def.install = function(any){ //static callback
			var o = $.get(any);
			if($.hasAction(o, {event:evt,name:"m"+evt,handler:"handler"})) return;
			$.onAction(o, evt + ".m" + evt, fnMagicAction);
		};
		
	}
	var fn =[];
	for(var idx=0; idx< _events.length; idx++){
		var evt = _events[idx];

		var def = {
			'name': "m-" + evt,
			apply: function(o){
				return true;
			}
		};

		fndecorate(def, evt);
		exc.expansions.define( def );
	}
})();
exc.expansions.define( { ///NST:MARK:CLASS:exc-publishOnClick1
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
exc.expansions.define( { ///NST:MARK:CLASS:exc-publishOnClick1
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
exc.expansions.define( { ///NST:MARK:CLASS:m-confirm
	name: "m-confirm",
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

