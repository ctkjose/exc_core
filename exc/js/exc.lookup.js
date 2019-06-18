exc.views.showLookup = function(options){
	var ops = core.extend({
		'lng': "en",
		'caption' : "Value Lookup",
		'center' : false,
		'valueBuild': null,
		'valueSet': null,
		'valueGet': null,
	}, options);

	ops.promise = core.promise.create();
	ops.commitValue = function(v){

		ops.promise.resolve(v);

		if(ops.hasOwnProperty("publish") && (typeof(ops.publish) == "string")){
			app.publish(ops.publish, {'value': v});
		}
		if(typeof(ops.valueSet) == "function"){
			ops.valueSet(v);
		}

	};

	var dialog;
	function lkBuildDialog(){

		var def = { 
			name: name,
			title: ops.caption,
			options:{
				closeButton: true,
			}
		};
		
		exc.views.items[name] = exc.views.modal.create(def);
		var dialog = exc.views.items[name];

		

		var p = dialog.o.child(".exc-modal-body");
		var i, selected;
		var _this = this;
		
		var s = "";
		//s+= '<div class="exc-popupover__arrow"></div>';
		s+= '<div class="exc-lookup-row exc-lookup-row-search">';
		s+= '<div class="exc-textbox-container exc-rendered"><i class="decoration"><span class="la la-search"></span></i><input autocomplete="off" class="exc-textbox exc-rendered no-border uiw-ignore" type="text" spellcheck="false" role="textbox" tabindex="0" name="lookup_search_text"><i class="decoration"><span class="exc-lookup-search-clear la la-times-circle"></span></i></div>';
		s+= '</div>';

		s+= '<div class="exc-lookup-row exc-lookup-row-items">';
		s+= '<div class="exc-lookup-row-entry exc-lookup-row-entry-loading"><i class="la la-circle-o-notch la-spin"></i> Loading options...</div>';
		s+= '</div>';

		//s+= '<div class="exc-lookup-row exc-lookup-row-footer">';
		//s+= '<div name="cmd_lookup_popup_close" class="btn exc-rendered e1" data-uiw="btn" role="button">CANCEL</div>';
		//s+= '</div>';

		$.append(p,s);

		p.addClass("no-padding");
		
		dialog.lastSearchValue = "";
		dialog.isFiltering = false;
		dialog.cancelFiltering = false;

		p.child("input[name=\"lookup_search_text\"]").on("keyup", function(e){
			var v = e.target.value;
			lkDialogFilterWithValue(v);
		});

		//p.child("[name=cmd_lookup_popup_close]").on("click", function(e){
		//	dialog.close();
		//});

		p.child(".exc-lookup-search-clear").on("click", function(e){
			var t = $.closest(e.target, ".exc-textbox-container").child("input");
			t.value = "";
			t.focus();

			p.child(".exc-lookup-row-items").removeClass("exc-lookup-row-items-filtered");

			p.find(".exc-lookup-row-entry-matched").forEach(function(o){
				o.removeClass("exc-lookup-row-entry-matched");
			});
		});


		dialog.loadItems = function(ops){

			if(typeof(ops) == "undefined") return;
	
			if(typeof(ops) == "function"){
				var items = ops();
				this.listItems(items);
				return;
			}
	
			if(typeof(ops) == "object"){
				if(Array.isArray(ops)){
					this.listItems(ops);
					return;
				}
	
				//if(ops.hasOwnProperty())
				this.listItems(ops);
				return;
			}
	
		};
		dialog.listItems  =function(items){
			var p = this.o.child(".exc-modal-body");
			var o = p.child(".exc-lookup-row-items");
			o.removeClass("exc-lookup-row-items-filtered");
			o.find(".exc-lookup-row-entry").forEach(function(entry){
				o.removeChild(entry);
			});
	
			var is_array = Array.isArray(items);
			var opv="", opc="", v="", opl = {};
	
			var psi = function(k, v){
				opl[k] = v;
	
				var op = $.htmlToNode('<div class="exc-lookup-row-entry"></div>');
				op.html(v);
				op.setAttribute("data-value", k);
				op.setAttribute("data-title", v);
	
				$.append(o, op);
	
	
				op.addEventListener("click", function(e){
					var o = $.closest(e.target, ".exc-lookup-row-entry");
					var v = o.getAttribute("data-value");
					lkSelectValue(v);
				});
			};
	
			for (k in items) {
				v = items[k];
	
				if(!is_array){
					psi(k, v);
					continue;
				}
	
				if(Array.isArray(v)){
					if(v.length >= 2){
						psi(v[0], v[1]);
					}
				}else if(typeof(v) === "string"){
					psi(v, v);
				}else if(typeof(v) === "number"){
					psi(""+v, v);
				}else if(typeof(v) === "object"){
					if(v.hasOwnProperty("value")){
						opv = v.value;
						opc = opv;
					}
					if(v.hasOwnProperty("caption")) opc = v.caption;
					psi(opv, opc);
				}
			}
	
		};


		return dialog;
	};
	function lkDialogFilterWithValue(s){
		var r = dialog.o.child(".exc-lookup-row-items");

		if(s.length ==0){
			r.removeClass("exc-lookup-row-items-filtered");
			r.find(".exc-lookup-row-entry-matched").forEach(function(o){ o.removeClass("exc-lookup-row-entry-matched"); });
			dialog.lastSearchValue = "";
			return;
		}
		if(s.length ==dialog.lastSearchValue ){
			return;
		}

		dialog.isFiltering = true;
		var flgClear = false;
		var list;

		if( (dialog.lastSearchValue.length > 0) && (s.indexOf(dialog.lastSearchValue) == 0) ){
			list = r.find(".exc-lookup-row-entry.exc-lookup-row-entry-matched");
		}else{
			list = r.find(".exc-lookup-row-entry");
		}

		s = s.toLowerCase();
		for(var i in list){
			
			if(dialog.cancelFiltering){
				break;
			}

			var op = list[i];
			if( (op.getAttribute("data-title").toLowerCase().indexOf(s) >=0) || (op.getAttribute("data-value").toLowerCase().indexOf(s) >=0) ){
				op.addClass("exc-lookup-row-entry-matched");
			}else{
				op.removeClass("exc-lookup-row-entry-matched");
			}
		}

		r.addClass("exc-lookup-row-items-filtered");
		dialog.lastSearchValue = s;
		dialog.isFiltering = false;
	}

	function lkSelectValue(v){
		ops.commitValue(v);
		dialog.close();
	}
	var name = "dialogDateLookup";

	dialog = exc.views.items[name];
	if(!dialog ){
		dialog = lkBuildDialog();
		
		
	}

	var items = [];
	if(ops.hasOwnProperty("valueGet") && (typeof(ops.valueGet) == "function")){
		var items = ops.valueGet();
		dialog.loadItems(items);
	}else{
		
	}

	dialog.promise = ops.promise;
	dialog.show();
	return dialog;
}