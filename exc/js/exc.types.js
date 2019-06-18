exc.types = { date:{}, numbers:{}, strings:{} };

exc.types.numbers.fixed = function(n, prec){
	var k = Math.pow(10, prec);
    return '' + (Math.round(n * k) / k).toFixed(prec);
};
exc.types.numbers.format = function(number, decimals, decPoint, thousandsSep){
	number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
	var n = !isFinite(+number) ? 0 : +number;
	var prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
	var sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep;
	var dec = (typeof decPoint === 'undefined') ? '.' : decPoint;
	var s = '';

	// @todo: for IE parseFloat(0.55).toFixed(0) = 0;
	s = (prec ? exc.types.numbers.fixed(n, prec) : '' + Math.round(n)).split('.');
	if (s[0].length > 3) {
		s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
	}
	if ((s[1] || '').length < prec) {
		s[1] = s[1] || '';
		s[1] += new Array(prec - s[1].length + 1).join('0');
	}
	return s.join(dec);
};

exc.types.date = {};

exc.types.date.create = function(any){

	var o = {};
	if (typeof any == 'string') {
		o = exc.types.date.dateFromString(any);
	}else if(any){
		o = exc.types.date.dateFromTarget(any);
	}else{
		o  = exc.types.date.dateFromInstance(new Date());
	}

	o.today = new Date();

	o.toString = function(){
		return exc.types.date.dateToString(this);
	};
	o.toHumanString = function(){
		return exc.types.date.dateToHumanString(this);
	};
	o.toMYSQLDate = function(){
		return exc.types.date.dateToMYSQLDate(this);
	};
	o.toMYSQLDateTime = function(){
		return exc.types.date.dateToMYSQLDateTime(this);
	};
	o.epoch = function(){
		return Math.round(this.getTime()/1000.0);
	};

	return o;

};
exc.types.date.stringIsISO8601 = function(value){
	var r = /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}\:[0-9]{2}/;
	return (r.test(value));
};
exc.types.date.stringIsMysqlDateTime = function(value){
	var r = /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}\:[0-9]{2}\:[0-9]{2}/;
	return (r.test(value));
};

