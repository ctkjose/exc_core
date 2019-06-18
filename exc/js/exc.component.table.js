exc.components.register({ ///NST:MARK:CLASS:table
	id: 'table',
	selectors: [".table", "[data-uiw='table']"],
	inherits: ['generic'],
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
		sortColumn: function(th){
			var tbl = this;
			var tbody = this.child('tbody');
			var def = $.data(this, "tableDef");
			
			
			var k = th.getAttribute("data-column-name");
			var sidx = 0;
			var items = [];
			Object.keys(def.data).forEach(function(uid, i){
				var v = {'key': k, 'uid': uid, 'row': tbl.child(".table-ds[data-row-uid=\"" + uid + "\"]") };

				v.idx = i;
				v.ridx = v.row.getAttribute("data-row");
				v.value = def.data[uid][k];

				items.push(v);
			});

			tbl.find(".exc-table-header-column.exc-table-header-sortable").forEach(function(td){
				if(td == th) return;
				td.removeClass("exc-table-header-sort-desc").removeClass("exc-table-header-sort-asc").addClass("exc-table-header-sort-none");
			});

			var fn;
			if(th.hasClass("exc-table-header-sort-desc")){
				fn = function(a, b){
					if (a.value < b.value) {
						return 1;
					}
					if (a.value > b.value) {
						return -1;
					}
					return 0;
				};
				items.sort(fn);
			}else if(th.hasClass("exc-table-header-sort-asc")){
				fn = function(a, b){
					if (a.value > b.value) {
						return 1;
					}
					if (a.value < b.value) {
						return -1;
					}
					return 0;
				};
				items.sort(fn);
			}

			for(var i in items){
				var r = items[i];
				if(def.enumerateRows){
					r.row.child(".table-ds-idx").html((i*1)+1);
				}
				tbody.appendChild( r.row);
			}
		},

		getDefinition: function(){
			return $.data(this, "tableDef");
		},
		getData: function(){
			return ($.data(this, "tableDef")).data;
		},
		formulaWhen: function(e, data){
			var exp = this.formula(e, data);

			var ok = false;
			exp = "ok = (" + exp + ") ? true : false;";
			try{
				eval(exp);
			}catch(err){
				return false;
			}
			return ok;
		},
		formula: function(e, data){
			var exp = e;
			var flgURLEncode = false;
			var flgEval = false;

			m = exp.match(/^url\((.+)\)$/);
			if(m){
				exp = m[1];
				flgURLEncode = true;
			}
			m = exp.match(/^eval\((.+)\)$/);
			if(m){
				exp = m[1];
				flgEval = true;
			}
		
			
			for(var k in data){
				var v = data[k];
				var p = typeof(v);
				if(p!="string" && p != "number" && p != "boolean") continue;
				
				exp = exc.types.strings.replaceAll(exp, '%' + k + '%', v );
			}

			if(flgURLEncode) exp = encodeURIComponent(exp);
			
			if(flgEval){
				try{
					eval("exp=(" + exp + ");");
				}catch(err){
					exp = "";
				}
			}
			//console.log("table.formula(%s)=%s", e, exp);
			return exp;
		},
		updateTableState: function(){
			this.updateTallies();
		},
		updateTallies: function(){
			var def = $.data(this, "tableDef");

			var tr, td, i, col, v;
			tr = this.child(".table-row-tallies");
	
			for (i in def.columns) {
				col = def.columns[i];

				if( !col.tally ) continue;
				td = tr.child("[data-column=\"" + i + "\"]");
				v = col.tallyValue;
				v = v/100;
				if(col.format.length > 0 ) {
					var fargs = [v].concat(col.format.split("|"));
					v = exc.types.numbers.format.apply(this, fargs);
				}
				td.html(v);
			}
		},
		bindToDataSource: function(ds){ //WIP...
			if(!ds) return;
			
			var def = $.data(this, "tableDef");
			def.flgHasDataSource = true;
			def.ds = ds;
			
		},
		rowSetDataForIndex: function(idx, data){
			var tr = this.child(".table-ds[data-row='" + idx + "']");
			var uid = tr.attr("data-row-uid");
			this.rowSetData(uid, data);
		},
		rowSetData: function(uid, data){
			var def = $.data(this, "tableDef");

			var tf = this.child(".table-footer");
			var tb = this.child(".table-body");

			var tr = this.child(".table-ds[data-row-uid='" + uid + "']");
			var rData = def.data[uid];
			if(rData == []._) rData = {};
			
			var c, v,vn;
			c = def.columns.length;

			for (i = 0; i < c; i++) {
				col = def.columns[i];
				if(!data.hasOwnProperty(col.name)) continue;
				v = data[col.name];
				rData[col.name] = v;

				if(def.widgets.hasOwnProperty(col.name)){
					var cmp = $.component(tr.child("[name='" + uid + "_" + col.name + "']"));
					cmp.setValue(data[col.name]);
					continue;
				}

				var td = tr.child(".table-ds-value[data-ds-field='" + col.name + "']");
				console.log(td);

				
				if(col.editable){
					td.setAttribute("data-value", v);
					td.child(".table-ds-editable-content").html(v);

					continue;
				}

				if(col.formula.length > 0){
					v = this.replaceValues(col.formula, rData, keys);
				}


				if( col.tally ){
					vn = exc.types.numbers.format(v, 2, '', '') * 1;
					col.tallyValue += vn;
					td.setAttribute("data-value", vn);
				}

				if(col.lookup){
					if( col.lookup.hasOwnProperty(v) ){
						td.setAttribute("data-value", v);
						td.setAttribute("title", "Value " + v);
						v = col.lookup[v];
					}
				}

				if(col.lookupCSS && Array.isArray(col.lookupCSS) && (col.lookupCSS.length > 0) ){
					col.lookupCSS.forEach(function(entry){
						var ok = this.formulaWhen(entry.when, rData);
						if(ok){
							td.addClass(entry.className);
						}else{
							td.removeClass(entry.className);
						}
					}, this);
				}

				td.setAttribute("data-format", col.format); //decimals, decPoint, thousandsSep
				if(col.format.length > 0){
					var fargs = [v].concat(col.format.split("|"));
					v = exc.types.numbers.format.apply(this, fargs);
				}
				td.html(v);
			}
			this.updateTableState();
		},
		rowAdd: function(data){
			var def = $.data(this, "tableDef");

			var tf = this.child(".table-footer");
			var tb = this.child(".table-body");

			var i, c, col, k, v, vn, idx, td, tdn;

			var rc = ++def.count;
			
			if(data == []._) data = {};
			var values = [];

			
			var uid = core.createUID() + "_" + rc;
			def.data[uid] = data;

			var tr = $.htmlToNode("<tr class='table-ds' data-row='" + rc +"' data-row-uid='" + uid + "'></tr>");

			if(def.enumerateRows){
				td = $.htmlToNode("<td class='table-ds-idx'>" + rc + "</td>");
				$.append(tr, td);
			}

			c = def.columns.length;
			for (i = 0; i < c; i++) {
				col = def.columns[i];
				v = col.default;

				k = i;
				if( data.hasOwnProperty(col.name) ) k = col.name;
				if(data[k] != []._) v = data[k];
					

				tdn = $.htmlToNode("<td class='table-ds-name' data-row='" + rc + "' data-column='" + i + "' data-ds-field='" + k + "'>" + col.caption + "</td>");
				td = $.htmlToNode("<td class='table-ds-value' data-row='" + rc + "' data-column='" + i + "' data-ds-field='" + k + "'></td>");
	
				if(col.sortable) td.setAttribute("data-sortable", 1);
				td.setAttribute("data-formula", col.formula);

				if(col.formula.length > 0){
					v = this.replaceValues(col.formula, data, def.keys); //fix me....
				}


				if( col.tally ){
					vn = exc.types.numbers.format(v, 2, '', '') * 1;
					col.tallyValue += vn;
					td.setAttribute("data-value", vn);
				}

				if(col.lookup){
					if( col.lookup.hasOwnProperty(v) ){
						td.setAttribute("data-value", v);
						td.setAttribute("title", "Value " + v);
						v = col.lookup[v];
					}
				}

				if(col.lookupCSS && Array.isArray(col.lookupCSS) && (col.lookupCSS.length > 0) ){
					col.lookupCSS.forEach(function(entry){
						var ok = this.formulaWhen(entry.when, data);
						if(ok){
							td.addClass(entry.className);
						}else{
							td.removeClass(entry.className);
						}
					}, this);
				}

				td.setAttribute("data-format", col.format); //decimals, decPoint, thousandsSep
				if(col.format.length > 0){
					var fargs = [v].concat(col.format.split("|"));
					v = exc.types.numbers.format.apply(this, fargs);
				}

				var cell = exc.components.items.table.buildCell(def, v, uid, i, col, td);

				$.append(td, cell.node);
				

				if(col.hideonsize.length > 0){
					 col.hideonsize.forEach(function(sz){
						td.addClass("hide-on-" + sz);
					});
				}


				$.append(tr, tdn);
				$.append(tr, td);
			}


			if (def.rowActions.length > 0) {
				td= $.htmlToNode("<td class='table-ds-actions' data-row='" + rc + "'></td>");
				
				var fnCreateAction = function(a){
					if(!this.formulaWhen(a.condition, data)) return;

					var url = "#";
					var target = '_self';
					var help = '';

					if(a.help) help = a.help;

					var lnk = $.htmlToNode('<a class="table-ds-action table-action" title="' + help + '" href="#" target="' + target + '" data-row="' + rc + '">' + a.caption + '</a>');
					$.data(lnk, "table-action", a);

					this.applyActionEvent(a, lnk);

					$.append(td, lnk);
				};

				
				def.rowActions.forEach(fnCreateAction, this);
				$.append(tr, td);
			}
			$.append(tb, tr);

			if(!def.flgNoUpdate){
				this.updateTableState();
			}
			return {uid: uid, row: tr};
		},
		refreshRow: function(uid){
			
			var tr = this.child(".table-ds[data-row-uid=\"" + uid + "\"]");
			if(!tr) return this;

			var def = $.data(this, "tableDef");
			if(!def.data.hasOwnProperty(uid)){
				return this;
			}

			var tf = this.child(".table-footer");
			var tb = this.child(".table-body");
			var data = def.data[uid];

			var vo, k, v, td, vn;
			var rc = tr.getAttribute("data-row");	

			for(i in def.columns){
				col = def.columns[i];
				k = i;
				if (col.name.length > 0) {
					k = col.name;
				}

				td = tr.child(".table-ds-value[data-ds-field=\"" + k + "\"]");
				v = (typeof(data[k]) != "undefined")  ? data[k] : '';

				if(col.editable){
					vo = td.find(".exc-table-row-column-editable-content").html();
				}else{
					vo = td.html();
				}

				if( col.tally ){
					vn = td.getAttribute("data-value") * 1;
					col.tallyValue -= vn;
					vn = exc.types.numbers.format(v, 2, '', '') * 1;
					td.setAttribute("data-value", vn)
					col.tallyValue += vn;
				}

				
				if(col.lookupCSS && Array.isArray(col.lookupCSS) && (col.lookupCSS.length > 0) ){
					col.lookupCSS.forEach(function(entry){
						var ok = this.formulaWhen(entry.when, data);
						if(ok){
							td.addClass(entry.className);
						}else{
							td.removeClass(entry.className);
						}
					}, this);
				}

				
				if(col.lookup){
					if( col.lookup.hasOwnProperty(v) ){
						td.setAttribute("title", "Value " + v);
						v = col.lookup[v];
					}
				}

				td.setAttribute("data-format", col.format); //decimals, decPoint, thousandsSep
				if(col.format.length > 0){
					var fargs = [v].concat(col.format.split("|"));
					v = exc.types.numbers.format.apply(this, fargs);
				}

				if ( (typeof(v) === 'undefined') || (v === null) ) {
					v = "&nbsp;";
				}
				if(col.editable){
					td.setAttribute("data-value", v);
					td.get(".table-ds-editable-content").html(v);
				}else{
					td.html(v);
				}

			}

			if (def.rowActions.length > 0) {
				var td = tr.child(".table-ds-actions");
				td.find(".table-ds-action").forEach(function(ta){ td.removeChild(ta) });
			
				var fnCreateAction = function(a){
					if(!this.formulaWhen(a.condition, data)) return;

					var url = "#";
					var target = '_self';
					var help = '';

					if(a.help) help = a.help;

					var lnk = $.htmlToNode('<a class="table-ds-action" title="' + help + '" href="#" target="' + target + '" data-row="' + rc + '">' + a.caption + '</a>');
					$.data(lnk, "rowAction", a);

					this.applyActionEvent(a, lnk);

					$.append(td, lnk);
				};

				
				def.rowActions.forEach(fnCreateAction, this);
			}

			this.updateTallies();
			return this;
		},
		applyActionEvent: function(a, o){
			var fn = function(e){
				e.stopPropagation();
				e.preventDefault();

				var data = {};
				var uid = "";
				var td = $.closest(e.target, ".table-action");
				var tr;
				if(td){
					var action = $.data(td, 'table-action');
	
					var t = $.closest(td, ".table");
					var def = $.data(t, "tableDef");
					
					if(td.hasClass("table-ds-action")){
						tr = $.closest(e.target, ".table-ds");
						uid = tr.getAttribute("data-row-uid");
						data = def.data[uid];
					}
				}

				var url, msg, p;
				if(a.type == "navigate"){
					url = t.formula(action.url, data);
					p = [];
					for(var pk in action.params){
						p.push(pk + "=" + encodeURIComponent( t.formula(action.params[pk], data) ) );
					}
					if(p.length > 0) url += "?" + p.join("&");
					window.location.assign(url);
				}else if(a.type == "publish"){
					msg = {'cmd': action.msg, 'event': e, 'row': uid, 'params': action.params, 'data': data  };
					exc.components.sendMessage(o, action.msg, msg);
				}else if(a.type == "fn"){
					msg = {'cmd': action.msg, 'event': e, 'row': uid, 'params': action.params, 'data': data  };

					var fn = action.fn;
					if(typeof(fn) == "string"){
						fn = window[fn];
					}
					if(typeof(fn) != "function"){
						return;
					}
					try{
						fn(msg);
					}catch(err){
						console.log("[EXC][COMPONENT][TABLE][ACTION FAILED] callback is not a function");
						return false;
					}
				}
				return false;
			};
		
			o.addEventListener("click", fn);
		},
	},
	init: function(o){

	},
	replaceValues: function(formula, data, keys){
		var value  = formula;
		
		var m;
		var flgURLEncode = false;
		var flgEval = false;
		
		var flgReplace = value.match(/\%[A-Za-z0-9\-\_]+\%/);
		
		m = value.match(/^url\((.+)\)$/);
		if(m){
			value = m[1];
			flgURLEncode = true;
		}
		m = value.match(/^eval\((.+)\)$/);
		if(m){
			value = m[1];
			flgEval = true;
		}
		
		if(!flgEval && !flgReplace){
			return value;
		}
		
		if(typeof(keys) =="undefined"){
			keys = Object.keys(data);
		}
		
		if(flgReplace){
			for (var j = 0; j < keys.length; j++) {
				var v = data[keys[j]];
				if(flgURLEncode) v = encodeURIComponent(v);
				value = exc.types.strings.replaceAll(value, "%" + keys[j] + "%", v);
			}
		}
		if(flgEval){
			try{
				eval("value=(" + value + ");");
			}catch(err){
				value = "";
			}
		}
		
		
		return value;
	},
	buildSearchBox: function(o, thead, def){
		
		var td = thead.child(".table-header-actions");

		var div = $.htmlToNode("<div class='table-search'><input type='text' class='textbox style-round' size='25' data-lq='' placeholder='Search...'><i class='la la-times-circle table-search-clear'></i></div>");
		$.append(td, div);
		
		var txt = div.child("input[type=\"text\"]");
		
		txt._fs = false;
		txt._fsc = false;

		var cbttn = div.child(".table-search-clear");
		cbttn.addEventListener("click", function(e){
			if(o._fs ){
				o._fsc = true;
			}

			var tbl = $.closest(e.target,".table");
			var rows = tbl.find(".table-ds");
			rows.forEach(function(tr){ tr.removeClass('table-row-hidden'); });

			tbl.child(".table-search > input").value = "";
		});

		

		txt.addEventListener("keydown", function(e){
			var o = e.target;
			if(o._fs ){
				o._fsc = true;
			}
		});
		txt.addEventListener("keyup", function(e){
			var o = e.target;
			var tbl = $.closest(o,".table");
			var def = $.data(tbl, "tableDef");

			var rows = tbl.find(".table-ds");
			var q = o.val();
			var last_q = o.getAttribute("data-lq");

			rows.forEach(function(tr){ tr.removeClass('table-row-hidden'); });

			if(q.trim().length == 0){
				return;
			}

			['.','*','(',')','?', '@','[',']','/'].forEach(function(ch,i) {
				q = q.split(ch).join('\\' + ch);
			});

			var re = RegExp('^(?=.*' + q.trim().split(/\s+/).join(')(?=.*') + ').*$', 'i');

			//console.log(re);
			o._fs = true;
			
			Object.keys(def.data).forEach(function(uid){
				var ok = false;
				if(o._fsc) return; //cancelled
				
				var test = function(value){
					console.log("testing %s=%s", value, q);
					var s = ("" + value).replace(/\s+/g, " ");
					return re.test(s);
				};
				for(var i in def.columns){
					ok = test(def.data[uid][def.columns[i].name]);
					if(ok) break;
				}
				if(!ok){
					var tr = tbl.child(".table-ds[data-row-uid=\"" + uid + "\"]");
					if(tr) tr.addClass('table-row-hidden');
				}
			});

			o._fsc = false;
			o._fs = false;
		});
	
	},
	buildCell: function(def, v, uid,colIdx, colDef, container){
		var out = { v:v, node:null };
	
		if(def.widgets.hasOwnProperty(colDef.name)){ //this cell is a widget

			var w = exc.components.createDefinition(def.widgets[colDef.name]);
			w.name = uid + "_" + colDef.name;

			if(!exc.components.items.hasOwnProperty(w.type)){
				console.log("[EXC][COMPONENTS] Element has a component type of [%s] that is not implemented.", w.type);
				return  out;
			}

			out.node = exc.components.buildComponentForContainer(w, container);
			var wdef = exc.components.items[w.type];

			container.setAttribute("data-ds-field-source", "widget");
			container.setAttribute("data-ds-field-cmp", w.name);
			
			var a = out.node;
			//check for main node
			if($.name(a) != w.name) a = $.child(a, "[name=\"" + w.name + "\"]");

			var cmp = exc.components.get(a, w.type);
			cmp.setValue(v);

			if(cmp.vs){
				cmp.vs.observe(function(value, aTable){
					var p = $.closest(cmp, ".table-ds-value");
					if(p == []._) return;
					var k = p.attr("data-ds-field");
					if(k == []._) return;
					var r = def.data[uid];

					if(!r) r = {};
					r[k] = value;

					def.data[uid] = r;

					var tr = $.closest(p, ".table-ds");
					var t = tr.parentNode.parentNode;
					var msg = {'cmd': def.name + "_row_changed1", 'event': {}, 'table':t, 'row': uid, 'field': k, 'data': def.data[uid] };
					exc.components.sendMessage(t, msg.cmd, msg);
				}, cmp );
			}
			
		}else if(colDef.editable){
			container.addClass("is-editable");
			var ve = $.htmlToNode("<span class='table-ds-editable-content is-editable' contenteditable='true' role='textbox'>" + v + "</span>");
			container.setAttribute("data-value", v);
			out.node = ve;

			ve.addEventListener("keydown", function(e){
				if(e.keyCode == 13){
					e.preventDefault();
					e.target.blur();
					return false;
				}
			});
			ve.addEventListener("blur", function(e){
				e.stopPropagation();
				e.preventDefault();

				var ve = $.closest(e.target, ".table-ds-editable-content");
				var tr = $.closest(ve, ".table-ds");
				var t = tr.parentNode.parentNode;
				var td = $.closest(ve, ".table-ds-value");
				var def = $.data(t, "tableDef");
				var uid  = tr.getAttribute("data-row-uid");
				var k = td.getAttribute('data-ds-field');
				
				if(!def.data.hasOwnProperty(uid)) return;
				var data = def.data[uid];
				if(!data.hasOwnProperty(k)) return;

			
				var v = ve.html();
				v = v.replace(/\<.*?\>/,'');

				if(v == data[k]) return true;
				data[k] = v;

				td.setAttribute("data-value", v);

				var msg = {'cmd': def.name + "_row_changed", 'event': e, 'table':t, 'row': uid, 'field': k, 'data': data, };
				app.publishexc.components.sendMessage(t, msg.cmd, msg);
			});
		}else if ( (typeof(v) === 'undefined') || (v === null) ) {
			out.node = "&nbsp;";
		}else{
			out.node = v;
		}

		return out;
	},
	buildFooterTallies: function(o, t, tf, def){
		var tr = $.htmlToNode("<tr class='table-row-tallies'></tr>");
		if(def.enumerateRows){
			$.append(tr, "<td class='table-tally-idx'>&nbsp;</td>");
		}

		var i, td, col;
		for (i in def.columns) {
			col = def.columns[i];
			td = $.htmlToNode("<td class='table-tally' data-column='" + i + "' data-column-name='" + col.name + "'>&nbsp;</td>");
			
			if(col.hidden){
				td.addClass("table-col-hidden");
			}
			tr.append(td);
		}

		if (def.rowActions.length > 0) {
			$.append(tr, "<td class='exc-table-tally-actions'></td>");
		}

		$.append(tf, tr);

		tr = $.htmlToNode("<tr class='table-actions-row'><td class='table-actions'></td></tr>");
		td = tr.child(".table-actions");
		td.attr("colspan", (def.columns.length + def.fixedColumnCount));
		$.append(tf, tr);
	},
	buildActionButton:function(a, tf, def){

			var td = tf.child(".table-actions");
			if(!td){
				var tr = $.htmlToNode("<tr class='table-actions-row'><td class='table-footer-actions'></td></tr>");
				$.append(tf, tr);
				td = tr.child('.table-actions');
				td.attr("colspan", (def.columns.length + def.fixedColumnCount));
			}

			var bttn = $.htmlToNode("<div class='table-action-bttn table-action'></div>");
			$.append(td, bttn);

			var help = '';
			if(a.help) help = a.help;
			bttn.attr("title", help);
			bttn.attr('data-row-uid', "" );

			$.data(bttn, "table-action", a);

			if(a.name){
				bttn.attr("name", a.name);
			}
			this.fn.applyActionEvent(a,bttn);

			var s = a.caption;
			bttn.html(s);
			return bttn;
		},
	buildHeaders: function(t,th, def){

		var tr = th.child(".table-header-cells");
		def.columns.forEach(function(col, i){
			var defaults = {
				name:"",
				caption:"",
				formula:"",
				format:"",
				type:[],
				
				sortable: false,
				editable: false,
				hidden: false,
				width: "auto",
				hideonsize: [],

				tally: false,
				tallyValue: 0,

				lookup:{},
				lookupCSS:{},
			};
			
			col = core.extend(defaults, col);
			if(col.name == "") col.name=col.caption;
			if(col.caption == "") col.caption=col.name;
			def.columns[i] = col;
	
			var td = $.htmlToNode("<th class='table-header-cell' data-column='" + i + "' data-column-name='" + col.name + "'>" + col.caption + "</th>");
			$.append(tr, td);

			
			if(col.sortable){
				td.addClass("table-header-cell-sortable exc-table-header-sort-none");
				td.addEventListener("click", function(e){
					var th = $.closest(e.target, 'th');
					
					if( th.hasClass('exc-table-header-sort-none') ){
						th.removeClass('exc-table-header-sort-none').addClass('exc-table-header-sort-desc');
					}else if( th.hasClass('exc-table-header-sort-desc') ){
						th.removeClass('exc-table-header-sort-desc').addClass('exc-table-header-sort-asc');
					}else if( th.hasClass('exc-table-header-sort-asc') ){
						th.removeClass('exc-table-header-sort-asc').addClass('exc-table-header-sort-none');
					}

					$.closest(th, 'table').sortColumn(th);
				});
			}
		});

		if (def.rowActions.length > 0) {
			$.append(tr, "<td class='table-header-cell table-header-row-actions'></td>");
		}

		var td = th.child(".table-header-actions");
		td.attr("colspan", (def.columns.length + def.fixedColumnCount));
	},
	build: function(e){
		var o = $.htmlToNode("<div class='table-container'><table class='table' role='table' data-uiw='table'><thead class='table-header'><tr class='table-header-actions-row'><td class='table-header-actions'></td></tr><tr class='table-header-cells'><th class='table-header-idx'></th></tr></thead><tbody class='table-body'></tbody><tfoot class='table-footer'></tfoot></table></div>");

		var t = o.child(".table");
		t.attr("name", e.name );

			
		var th = t.child(".table-header");
		var tf = t.child(".table-footer");
		var tb = t.child(".table-body");
		var v = 0;
		
		
		var def_contents = {
			columns: [],
			data:{},
			
			actions:[],
			rowActions:[],
			widgets:{}
		};

		var def, contents;
			
		if(e.hasOwnProperty("contents")){
			if(typeof(e.contents) == "string"){
				contents = JSON.parse(e.contents.trim());
			}else if(e.contents && typeof(e.contents) == "object"){
				contents = e.contents;
			}
		}
		contents = core.extend(def_contents, contents);

		//normilize columns
		
		console.log("contents %o", contents);
		if( e.hasProperty("classes") ){
			for(var i in e.properties.classes) t.addClass(e.properties.classes[i]);
		}
		if( e.hasProperty("attributes") ){
			for(var ak in e.properties.attributes) t.setAttribute(ak, e.properties.attributes[ak]);
		}
		
		
		def = {
			name: e.name,
			count: 0,
			flgNoUpdate: false,
			flgHasDataSource: false,
			ds:null,
			enumerateRows: true,
			fixedColumnCount:1,
			keys:[],
		};

		if( e.hasProperty("enumerateRows") ){
			def.enumerateRows = e.properties.enumerateRows;
			def.fixedColumnCount = (def.enumerateRows ? 1 : 0);
		}
		
		core.extend(def, contents);
		
		if(def.rowActions.length > 0){
			def.fixedColumnCount += def.rowActions.length

		}
		console.log("table def %o", def);
		$.data(t, "tableDef", def);
		
		this.buildHeaders(t, th, def);
		
		if( e.hasProperty("issearchable") && e.properties.issearchable){
			this.buildSearchBox(o,th, def);
		}else{
			th.child(".table-header-actions-row").style.display = "none";
		}

		this.buildFooterTallies(o, t, tf, def);

		def.columns.forEach(function(col, i){
			def.keys.push(col.name);
		});

		if(def.actions && (def.actions.length > 0)){
			for(var i in def.actions){
				this.buildActionButton(def.actions[i], tf, def);
			}
		}
		return o;
	},
	renderCompleted: function(o){
		
	},

});
