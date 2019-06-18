!function(d, arr){
	
	self.core = self.core || {};
	self.core.$ = {fn:{}};
	self.$ = self.core.$;
	var dom = self.core.$;
	
	dom.isString = function(obj){ return typeof obj == 'string';};
	dom.isCoercible = function(any){
		var t = typeof(any);
		if( (t == "string") || (t == "number") || (t == "boolean") ) return true;
		if(t == "object"){
			if( any instanceof Date) return true;
		}
		return false;
	};
	dom.toString = function(any){
		var t = typeof(any);
		if(t == "string") return any;
		if( (t == "number") || (t == "boolean") ){
			return "" + any;
		}
		if(t == "object"){
			if( any instanceof Date){
				return "" + d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate();
			}
		}
		return "";
	};
	dom.toNode = function(any){
		return dom.htmlToNode( dom.toString(any) );
	};
	dom.camelCase = function(s){
		var v = s.replace(/-([a-z])/g, function( m, p ) { return p.toUpperCase(); } );
		v = v.replace(/(\s)/g, function(m, p){ return "-"; });
		return v;
	};
	dom.parseHTML = function(a) {
		var tmp = document.implementation.createHTMLDocument();
		tmp.body.innerHTML = a;
		return tmp.body.children;
	};
		
	dom.htmlToNode = function(s){
		var rn = /<|&#?\w+;/;
		var rt = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i;
		var ln = [];
		var f = document.createDocumentFragment();
	
		var containers = {
			option: [ 1, "<select multiple='multiple'>", "</select>" ],
			thead: [ 1, "<table>", "</table>" ],
			tfoot: [ 1, "<table>", "</table>" ],
			tr: [ 2, "<table><tbody>", "</tbody></table>" ],
			td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
			th: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
			any: [ 0, "", "" ]
		};
	
		var t, tag, container,n, i;
		if( (typeof(s) == "object") && s && s.nodeType){
			return s;
		}
	
		if(!rn.test(s)){
			ln.push( document.createTextNode(s) );
		}else{
			tag = (rt.exec(s) || ["","any"])[1].toLowerCase();
			container = containers.hasOwnProperty(tag) ? containers[tag] :  containers.any;
			
			t = document.createElement('div');
			t.innerHTML = container[1] + s + container[2];
			i = container[0];
	
			while(i--){
				t = t.lastChild;
			}
			for (i = 0; i < t.childNodes.length; i++) {
				ln.push(t.childNodes[i]);
			}
			t.textContent = "";
		}
	
		
		if(ln.length == 1) return ln[0];
	
		for (i = 0; i < ln.length; i++) {
			f.appendChild(ln[i]);
		}
		return f;
	};
	dom.nodeToHTML = function(a){
		if (!a) return "";
		var t = document.createElement('div');
		t.appendChild(a);
		return t.innerHTML;
	};
	dom.nodeToObject = function(a){
		if(!a) return {};
		var o = {
			type: "node",
			name: "",
			attr: dom.getAttr(a),
		};

		var e, i, l, n;
		l = a.attributes;
		
		for(i=0; i < l.length; i++){
			e = l[i];
			n = e.nodeName.toLowerCase();
			if(n == "name"){
				o.name = e.nodeValue;
				continue;
			}
			o.attr[e.nodeName] = e.nodeValue;
		}
		if(a.tagName) o.type = a.tagName.toLowerCase();
		return o;
	};

	dom.get = function(a,p){
		var o = p === []._ ? d : p;
		var e;
		
		if(dom.isString(a)){
			if(/([\.\#\[\:][a-z\d\-\_]+)|(\s?[\,\>\+\~]\s?)/i.test(a)){			
				return o.querySelector(a);
			}
			if((e = o.querySelector("[name=\"" + a + "\"]"))) return e;
			if((e = o.querySelector("[id=\"" + a + "\"]"))) return e;
			return o.querySelector(a);
		}else if(a && a.nodeType){
			return a;
		}else if( a && a.target && a.target.nodeType ){
			return a.target;
		}
		return null;
	};
	dom.getAll = function(a,p){
		var o = p === []._ ? d : p;
		var l = [];
		var m = o.querySelectorAll(a);
		
		if( Object.prototype.toString.call( m ) === '[object NodeList]' ) {
			Array.prototype.push.apply(l, m );
		}else{
			Array.prototype.push.apply(l, m && m.nodeType ? [m] : ('' + m === m ? d.querySelectorAll(m) : []) );
		}
		return l;
	};
	dom.fromEvent = function(e, s){
		var a = $.get(e);
		if(!a) return null;
		if(dom.isString(s)){
			return $.closest(a, s);
		}
		return a;
	};
	var node = function(a){
		if(!a) return null;
		if("string" === typeof(a)) return dom.get(a);
		if(1 === a.nodeType) return a;
		if(a && a.target && a.target.nodeType ) return a;
		if(!a || !a.nodeType) return null;
		
		if(1 == a.nodeType)  return a;
		
		
		if((11 == a.nodeType) || (9 == a.nodeType)) {
			return a.firstChild;
		}
		return null;
	};
	dom.node = node;

	dom.child = function(a, s){
		a = node(a);
		if(!a) return null;
		return dom.get(s, a);
	};
	dom.find = function(a, s){
		a = node(a);
		if(!a) return null;
		return dom.getAll(s, a);
	};
	dom.closest = function(a, s) {
		a = node(a);
		if(!a) return null;

		var str = 0;
		var test = function(a, b) {
			j = a && ( a.matches || a['webkitMatchesSelector'] || a['mozMatchesSelector'] || a['msMatchesSelector'] );
			if( (typeof(b)== 'string') ) return j.call(a, b);
			return (a==b);
		};
		
		if(a && (typeof(s)== 'string') && a.closest ) return a.closest(s);
		
		var el = a;
		var ok;
		do {
			if(test(el, s)) return el;
			el = (el.parentNode ? el.parentNode : (el.parentElement ? el.parentElement : null));
		} while (el !== null && el.nodeType === 1);
		return null;
	};
	dom.next = function(a, s){
		a = node(a);
		if(!a) return null;
		var o = a.nextSibling;
		while(o && 1 !== o.nodeType){
			o = o.nextSibling;
		}
		if(dom.isString(s) && !dom.is(o,s)) return null;
		return o;
	};
	dom.previous = function(a, s){
		a = node(a);
		if(!a) return null;
		var o = a.previousSibling;
		while(o && 1 !== o.nodeType){
			o = o.previousSibling;
		}
		if(dom.isString(s) && !dom.is(o,s)) return null;
		return o;
	};
	dom.parent = function(a, s) {
		a = node(a);
		if(!a) return null;
		var test = function(a, b) {
			j = a && ( a.matches || a['webkitMatchesSelector'] || a['mozMatchesSelector'] || a['msMatchesSelector'] );
			if( (typeof(b)== 'string') ) return j.call(a, b);
			return (a==b);
		};
		
		if(a && (typeof(s)== 'string') && a.closest ) return a.closest(s);
		
		var el = a.parentNode;
		var ok;
		do {
			if(test(el, s)) return el;
			el = el.parentElement || el.parentNode;
		} while (el !== null && el.nodeType === 1);
		return null;
	};

	//node attributes and contents
	dom.text = function(a,v) {
		a = node(a);
		if(!a) return "";
		if(v === []._) return a.textContent;
		a.textContent = v;
		return a;
	};
	dom.html = function(a,v) {
		a = node(a);
		if(!a) return "";
		if(v === []._) return a.innerHTML;
		
		if(dom.isCoercible(v)){
			a.innerHTML = dom.toString(v);
		}else if(v && v.nodeType){
			a.innerHTML = "";
			a.appendChild(v);
		}
		return a;
	};

	//attributes
	dom.attr = function(a, n, v) {
		a = node(a);
		if(!a) return null;
		if(v === []._) return a.getAttribute(n);
		a.setAttribute(n, v);
		return a;
	};
	dom.hasAttr = function(a, n) {
		a = node(a);
		if(!a) return false;
		return a.hasAttribute(n);
	};
	dom.removeAttr = function(a, n) {
		a = node(a);
		if(!a) return null;
		a.removeAttribute(n);
		return a;
	};
	dom.getAttr = function(a){
		a = node(a);
		if(!a) return {};
		var o = {};
		var e, i, l;
		l = a.attributes;
		
		for(i=0; i < l.length; i++){
			e = l[i];
			o[e.nodeName] = e.nodeValue;
		}
		return o;
	};
	dom.prop = function(a, p, v) {
		a = node(a);
		if(!a) return null;

		p = ({'tabindex': 'tabIndex','readonly': 'readOnly','for': 'htmlFor','class': 'className', 'maxlength': 'maxLength','cellspacing': 'cellSpacing','cellpadding': 'cellPadding','rowspan': 'rowSpan','colspan': 'colSpan','usemap': 'useMap','frameborder': 'frameBorder','contenteditable': 'contentEditable'}[p] || p);
		var b = (['checked'].indexOf(p) >= 0) ? true : false;
		if(v === []._){
			v = a[p];
			v = ((v === []._) || (v == null)) ? 'undefined' : v;
			return v;
		}else{
			a[p] = v;
		}
		return a;
	};
	
	dom.val = function(a,v){
		a = node(a);
		if(!a) return undefined;
		var t =  dom.type(a,"type");
		
		if(v !== []._){
			if(t && ((t == 'checkbox') || (t == 'radio'))){
				if(typeof(v) == "boolean"){
					a.checked = v;
				}else{
					a.checked = (dom.attr(a, "value") == v);
				}
			}else{
				a.value = v;
			}
		}
		if(t && ((t == 'checkbox') || (t == 'radio'))){
			if(a.checked) return dom.attr(a, "value");
		}else{
			return a.value;
		}
	};
	dom.type = function(a){
		a = node(a);
		if(!a) return "";
		var t = "";
		var tag = a.nodeName.toLowerCase();
		if(tag == "input"){
			t = a.getAttribute("type");
			t = (!t) ? "text" : t.toLowerCase();
		}else if(tag == "div"){
			t = a.getAttribute("type");
			t = (!t) ? "text" : t.toLowerCase();
		}else{
			t = tag;
		}

		return t;
	};
	dom.tag = function(a){
		a = node(a);
		if(!a) return "";
		if(a.tagName) return a.tagName.toLowerCase();
		return "";
	};
	dom.name = function(a){
		a = node(a);
		if(!a) return "";

		if(a.hasAttribute("name")) return a.getAttribute("name");
		if(a.tagName) return a.tagName.toLowerCase();
		return "";
	};



	dom.hasKey = function(a, n, v) {
		a = node(a);
		if(!a) return false;
		return a.hasAttribute("data-" + n);
	};
	dom.key = function(a, n, v) {
		a = node(a);
		if(!a) return null;
		var k = "data-" + n;
		return v === []._ ? a.getAttribute(k) : a.setAttribute(k, v);
	};
	dom.removeKey = function(a, n) {
		a = node(a);
		if(!a) return null;
		a.removeAttribute("data-" + n);
		return a;
	};

	dom.is = function( a, s ) {
		a = node(a);
		if(!a) return false;
		j = a && ( a.matches || a['webkitMatchesSelector'] || a['mozMatchesSelector'] || a['msMatchesSelector'] );
		return !!j && j.call( a, s );
	};

	//styling
	dom.hasClass = function(a, n) {
		a = node(a);
		if(!a) return false;
		return a.classList.contains(n);
	};
	dom.addClass = function(a, n) {
		a = node(a);
		if(!a) return null;
		var cl = a.classList;
		cl.add.apply( cl, n.split( /\s/ ) );
		return a;
	};
	dom.removeClass = function(a, n) {
		a = node(a);
		if(!a) return null;
		var cl = a.classList;
		cl.remove.apply( cl, n.split( /\s/ ) );
		return a;
	};
	dom.toggleClass = function( a, n, b ) {
		a = node(a);
		if(!a) return null;
		var cl = a.classList;
		if( typeof b !== 'boolean' ) {
			b = !cl.contains( n );
		}
		cl[ b ? 'add' : 'remove' ].apply( cl, n.split( /\s/ ) );
		return a;
	};
	dom.css = function(a, s, b) {
		a = node(a);
		if(!a) return null;
		if (typeof(s) === 'object') {
			for(var p in s) {
				a.style[p] = s[p];
			}
			return a;
		}
		if(b === []._){
			var st = window.getComputedStyle(a);
			return st[s];
		}
		a.style[s] = b;
		return a;
	};

	//manipulating

	dom.remove = function(a) {
		a = node(a);
		if(!a) return null;
		return a.parentNode.removeChild(a);
	};
	dom.hide = function(a) {
		a = node(a);
		if(!a) return null;
		a.style.display = 'none';
		return a;
	};
	dom.show = function(a) {
		a = node(a);
		if(!a) return null;
		a.style.display = '';
		return a;
	};
	dom.append = function(a, h){
		a = node(a);
		if(!a) return null;
		if(!h) return a;		
		if( dom.isCoercible(h) ){
			a.appendChild( dom.toNode(h) );
		}else{
			a.appendChild(h);
		}
		return a;
	};
	
	/*Insert content, specified by the parameter, to the beginning of each element in the set of matched elements.*/
	dom.prepend = function(a, h) {
		a = node(a);
		if(!a) return null;
		if(!h) return a;
		var t = a.firstChild;
		
				
		if(Array.isArray(h)){
			var v = document.createDocumentFragment();
			h.forEach(function(e){ v.appendChild(e); });
			a.insertBefore(v, t);
		}else if( dom.isCoercible(h) ){
			a.insertBefore( dom.toNode(h), t );
		}else{
			a.insertBefore(h, t);
		}
		return a;
	};
	
	/*Insert content, specified by the parameter, before each element in the set of matched elements.*/
	dom.before = function(a, h) {
		a = node(a);
		if(!a) return null;
		if(!h) return a;
		if(Array.isArray(h)){
			var v = document.createDocumentFragment();
			h.forEach(function(e){ v.appendChild(e); });
			a.insertAdjacentHTML('beforebegin', v);
		}else if(dom.isCoercible(h)){
			a.insertAdjacentHTML('beforebegin',  dom.toNode(h)  );
		}else{
			a.insertAdjacentHTML('beforebegin', h);
		}
		return a;
	};
	
	/* Insert content, specified by the parameter, after each element in the set of matched elements. */
	dom.after = function(a, h) {
		a = node(a);
		if(!a) return null;
		if(!h) return a;

		var x = $.next(a);
		var fn = function(b){ ///NST:IGNORE
			if(!x){
				a.parentNode.appendChild(b);
			} else {
				a.parentNode.insertBefore(b,x);	
			}
		};

		if(Array.isArray(h)){
			var v = document.createDocumentFragment();
			h.forEach(function(e){ v.appendChild(e); });
			fn(v);
		}else if(dom.isCoercible(h)){
			fn(dom.toNode(h));
		}else{
			fn(h);
		}
		return a;
	};



	//private data
	var _createPrivateData = function(n){
		return {observers:{'addedNodes':[],'removedNodes':[],'attributeChanged':[]}, events:{}, data:{}};
	};
	var _getPrivateData = function(a){
		if(!a.hasOwnProperty("_exc")){
			a._exc = _createPrivateData(a);
		}

		return a._exc;
	};
	
	dom.data = function(a, n, v) {
		a = node(a);
		if(!a) return null;
		var p = _getPrivateData(a);

		if(v === []._){
			if(p.data.hasOwnProperty(n)) return p.data[n];
			return undefined;
		}

		p.data[n] = v;
		return a;
	};
	dom.hasData = function(a, n) {
		a = node(a);
		if(!a) return false;
		var p = _getPrivateData(a);
		return p.data.hasOwnProperty(n);
	};

	dom.onAction =function(o, evt, fn){
		o = node(o);
		if(!o) return null;
		if(typeof(fn) != "function") return o;
	
		var def = { event:evt,name:'',handler:'handler'}; ///NST:IGNORE
		var ex = [
			{r: /^([a-z]+)\.([A-Za-z0-9\-\_]+)\.([a-z]+)\(\)$/i, fn:function(m){ return { event:m[1],name:m[2],handler:m[3]};}},  ///NST:IGNORE
			{r: /^([a-z]+)\.([a-z]+)\(\)$/i, fn:function(m){ return { event:m[1],name:'',handler:m[2]};}},  ///NST:IGNORE
			{r: /^([a-z]+)\.([A-Za-z0-9\-\_]+)$/i, fn:function(m){ return { event:m[1],name:m[2],handler:'handler'};}},  ///NST:IGNORE
		];
		for(var i=0; i<ex.length;i++){
			var er = ex[i];
			var m = er.r.exec(evt);
			if(!m) continue;
			def = er.fn(m);
			break;
		}
	
		//console.log("ON event:" + def.event + ", handler:" + def.handler + ", namespace:" + def.name );
		
		var a = $.data(o, "exc_action_" + def.event);
		if(typeof(a) == "undefined"){
			a = $.actionCreate(o, def.event);
		}
	
		if(!a.hasOwnProperty(def.handler)) def.handler = 'handler';
	
		a[def.handler].push({'n':def.name,'fn':fn });
	
		return this;
	};
	dom.offAction =function(o, evt, fn){ 
		o = node(o);
		if(!o) return null;
	
		var def = { event:evt,name:'',handler:'handler'};
		var ex = [
			{r: /^([a-z]+)\.([A-Z|a-z|0-9|\-\_]+)\.([a-z]+)\(\)$/i, fn:function(m){ return { event:m[1],name:m[2],handler:m[3]};}},
			{r: /^([a-z]+)\.([a-z]+)\(\)$/i, fn:function(m){ return { event:m[1],name:'',handler:m[2]};}},
			{r: /^([a-z]+)\.([A-Z|a-z|0-9|\-\_]+)$/i, fn:function(m){ return { event:m[1],name:m[2],handler:'handler'};}},
		];
		for(var i=0; i<ex.length;i++){
			var er = ex[i];
			var m = er.r.exec(evt);
			if(!m) continue;
			def = er.fn(m);
			break;
		}
	
		//console.log("OFF event:" + def.event + ", handler:" + def.handler + ", namespace:" + def.name );
	
		var a = $.data(o, "exc_action_" + def.event);
		if(typeof(a) == "undefined") return this;
	
		if(!a.hasOwnProperty(def.handler)) return this;
	
		for(i=0; i<a[def.handler].length;i++){
			var fe = a[def.handler][i];
			if( (def.name.length > 0) && (def.name == fe.n) ){
				a[def.handler].splice(i,1);
				break;
			}
			if( (typeof(fn) != "undefined" ) && (fn === fe.fn) ){
				a[def.handler].splice(i,1);
				break;
			}
		}
	
		return this;
	
	};
	dom.hasAction =function(o, def, fn){
		o = node(o);
		if(!o) return false;
		///def = {event:"click", name:"namespace"|"", handler:"validation"|"handler"}
	
		var a = $.data(o, "exc_action_" + def.event);
		if(typeof(a) == "undefined") return false;
	
		if(!a.hasOwnProperty(def.handler)) return false;
	
		for(i=0; i<a[def.handler].length;i++){
			var fe = a[def.handler][i];
			if( (def.name.length > 0) && (def.name == fe.n) ){
				return true;
			}
			if( (typeof(fn) != "undefined" ) && (fn === fe.fn) ){
				return true;
			}
		}
	
		return false;
	
	};
	dom.actionCreate = function(o, evt){
		
		var action = { 
			'type': evt,
			'o': o,
			'validation':[],
			'message':[],
			'handler':[],
			'done':[],
			execute: function(event){
				var i=0;
				var a = [];
				var ok = true;
				for(i=0; i<this.validation.length;i++){
					a =[ this.validation[i].fn, event ];
					ok = this.callback.apply(this, a);
					if(!ok) break;
				}
				if(!ok){
					//console.log("[EXC][DOM.ACTION][" + this.type + "][Action terminated by validation. Handlers not executed.");
					return;
				}
	
				for(i=0; i<this.handler.length;i++){
					a =[ this.handler[i].fn, event ];
					this.callback.apply(this, a);
				}
				for(i=0; i<this.done.length;i++){
					a =[ this.done[i].fn, event ];
					this.callback.apply(this, a);
				}
			},
			callback: function(fn){
				var args = Array.prototype.slice.call(arguments, 1);
				if(fn && Array.isArray(fn)){
					var cfn = (typeof fn[1] === 'string') ? fn[0][fn[1]] : fn[1];
					return cfn.apply(fn[0], args);
				}else if(typeof fn == "function"){
					return fn.apply(fn, args);
				}
				return undefined;
			},
		};
	
		var fn = function(event){
			action.execute(event);
		};
	
		$.data(o, "exc_action_" + evt, action);
		$.on(o, evt, fn);
	
		return action;
	};
	dom.getAction = function(o, evt){
		a = node(a);
		if(!a) return false;
		var a = dom.data(o, "exc_action_" + evt);
		return a;
	};

	//events...
	var _eventIDS = 100;
	function _getNextEventID(){
		return ++_eventIDS;
	}
	dom.on = function (a, n, fn) {
		a = node(a);
		if(!a) return null;
		if(['addedNodes', 'removedNodes','attributeChanged'].indexOf(n) >= 0){
			return a;
		}
		if(a.nodeType != 1) return a;

		if(typeof(fn)!= "function"){
			fn = function(){ return false; };
		}
		var p = _getPrivateData(a);

		var rn = /([a-zA-Z]+)\.([A-Za-z0-9\-\_]+)|([a-zA-Z]+)/g;
		var m = rn.exec(n);
		var evt, ns, h;
		while(m){
			if(m[3]){
				evt = m[3];
				ns = null;
			}else{
				evt = m[1];
				ns = m[2];
			}

			a.addEventListener(evt, fn);

			if(!Array.isArray(p.events[evt])) p.events[evt] = [];
			h = {id: _getNextEventID(), e: evt, fn: fn, ns: ns};
			p.events[evt].push(h);
			m = rn.exec(n);
		}
		
		return a;
	};
	dom.off = function (a, n, fn) {
		a = node(a);
		if(!a) return null;

		var p = _getPrivateData(a);
		var rn = /([a-zA-Z]+|\*)\.([A-Za-z0-9\-\_]+)|([a-zA-Z]+|\*)/g;
		var m = rn.exec(n);
		var evt, ns;

		while(m){
			if(m[3]){
				evt = m[3];
				ns = null;
			}else{
				evt = m[1];
				ns = m[2];
			}
			if(evt == "*"){
				Object.keys(p.events).forEach(function(e){
					p.events[e].forEach(function(h){
						if(ns && (h.ns != ns)) return;	
						a.removeEventListener(h.e, h.fn);
					});
				});
			}else{
				if(!Array.isArray(p.events[evt])) continue;
				p.events[evt].forEach(function(h){
					if(h.ns != ns) return;
					if(fn && (h.fn != fn)) return;
						
					a.removeEventListener(evt, h.fn);
				});
			}
			m = rn.exec(n);
		}
		return a;
	};
	dom.onObserver = function(a, n, sel, fn){
		var _p = _getPrivateData(a);
		if(!_p.hasOwnProperty("domObserver")) dom.installObserver(a);
		///P:n: is "addedNodes"|"removedNodes"|"attributeChanged"
		
		var c = {sel:null, fn: fn};	
		if(dom.isString(sel)){
			c.sel = sel;
		}
		_p.observers[n].push(c);
	};
	dom.debug = function(a){
		console.log("private_data %o",_getPrivateData(a));	
	};
	dom.installObserver = function(a){
		var _owner = a;
		var _p = _getPrivateData(a);
		if(_p.hasOwnProperty("domObserver")) return;

		var config = { attributes: true, childList: true, subtree: true };
		
		
		// Callback function to execute when mutations are observed
		var __dispatchNodeAction = function(owner, t, cookie, n){

			
			var _p = _getPrivateData(owner);
			var l = _p.observers[n];
			
			for(var i in l){
				var e = l[i];
				if(e.sel){
					if(cookie.tagName){
						var k = dom.name(cookie);
						if(!dom.is(cookie, e.sel)) continue;
					}else if(e.sel !== cookie){
						continue;
					}
				}
				dom.callbackWithArguments(e.fn, [owner, t, cookie]);
			}
		};

		var callback = function(ml, ov) {
			
			for(var mutation of ml) {
				if((mutation.addedNodes.length >0)  && (_p.observers.addedNodes.length > 0)){
					//console.log("added nodes=%d", mutation.addedNodes.length);
					mutation.addedNodes.forEach(function(a){
						if(!a ||  (a.nodeType !== Node.ELEMENT_NODE))  return;
						__dispatchNodeAction(_owner, mutation.target, a, "addedNodes");
					});
				}else if((mutation.removedNodes.length >0)  && (_p.observers.removedNodes.length > 0)){
					//console.log("removed nodes=%d", mutation.removedNodes.length);
					mutation.removedNodes.forEach(function(a){
						if(!a ||  (a.nodeType !== Node.ELEMENT_NODE))  return;
						__dispatchNodeAction(_owner, mutation.target, a, "removedNodes");
					});
				}else if(mutation.type == 'attributes') {
					__dispatchNodeAction(_owner, mutation.target, mutation.attributeName, "attributeChanged");
				}
			}
		};

		_p.domObserver = new MutationObserver(callback);
		_p.domObserver.observe(_owner, config);

	};


	$._fn = {};
	dom.decorate = function(a){
		Object.keys($._fn).forEach(function(n){
			if(typeof($._fn[n])!== "function") return;
			Node.prototype[n] = function(){
				var args = [this]; arr.push.apply(args,arguments);
				return $._fn[n].apply(dom, args);
			};
		});
	};

	
	//Node Pullution
	var nodeCopyFn = ["hasClass", "addClass","removeClass","css", "attr", "hasAttr", "prop", "val", "find","child", "html", "append", "on"];
	nodeCopyFn.forEach(function(n){ ///NST:MARK:Node.Prototype
		var fn = dom[n];
		Node.prototype[n] = function(){
			var args = [this]; arr.push.apply(args,arguments);
			return fn.apply(dom, args);
		};
	});
	
	dom.on(d, 'DOMContentLoaded', function(){
		

	});

	
	
}(document, Array.prototype); 