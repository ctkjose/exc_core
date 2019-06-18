exc.helper.base64URL = {
	encode: function(s){
		return this.escape(btoa(s));
	},
	decode: function(s){
		return atob(this.unescape(s));
	},
	escape: function(str) {
		return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	},
	unescape: function(str) {
		return (str + '==='.slice((str.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/');
	},
};
exc.helper.keys = {
	keyArrowUp: 38,
	keyArrowDown: 40,
	keyArrowLeft: 37,
	keyArrowRight: 39,
	keyEnter: 13,
	keyEnd: 35,
	keyHome: 36,
	keyDelete: 46,
	keyBackspace: 8,
	keyInsert: 45,
	keyTabL: 9,
	keyBracketOpen: 219,
	keyBracketClose: 221,
	keySingleQuote: 22,
	keyShift: 16,
	keyCtrl: 17,
};
exc.helper.makeNumericField = function(o, options){

	var defaults = {
		allowDecimal: false,
		validate:null,
		min:0,
		max:99999999999
	};

	o.ops = core.extend(defaults, options);

	o._lv = "" + o.innerHTML;
	o._ks = false;
	o._kwerr = false;
	
	o.setAttribute("contenteditable", "true");
	o.addClass("is-editable");
	o.addClass("is-editable-numeric");

	
	var fieldReset = function(o){
		o.innerHTML = o._lv;
		o._kwerr = true;
		o.removeClass("with-error-pulsate").addClass("with-error-pulsate");
		var r = document.createRange();
		r.selectNodeContents(o);
		r.collapse(false);
		
		 var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(r);
	}
	var fieldValidate = function(o, e){
		var v = "" + o.innerHTML
		if(v.length > 0){
			var n = v * 1;

			if(!/^([0-9\.]+)$/.test(v)){
				fieldReset(o);
				return false;
			}
			if(v < o.ops.min){
				o._lv = "" + o.ops.min;
				fieldReset(o);
				return false;
			}
			if(v > o.ops.max){
				o._lv = "" + o.ops.max;
				fieldReset(o);
				return false;
			}

			if(o.ops.validate){
				if(o.ops.validate instanceof RegExp){
					if(!o.ops.validate.test(v)){
						fieldReset(o);
						return false;
					}
				}else if(typeof(o.ops.validate) == "function"){
					if(!o.ops.validate(v,o)){
						fieldReset(o);
						return false;
					}
				}
			}
		}
		o._lv = v;
		if(o._kwerr){
			o.removeClass("with-error-pulsate");
			o._kwerr = false;
		}
		return true;

	}
	o.addEventListener("keydown", function(e){
		if(e.keyCode == 9){
			return true;
		}
		if((e.ctrlKey || e.metaKey) && (e.keyCode == 86 )){ //paste
			e.preventDefault();
			e.target._ks = false;
			return false;
		}
		if(e.keyCode == 13){
			e.preventDefault();
			e.target._ks = false;
			return false;
		}
		
		if(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey ) return true; //control keys
		if( /^(16|17|18|91|92)$/.test("" +e.keyCode) ) return true; //control keys

		e.target._ks = false;
		if( /^(8|46|35|36|37|39)$/.test("" +e.keyCode) ){
			e.target._ks = true;   
		}else if(/^(48|49|50|51|52|53|54|55|56|57)$/.test(""+e.keyCode)){
			e.target._ks = true;
		}else if(e.keyCode == 190 && e.target.ops.allowDecimal){
			if(e.target._lv.indexOf(".") < 0) e.target._ks = true;
		}
		
		if(!e.target._ks) e.preventDefault();
		return e.target._ks;
		
	});
	o.addEventListener("paste", function(e){
		//console.log("on paste");
		e.preventDefault();
		e.cancelBubble = true;	
	});
	o.addEventListener("focus", function(e){
		e.target.removeClass("with-error-pulsate");
		range = document.createRange();
        range.selectNodeContents(e.target);
		sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	});
	o.addEventListener("keyup", function(e){
		
		if(e.keyCode == 9){
			return true;
		}
		if(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey ) return true;
		if( /^(16|17|18|91|92)$/.test("" +e.keyCode) ) return true; //control keys

		if( /^(8|46|35|36|37|39)$/.test("" +e.keyCode) ){
			return true;
		}
		if(!e.target._ks) {
			fieldReset(e.target);
			return false;
		}
		
		return fieldValidate(e.target, e);
	});

};
exc.helper.makeEditableField = function(any){
	var o = $.get(any);
	if(!o) return null;
	if(o._edit) return o;

	if(o.nodeType != 1) return o;
	o.addClass('is-editable');

	o.setAttribute("contenteditable", "true");
	o.setAttribute("role", "textbox");
	o._keyMap = {};
	o.addEventListener("keydown", function(e){
		if(e.keyCode == 13){
			e.preventDefault();
			return false;
		}
	});
}
exc.helper.makeEditable = function(any){

	var o = $.get(any);
	if(!o) return null;
	if(o._edit) return o;

	if(o.nodeType != 1) return o;
	o.addClass('is-editable');
	o._edit = {
		selection: null,
		saved_selection: null,
	};
	o.setAttribute("contenteditable", "true");
	o.setAttribute("role", "textbox");
	o.addEventListener("mouseup", function(e){
		var o = $.fromEvent(e, ".is-editable");
		o.saveSelection();
	});
	o.addEventListener("focus", function(e){
		var o = $.fromEvent(e, ".is-editable");
		o.restoreSelection();
	});

	o.getSelection = function(){
		var selection = window.getSelection();
		var node = selection.anchorNode;
		
		//(node.nodeName == "#text")
		while(node && ((node.nodeType !=1) || !node.hasClass('is-editable')) ){
			node = node.parentNode;
		}
		
		this._edit.selection = null;
			
		if(this != node){
			return;
		}
		
		this._edit.selection = selection;
	};
	o.getSelectionRange = function() {
		this.getSelection();
		if(!this._edit.selection) return null;
		var rng	= null;        
		if (this._edit.selection.rangeCount > 0){
			rng = this._edit.selection.getRangeAt(0);
		}
		
		return rng;
	};
	o.saveSelection = function() {
		this._edit.saved_selection = this.getSelectionRange();
		
		var sel = window.getSelection(), ranges = [];
		if (sel.rangeCount) {
			for (var i = 0, len = sel.rangeCount; i < len; ++i) {
				ranges.push(sel.getRangeAt(i));
			}
		}
	};
	o.restoreSelection = function() {
		if(this._edit.saved_selection == null) return;
		
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(this._edit.saved_selection);
	};
	o.clearSelection = function(){
		this.getSelection();
		if(!this._edit.selection) return;
		this._edit.selection.removeAllRanges();
	};
	o.selectionHTML = function(html){
		if(typeof(html) == "string"){
			this.setFocus();
			this.execCommand('insertHTML', html);
			return o;
		}
		return o.selectionGetAsHTML();
	};
	o.selectionText = function(s){
		if(typeof(s) == "string"){
			this.setFocus();
			this.execCommand('insertHTML', s);
			return o;
		}
		return o.selectionGetAsText();
	};
	o.selectionSetAtEnd = function(){
		var r = document.createRange();
		r.selectNodeContents(this);
		r.collapse(false);
		
		this.getSelection();
		this._edit.selection.removeAllRanges();
		this._edit.selection.addRange(r);
		
		this.focus();
		this.saveSelection();
	};
	o.selectionSet = function(start, len){
		this.getSelection();
		if(!this._edit.selection) return "";
		
		var r = document.createRange();
		
		var n = (this.o.get(0).firstChild) ? this.o.get(0).firstChild : this.o.get(0);
		r.setStart(n, start);
		r.setEnd(n, start+len);
		this._edit.selection.removeAllRanges();
		this._edit.selection.addRange(r);
	};
	o.selectionGetAsHTML = function(){
		var html = null;
		var rng	= this.getSelectionRange();
	
		if(rng) {
			var e = document.createElement('div');
			e.appendChild(rng.cloneContents());
			html = e.innerHTML;
		}
	
		return html;
	};
	o.selectionGetAsText = function(){
		this.getSelection();
		if(!this._edit.selection) return "";
	
		var s = window.getSelection();
		if (s.rangeCount > 0){
			return s.toString();
		}
		return "";
	};
	o.execCommand = function(command, option){
		this.setFocus();
	
		//this.getSelection();
		//if(!this.selection) return;
		
		try{
			document.execCommand(command, false, option);
		}catch(e){
			//console.log(e)
		}
		this.setFocus();
	};
	o.setFocus = function(){
		this.focus();
		this.restoreSelection();
	};

	o.getSource = function(){
		return this.innerHTML;
	};

	return o;
};

exc.helper.simpleParser = {
	create: function(statement){

		var parser = {p:0,l:0};
		parser.source = statement;

		var i, p, l;
		var savedToken = null;

		parser.l = statement.length;
		parser.p = 0;
		var kToken_Operators = "=:!><().,+-/\^*&%{}[];";
		parser.isW = function(c){
			if((c == "\n") || (c == "\r") || (c == "\t") || (c == ' ')) return true;
			return false;
		};
		parser.getCH = function(){
			if( (this.p) >= l ) return '';
			return statement.charAt(this.p);
		};
		parser.setPosition = function(i){
			this.p = i;
		}
		parser.getPosition = function(i){
			return this.p;
		}
		parser.skipW = function(){
			var ch = this.getCH(this.p);
			
			while([" ","\t","\n","\r"].indexOf(ch) >= 0){
				ch = this.getCH(++this.p);
			}
		}
		
		parser.saveToken = function(tk){
			savedToken = tk;
		};
		parser.nextToken = function(){
			if(savedToken!== null) return savedToken;

			this.skipW();
			var b="", c="";
			var tk = {type:0, value:""};
			c = this.getCH();
			if(c == ''){
				return null;
			}
			if( (c == "\"") || (c == "'") ){
				var sd = (c == "\"") ? "\"" : "'";
				tk.type = 1;
				do{
					this.p++;
					c = this.getCH(this.p);
					if( (c == sd) || (c == '') ) break;
					b += c;
				}while((c != sd)  && (this.p < l));
				
				tk.value = b;
			}else if( "-0123456789".indexOf(c) > -1  ) {
				if ( (c == '-') && ( "0123456789.".indexOf(statement.substring(this.p+1,this.p+2)) == -1  ) ){
					tk.value = c;
					tk.type = 3; //operator
				}else{
					b = '';
					while( "-0123456789.".indexOf(c) > -1 ){
						b += c;
						this.p++;
						if(this.p >= l) break;
						c = this.getCH(this.p);
					}
		
					tk.type = 2;
					tk.value = b * 1;
				}

			}else if( kToken_Operators.indexOf(c) > -1 ){
				tk.type = 3;
				
				var cn = statement.substring(this.p+1,this.p+2);
				this.p++;
				if(c == '<'){
					if(cn == '>'){
						c = '!=';
						this.p++;
					}else if(cn == '='){
						c = '<=';
						this.p++;
					}
				}else if( c == '>'){
					if(cn == '='){
						c = '>=';
						this.p++;
					}
				}else if(c == '!'){
					if(cn == '='){
						c = '!=';
						this.p++;
					}
				}else if(c == '='){
					if(cn == '='){
						c = '==';
						this.p++;
					}
				}else if(c == '&'){
					if(cn == '&'){
						c = '&&';
						this.p++;
					}
				}else if(c == '|'){
					if(cn == '|'){
						c = '||';
						this.p++;
					}			
				}
				
				tk.value = c;

			}else{
				b = '';
				while(!this.isW(c) && !(kToken_Operators.indexOf(c) > -1) && !(c==' ')){
					b += c; this.p++;
					if(this.p >= l) break;
					c = this.getCH(this.p);
				}
				
				if(b.toLowerCase() == 'true'){
					tk.type = 2;
					tk.value = '1';
				}else if(b.toLowerCase() == 'false'){
					tk.type = 2;
					tk.value = '0';
				}else if(!isNaN(b)){
					tk.type = 2;
					tk.value = b * 1;
				}else{
					tk.type = 4;
					tk.value = b;
				}
			}
			//console.log("@nextToken TOKEN[%d]=[%s]", tk.type, tk.value);
			return tk;
		};
		return parser;
	}
};