exc.types.date.dateToMYSQLDate = function(d){
	return d.getFullYear() + '-' +
    (d.getMonth() < 9 ? '0' : '') + (d.getMonth()+1) + '-' +
    (d.getDate() < 10 ? '0' : '') + d.getDate();
};
exc.types.date.dateToMYSQLDateTime = function(d){
	return exc.types.date.dateToMYSQLDate(d) + ' ' + (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ':' +  (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();
};
exc.types.date.dateToString = function(d){
	return d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate();
};
exc.types.date.dateToHumanString = function(d){
	return (d.getMonth()+1) + '/' + d.getDate() + "/" + d.getFullYear();
};
exc.types.date.dateFromTarget = function(t){
	if(t instanceof Date ){
		return exc.types.date.dateFromInstance(t);
	}else if ((typeof(t.data('date')) !== 'undefined') ) {
		return exc.types.date.dateFromString( t.data('date') );
	}else if( t.elmType() == "text" ){
		return exc.types.date.dateFromString( "" + t.val() );
	}else{
		return exc.types.date.dateFromString( 'M/D/YYYY' );
	}
};
exc.types.date.dateFromString = function(s){
	var v = ("" + s).toUpperCase();
	var d = new Date();

	var m = null;
	if( exc.types.date.stringIsISO8601(v) ){
		d = new Date(value);

	}else if( exc.types.date.stringIsMysqlDateTime(v) ){
		var ps = v.split(' ');
		var dp = ps[0].split('-');
		var tp = ps[1].split(':');
		d = new Date( dp[0], dp[1]-1, dp[2], tp[0], tp[1], tp[2]);

	}else if( (m = /^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/.exec(v)) ){
		d = new Date(m[3], m[1]-1, m[2]);

	}

	return exc.types.date.dateFromInstance(d);
};
exc.types.date.dateFromInstance = function(d){

	d.as_string = (d.getMonth()+1) + '/' + d.getDate() + "/" + d.getFullYear();
	d.m = d.getMonth();
	d.month = d.getMonth() + 1;
	d.year = d.getFullYear();
	d.day = d.getDate();
	d.dow = d.getDay();

	d.meridiem = (d.getHours() > 11) ? 'PM' : 'AM';
	d.asMYSQLDate = exc.types.date.dateToMYSQLDate(d);
	d.asMYSQLDateTime = exc.types.date.dateToMYSQLDateTime(d);

	var cm = new Date(d.year, d.m, 1);
	d.fow = cm.getDay();

	d.next_month = (d.m == 11) ? new Date(d.year+1, 0, 1) : new Date(d.year, d.month, 1);
	d.prev_month = (d.m == 0) ? new Date(d.year-1, 11, 1) : new Date(d.year, d.m-1, 1);

	var daysinmonth= new Array(0,31,28,31,30,31,30,31,31,30,31,30,31);
	if( ((d.year%4 == 0)&&(d.year%100 != 0) ) ||(d.year%400 == 0) ){
		daysinmonth[2] = 29;
	}
	d.last_day = daysinmonth[d.month];

	return d;
};



exc.types.strings = {};
exc.types.strings.replaceAll = function(src, target, replacement) {
  return src.split(target).join(replacement);
};
exc.types.strings.lpad = function(sin, p, sz){
	var l = ((sz-sin.length)/p.length) + 1;
	if(l<=0) return sin;
	return Array(l).join(p) + sin;
};
exc.types.strings.rpad = function(sin, p, sz){
	var l = ((sz-sin.length)/p.length) + 1;
	if(l<=0) return sin;
	return sin + Array(l).join(p);
};
exc.types.strings.getSafeHTML = function(sin){
	var s = sin;
	s = s.replace(/>/g, "&gt;");
	s = s.replace(/</g, "&lt;");

	s = s.replace(/\r\n/g, '&lt;br&gt;');
	s = s.replace(/\r/g, '&lt;br&gt;');
	s = s.replace(/\n/g, '&lt;br&gt;');
	s = s.replace(/\ /g, "&nbsp;");
	s = s.replace(/\t/g, "&nbsp; &nbsp; ");

	//console.log("hmtl=" + s);
	return s;
};
exc.types.strings.querystringencode = function(obj){
	var sep = '&';
	var eq = '=';

	if (typeof obj !== 'object')  return '';

	var s = Object.keys(obj).map(function(k){
		var ks = encodeURIComponent(k);
		var kv = encodeURIComponent(obj[k]);
		return ks + eq + kv;
	}).join(sep);

	return s;
}
exc.types.strings.querystringdecode = function(qs, options){
	var sep = '&';
	var eq = '=';
	var obj = {};

	if (typeof qs !== 'string' || qs.length === 0) {
		return obj;
	}

	var regexp = /\+/g;
	qs = qs.split(sep);

	var maxKeys = 1000;
	if (options && typeof options.maxKeys === 'number') {
		maxKeys = options.maxKeys;
	}

	var len = qs.length;
	// maxKeys <= 0 means that we should not limit keys count
	if (maxKeys > 0 && len > maxKeys) {
		len = maxKeys;
	}

	for (var i = 0; i < len; ++i) {
		var x = qs[i].replace(regexp, '%20');
		var idx = x.indexOf(eq);
		var kstr, vstr, k, v;

		if (idx >= 0) {
			kstr = x.substr(0, idx);
			vstr = x.substr(idx + 1);
		} else {
			kstr = x;
			vstr = '';
		}

		k = decodeURIComponent(kstr);
		v = decodeURIComponent(vstr);

		if (!obj.hasOwnProperty(k)) {
			obj[k] = v;
		} else if (Array.isArray(obj[k])) {
			obj[k].push(v);
		} else {
			obj[k] = [obj[k], v];
		}
	}

  return obj;

};
exc.types.strings.urlencode = function(sin){
	var s = sin;
	s = s.replace(/ /g, "%20");
	s = s.replace(/\?/g, "%3F");

	return s;
};
exc.types.strings.getBasicHTML = function(sin){
	var s = sin;
	s = s.replace(/>/g, "&gt;");
	s = s.replace(/</g, "&lt;");

	s = s.replace(/\r\n/g, '<br>');
	s = s.replace(/\r/g, '<br>');
	s = s.replace(/\n/g, '<br>');
	s = s.replace(/\ /g, "&nbsp;");
	s = s.replace(/\t/g, "&nbsp; &nbsp; ");

	//console.log("hmtl=" + s);
	return s;
};
exc.types.strings.htmlentities = function(s){
	return s.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {return '&#' + i.charCodeAt(0) + ';';});
};

exc.types.strings.makeRegEx = function(v){
	var re = "";
	var escape = [".","*","-","[","]", "?", "^","$","\\","*","@",",","^","{","}", "\\"];

	var named_exp = [
		["spaces", "\\s+"],
		["space", "\\s"],
		["name", "[A-Za-z\\']+"],
		["var", "[A-Z|a-z|\\_|0-9|\$]+"],
		["formula","\%([A-Za-z\\_0-9\\.\\-]+)(\\[[A-Z|a-z|0-9\\_]+\\]){0,1}\%"],
		["attribute", "([a-zA-Z][a-zA-Z0-9\\-\\_]+)\\s?\\=\\s?[\\\"\\\']((\\\\\"|\\\\'|[^\\\"\\'])+)[\\\"\\']"],
		["money", "[0-9]{1,3}(?:,?[0-9]{3})*\\.[0-9]{2}"],
		["float", "[-+]?[0-9]*\\.?[0-9]+([eE][-+]?[0-9]+)?"],
		["domain", "[A-Za-z0-9]{1,}\\.[A-Za-z0-9]{1,63}\\.?[A-Za-z]{1,}\\.?[A-Za-z]{1,}"],
		["email","[A-Za-z0-9\\.\\_\\%\\+\\-]+\\@([A-Z0-9a-z\\-]{1,63}(\\.[A-Z0-9a-z\\-]{1,63})*(\\.[A-Za-z]{2,63}){1})"],
		["YYYY", "[1-9]{1}[0-9]{3}"],
		["MM", "(0[1-9]|1[0-2])|([1-9]|1[0-2])"],
		["DD", "(0[1-9]|1[0-9]|2[0-9]|3[0-1])|([1-9]|1[0-9]|2[0-9]|3[0-1])"],
		["HH", "(0[1-9]|1[0-9]|2[0-4])|([1-9]|1[0-9]|2[0-4])"],
		["MM", "([0-5][0-9])"],
		["SS", "([0-5][0-9])"],
		["hh", "((0[1-9]|1[0-2])|([1-9]|1[0-2]))"],
		["AM", "(([AapP][mM]){1})"],
	];

	var expanded_formats = [
		["d","(0[1-9]|1[0-9]|2[0-9]|3[0-1])"], //day of monthh with leading zero
		["j","([1-9]|1[0-9]|2[0-9]|3[0-1])"], //day of monthh without leading zero
		["m", "(0[1-9]|1[0-2])"], //month leading zero
		["n", "([1-9]|1[0-2])"], //month leading zero
		["M", "(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|ENE|ABR|AGO|DIC)"],
		["g", "([1-9]|1[0-2])"], //12-hour format of an hour without leading zeros
		["G", "([1-9]|1[0-9]|2[0-4])"], //24-hour format of an hour without leading zeros
		["h", "(0[1-9]|1[0-2])"], //12-hour format of an hour with leading zeros
		["H", "(0[1-9]|1[0-9]|2[0-4])"], //24-hour format of an hour with leading zeros
		["i", "([0-5][0-9])"], //minutes
		["s", "([0-5][0-9])"], //Seconds, with leading zeros
		["Y", "[123456789][0-9]{3}"], //year
		["/", "\\/"],
		[":", "\\:"],
		["-", "\\-"],
		[" ", "\\s+"],
		["0", "[0-9]"],
		[".", "\\."],
		["#", "[0-9]+"],
	];

	var i =0;
	var j =0;
	var sch = "";
	var sk = "";
	var rphp = [];
	var ch ="";

	s = v;
	for(j=0;j<named_exp.length;j++){
		sk = "[" + named_exp[j][0] + "]";

		if(s.indexOf(sk) >=0 ){
			eval("sch='\\u" + (1000 + j) + "';");
			s = this.replaceAll(s,sk, sch);
			//console.log("s=" + s);
		}
	}

	var rh = /\[([djmnMgGhHisY\:\/\-\s]+)\]/i;
	var m;
	var rhm = "";
	var rhv = "";
	m = rh.exec(s);
	while(m){
		//console.log("matched %o", m);
		rhm = m[1];
		for(i=0;i<rhm.length;i++){
			var ch = rhm.substr(i,1);
			for(j=0;j<expanded_formats.length;j++){
				if(ch == expanded_formats[j][0]){
					rhv += expanded_formats[j][1];
				}
			}
		}

		rphp.push(rhv);
		j = rphp.length-1;

		eval("sch='\\u" + (2000 + j) + "';");
		s = this.replaceAll(s, '[' + rhm  + ']', sch);
		m = rh.exec(s);
	}

	for(i=0;i<s.length;i++){
		ch = s.substr(i,1);
		//console.log("[" + i + "]=" + ch);


		for(j=0;j<named_exp.length;j++){
			eval("sch='\\u" + (1000 + j) + "';");
			if(ch == sch){
				ch = "("  + named_exp[j][1] + ")";
				break;
			}
		}
		for(j=0;j<rphp.length;j++){
			eval("sch='\\u" + (2000 + j) + "';");
			if(ch == sch){
				ch = "("  + rphp[j] + ")";
				break;
			}
		}

		if(escape.indexOf(ch) >=0 ){
			ch = "\\" + ch;
		}

		re += ch;
	}
	//console.log(re);
	return re;
};
exc.types.strings.matchFormat = function(sin, format){

	this.format_map = {
		"*": {'n': 1, 'l': 9000, 'm': ["[A-Za-z0-9_\\.\\ \\-\\']+"] },
		"0": {'n': 1, 'l': 1, 'm': ["[0-9]"] },
		"#": {'n': 1, 'l': 9000, 'm': ["[0-9]+"] },
		"a": {'n': 1, 'l': 1, 'm': ["[A-Za-z0-9_\\.\\'\\ ]"]},
		".": {'n': 1, 'l': 1, 'm': ["\\."] },
		"+": {'n': 1, 'l': 1, 'm': ["\\-\\+"] },
		"@": {'n': 1, 'l': 1, 'm': ["\\@"] },
		" ": {'n': 1, 'l': 1, 'm': ["\\ "] },
		":": {'n': 1, 'l': 1, 'm': ["\\:"] },
		"/": {'n': 1, 'l': 1, 'm': ["\\/"] },
		"-": {'n': 1, 'l': 1, 'm': ["\\-"] },
		"_": {'n': 1, 'l': 1, 'm': ["\\_"] },
		"d": {'n': 1, 'l': 2, 'm': ["0[1-9]","1[0-9]", "2[0-9]", "3[0-1]"] },
		"j": {'n': 1, 'l': 2, 'm': ["[1-9]","1[0-9]", "2[0-9]", "3[0-1]"] },
		"m": {'n': 1, 'l': 2, 'm': ["0[1-9]","1[0-2]"] },
		"n": {'n': 1, 'l': 2, 'm': ["[1-9]","1[0-2]"] },
		"M": {'n': 1, 'l': 3, 'm': ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC","ENE","ABR","AGO","DIC"] },
		"g": {'n': 1, 'l': 2, 'm': ["[1-9]","1[0-2]"] },
		"G": {'n': 1, 'l': 2, 'm': ["[0-9]","1[0-9]","2[0-3]"] },
		"h": {'n': 1, 'l': 2, 'm': ["0[1-9]","1[0-2]"] },
		"H": {'n': 1, 'l': 2, 'm': ["0[0-9]","1[0-9]","2[0-3]"] },
		"i": {'n': 1, 'l': 2, 'm': ["[012345][0-9]"] },
		"s": {'n': 1, 'l': 2, 'm': ["[012345][0-9]"] },
		"Y": {'n': 1, 'l': 4, 'm': ["[123456789][0-9]{3}"] },
		"y": {'n': 1, 'l': 2, 'm': ["[0-9]{2}"] },
	};

	if(format.indexOf("[") !== 0) return {"match": 0, "string":""};
	var n = /\[[\<\>]*([A-Za-z0-9_\.\/\$\:\,\-\@\*\ \#\+]*)\]/.exec(format);
	if(!n) return {"match": 0, "string":""};

	var s = sin.replace("&nbsp;", " ");

	var matched = "";
	var mf = n[1];
	var l = s.length;
	var mc = 0;
	var sdir = 1;
	var p = 0;

	if(n[0].substr(1,1) == "<"){
		sdir=-1;
		p = l-1;
	}

	for(var i=(sdir>0)?0:l-1; (sdir>0) ? i<=mf.length-1:i>=0; i+=sdir){
		var ch = mf.substr(i,1);

		//console.log("i=" + i + "::ch=" + ch);
		if(!this.format_map.hasOwnProperty(ch)) return {"match": 0, "string":""};
		var er = this.format_map[ch];
		var ok = false;
		for(var x=0; x<er.m.length; x++){
			//alert("eval[" + x + "]=" + er.m[x]);
			if((sdir>0) && (p > l)) break;
			if((sdir<0) && (p < 0)) break;

			n = new RegExp(er.m[x]);
			var pi = (sdir>0) ? p: Math.max(p-er.l+1,0);
			var ml = Math.min(er.l, l-matched.length);
			var ns = s.substr(pi,ml);
			var nm = n.exec(ns);
			if(nm){
				ok = true;
				p += (sdir * nm[0].length);
				matched= (sdir>0) ?  matched + nm[0] : nm[0] + matched;
				break;
			}
		}

		//console.log("s=" + s + "::s[" + p + "-" + pi + "]=[" + ns + "]::mc=[" + mc + "]::er=[ch:" + ch + ",l:" + ml + "]::matched=[" + matched + "]");

		if(!ok) break;
		mc++;
	}
	//console.log("s=" + s + "::matched=" + matched + "::er=[ch:" + ch + ",l:" + ml + "]");

	var status = 0;
	if((matched == s) && (mc==mf.length) ){
		status = 2;
	}else if(mc>0){
		status = 1;
	}

	return {"match": status, "string":matched };
};