exc.components.register({ ///NST:MARK:CLASS:date
	id: 'date',
	selectors: ["[data-uiw='date']"],
	vs: "value", //value source
	inherits: ['generic'],
	getter: function(a){
		var o = (a.hasAttr("data-uiw")) ? a: a.child("input");

		return o.value;
	},
	setter: function(a, value){
		var o = (a.hasAttr("data-uiw")) ? a: a.child("input");
		$.data(o,"uiw-value-last", o.value );
		o.value = value;
	},
	fn : { //additional functionality added to the element
		
	},
	build: function(e){

		var t = $.htmlToNode("<input type='text' class='textbox vs vs-v' data-uiw='date' value='' maxlength='10'>");
		var k = "";
		
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

		var suffix = "<i class='la la-calendar exc-la-bttn'></i>";		
		var container = exc.components.items.container.createContainerForElement(t, null, suffix);
		container.addClass("exc-rendered");
		container.addClass("exc-datepicker-container");

		if(e.hasProperty("width")){
			$.css(container,{"width": e.property("width"), "flex-grow":0});
		}
		
		return container;
	},
	renderCompleted: function(o){

		var fnDecorationClick = function(e){ //static callback
			var d = $.fromEvent(e, ".decoration");
			var o = $.previous(d, "[data-uiw=date]");
			if(!o) return;
			if(o.hasClass('is-disabled')) return;
			var msg = $.name(o) + "_change";
		
			var ops = {
				valueGet: function(){
					var p = ("" + o.value).split("/");
					if(p.length != 3) return new Date();
					var dt = new Date(p[2],(p[0]*1)-1,p[1]);
					return dt;
				},
				valueSet: function(dt){
					var v = dt.getMonth()+1 + "/" + dt.getDate() + "/" + dt.getFullYear();
					var cmp = exc.components.get(o, "date");
					cmp.setValue(v);
					exc.components.sendMessage(o, msg, {'cmd':msg, 'event': e, 'value': v, 'date': dt });
				}
			};
			exc.views.showDatePicker(ops);
			
		};
		var cn = o;
		o = cn.child("[data-uiw=date]");
		
		var d = cn.child(".decoration");
		if(d){
			$.onAction(d, "click.datePicker.handler()", fnDecorationClick);
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

exc.components.register({ ///NST:MARK:CLASS:time
	id: 'time',
	selectors: ["[data-uiw='time']"],
	vs: "attr", //value source
	inherits: ['generic'],

	getter: function(o){
		return o.getAttribute("data-uiw-value");
	},
	setter: function(o, value){
		var h = "00",m = "00",s = "00",pm = "AM";

		var rm = [
			/^(0?[1-9]{1}|1[012]{1})\:\s*?([0-5]{1}[0-9]{1})\:\s*?([0-5]{1}[0-9]{1})\s*?(AM|PM|am|pm)$/,
			/^(0?[1-9]{1}|1[012]{1})\:\s*?([0-5]{1}[0-9]{1})\s*?(AM|PM|am|pm)$/
		];
		
		var ms;
		for(var i=0; i< rm.length;i++){
			ms = value.match(rm[i]);
			if(ms){
				h = ms[1];
				m = ms[2];
				if(ms[4]){
					s = ms[3];
					pm = ms[4].toUpperCase();
				}else if(ms[3]){
					pm = ms[3].toUpperCase();
				}
				v = h + ":" + m + ":" + s + " " + pm;
				o.setAttribute("data-uiw-value", v);
				break;
			}
		}

		o.child(".exc-time-hour").html(h);
		o.child(".exc-time-minutes").html(m);
		o.child(".exc-time-seconds").html(s);
		o.child(".exc-time-pm").html(pm);

	},
	fn : { //additional functionality added to the element
	},

	buildTime: function(name, t){
		var dv1 = $.htmlToNode("<span class='exc-time-divider'>:</span>");
		
		

		var th  = $.htmlToNode("<span class='exc-time-hour' lv='' contenteditable='true'>12</span>");
		th.setAttribute("name", name + "_hour");

		var tm  = $.htmlToNode("<span class='exc-time-minutes' lv='' contenteditable='true'>00</span>");
		tm.setAttribute("name", name + "_minutes");

		var ts  = $.htmlToNode("<span class='exc-time-seconds' lv='' contenteditable='true'>00</span>");
		ts.setAttribute("name", name + "_seconds");

		var ta  = $.htmlToNode("<span class='exc-time-pm'>AM</span>");
		ta.setAttribute("name", name + "_am");

		$.append(t, th);
		$.append(t, dv1);
		$.append(t, tm);
		$.append(t, dv1.cloneNode(true));
		$.append(t, ts);
		$.append(t, ta);


		t.setAttribute("data-uiw-value", "12:00:00 AM");
		return t;
	},
	build: function(e){


		n = e.name;
		var o = $.htmlToNode("<div class='field-group exc-time-container exc-rendered' name='container_" + n + "' data-container-for='" + n + "'></div>");
		//o.css({"width":"12rem", "flex-grow":0});

		var t = $.htmlToNode("<div class='exc-time exc-rendered inside-container' data-uiw='time'></div>");
		t.setAttribute("name",  n);
		
		this.buildTime(n, t);
		$.append(o, t);

		if(e.hasProperty("width")){
			$.css(o, {"width": e.property("width"), "flex-grow":0});
		}

		if(e.hasProperty("help")) o.attr("title", e.property("help"));
		if(e.hasProperty("border") && !e.property("border")) o.addClass("no-border");

		if(e.hasProperty("disabled") ){
			if(e.property("disabled")){
				o.addClass("is-disabled").prop('disabled',true).prop('readonly',true);
			}else{
				o.removeClass("is-disabled").prop('disabled',false).prop('readonly',false);
			}
		}
		
		$.append(o, "<i class='decoration exc-la-bttn'><span class='la la-clock-o'></span></i>");

		exc.components.installValueInterface(t,"attr", this);
		return o; 
	},
	renderCompleted: function(o){

		var fn = function(o){
			var p = $.closest(o, ".exc-time");
			var v = p.child(".exc-time-hour").html() + ":" + p.child(".exc-time-minutes").html() + ":" + p.child(".exc-time-seconds").html() + " " + p.child(".exc-time-pm").html();

			if(p.attr("data-uiw-value") == v) return;
			p.attr("data-uiw-value", v);
			p.assignValue(v);
			var msg = $.name(p) + "_change";
			exc.components.sendMessage(o, msg, {'cmd':msg, 'value': v });
		};

		var th = o.child(".exc-time-hour");
		exc.helper.makeNumericField(th, {allowDecimal: false, min:1, max:12} );
		th.addEventListener("blur", function(e){
			var o = e.target;
			var v = "" + o.html();

			if(!v.match(/^(([1-9]{1})|(0[1-9]{1})|(00)|(1[012]{1}))$/)){
				v = "01";
				o.html(v);
			}
			fn(o);
		});

		var tm = o.child(".exc-time-minutes");
		exc.helper.makeNumericField(tm, {allowDecimal: false, min:0, max:59} );
		tm.addEventListener("blur", function(e){
			var o = e.target;
			var v = "" + o.html();

			if(!/^[0-5]?[0-9]{1}$/.test(v)){
				v = "00";
				o.html(v);
			}else if(v.length == 1){
				v = "0" + v;
				o.html(v);
			}

			o.attr("lv", v);
			fn(o);
		});

		var ts = o.child(".exc-time-seconds");
		exc.helper.makeNumericField(ts, {allowDecimal: false, min:0, max:59} );
		ts.addEventListener("blur", function(e){
			var o = e.target;
			var v = "" + o.html();

			if(!/^[0-5]?[0-9]{1}$/.test(v)){
				v = "00";
				o.html(v);
			}else if(v.length == 1){
				v = "0" + v;
				o.html(v);
			}
			fn(o);
		});

		

		var tpm = o.child(".exc-time-pm");
		tpm.on("click", function(e){
			var o = e.target;
			var v = "" + o.html();
			o.html(( (v =="AM") ? "PM" : "AM"));
			fn(o);
		});
	}
});

exc.components.register({ ///NST:MARK:CLASS:datetime
	id: 'datetime',
	selectors: ["[data-uiw='datetime']"],
	vs: "value", //value source
	inherits: ['generic'],

	getter: function(o){
		return o.getAttribute("data-uiw-value");
	},
	setter: function(o, value){
		var h = "00",m = "00",s = "00",pm = "AM";
		var d = "01", month="01", y="1900";
		//2019-01-26T05:00:00
		var vt,vd,v,dt;
		if( (typeof(value) == "object") && (value instanceof Date) ){
			dt = value;
		}else if((value.indexOf("T") > 0) && (value.length >= 19)){
			dt = new Date(value);
		}else{
			dt = new Date();
		}

		h = dt.getHours();
		if( h > 12){
			pm = "PM";
			h -= 12;
		}else if(h == 0){
				h = 12;
		}
		m = "" + dt.getMinutes();
		if(m.length == 1) m = "0" + m;

		s = "" + dt.getSeconds();
		if(s.length == 1) s = "0" + s;
		vt = h + ":" + m + ":" + s + " " + pm;
		o.setAttribute("data-uiw-value", v);

		month = dt.getMonth()+1;
		d = dt.getDate();
		y = dt.getFullYear();

		vd =  month + "/" + d + "/" + y;
		
		o.attr("data-uiw-value", dt.toISOString());
		o.attr("data-uiw-value-date", vd);
		o.attr("data-uiw-value-time", vt);
		
		o.child(".exc-date-year").html(y);
		o.child(".exc-date-month").html(month);
		o.child(".exc-date-day").html(d);

		o.child(".exc-time-hour").html(h);
		o.child(".exc-time-minutes").html(m);
		o.child(".exc-time-seconds").html(s);
		o.child(".exc-time-pm").html(pm);

	},
	fn : { //additional functionality added to the element
	},

	buildDate: function(name){
		var dv1 = $.htmlToNode("<span class='exc-date-divider'>/</span>");
		
		var dt = new Date();
		var d = $.htmlToNode("<div class='exc-datetime exc-rendered inside-container' data-uiw='datetime'></div>");
		d.setAttribute("name",  name);

		var dm  = $.htmlToNode("<span class='exc-date-month' lv='' contenteditable='true'>" + (dt.getMonth()+1) + "</span>");
		dm.setAttribute("name", name + "_month");

		var dy  = $.htmlToNode("<span class='exc-date-year' lv='' contenteditable='true'>" + dt.getFullYear() + "</span>");
		dy.setAttribute("name", name + "_year");

		var dd  = $.htmlToNode("<span class='exc-date-day' lv='' contenteditable='true'>" + dt.getDate() + "</span>");
		dd.setAttribute("name", name + "_day");

		var v = dt.getMonth()+1 + "/" + dt.getDate() + "/" + dt.getFullYear();
		d.setAttribute("data-uiw-value", dt.toISOString());
		d.setAttribute("data-uiw-value-date", v);

		$.append(d, dm);
		$.append(d, dv1);
		$.append(d, dd);
		$.append(d, dv1.cloneNode(true));
		$.append(d, dy);

		return d;
	},
	build: function(e){


		n = e.name;
		var o = $.htmlToNode("<div class='field-group exc-datetime-container exc-rendered' name='" + n + "_container' data-container-for='" + n + "'></div>");
		
		var d = this.buildDate(n);
		$.append(d,"&nbsp;");
		var t = exc.components.items.time.buildTime(n + "_time", d);
		d.setAttribute("data-uiw-value-time", "12:00:00 AM");
		$.append(o, d);


		if(e.hasProperty("width")){
			$.css(o, {"width": e.property("width"), "flex-grow":0});
		}

		if(e.hasProperty("help")) o.attr("title", e.property("help"));
		if(e.hasProperty("border") && !e.property("border")) o.addClass("no-border");

		if(e.hasProperty("disabled") ){
			if(e.property("disabled")){
				o.addClass("is-disabled").prop('disabled',true).prop('readonly',true);
			}else{
				o.removeClass("is-disabled").prop('disabled',false).prop('readonly',false);
			}
		}
		
		exc.components.installValueInterface(d,"attr", this);
		return o; 
	},
	renderCompleted: function(o){
			
		var fn = function(o){
			var d = $.closest(o, ".exc-datetime");
			var vt = d.child(".exc-time-hour").html() + ":" + d.child(".exc-time-minutes").html() + ":" + d.child(".exc-time-seconds").html() + " " + d.child(".exc-time-pm").html();
			var vd = d.child(".exc-date-month").html() + "/" + d.child(".exc-date-day").html() + "/" + d.child(".exc-date-year").html();

			var pd = vd.split("/");
			var p = vt.split(" ");
			var pt = p[0].split(":").map(function(n){ return n*1; });
			if(p[1] == "PM"){
				if(pt[0] < 12){
					pt[0]+= 12;
				}
			}else if(pt[0] == 12){
					pt[0] = 0;
			}
			
			var dt = new Date(pd[2],(pd[0]*1)-1,pd[1], pt[0],pt[1], pt[2]);
			var v = dt.toISOString(); // ISO 8601

			if(d.attr("data-uiw-value") == v) return;
			
			d.attr("data-uiw-value-date", vd);
			d.attr("data-uiw-value-time", vt);

			d.attr("data-uiw-value", v);
			d.assignValue(v);
			var msg = $.name(d) + "_change";
			exc.components.sendMessage(o, msg, {'cmd':msg, 'value': v, 'date': dt, 'value_date': vd, 'value_time': vt });
		};


		var dy = o.child(".exc-date-year");
		exc.helper.makeNumericField(dy, {allowDecimal: false, validate:/^(([1-9]{1})|([1-9]{1}[0-9]{1})|([1-9]{1}[0-9]{2})|([1-9]{1}[0-9]{3}))$/} );
		dy.addEventListener("blur", function(e){
			var o = e.target;
			var v = "" + o.html();

			if(!v.match(/^([1-9]{1}[0-9]{3})$/)){
				v = "1900";
				o.html(v);
			}
			fn(o);
		});

		var dm = o.child(".exc-date-month");
		exc.helper.makeNumericField(dm, {allowDecimal: false, min:1, max:12} );
		dm.addEventListener("blur", function(e){
			var o = e.target;
			var v = "" + o.html();
			if(!v.match(/^(([1-9]{1})|(0[1-9]{1})|(1[12]{1}))$/)){
				v = "01";
				o.html(v);
			}
			fn(o);
		});


		var dd = o.child(".exc-date-day");
		exc.helper.makeNumericField(dd, {allowDecimal: false, min:1, max:31} );
		dd.addEventListener("blur", function(e){
			var o = e.target;
			var v = "" + o.html();
			if(!v.match(/^(([1-9]{1})|(0[1-9]{1})|([12]{1}[0-9]{1})|(3[01]{1}))$/)){
				v = "01";
				o.html(v);
			}
			fn(o);
		});
		


		var th = o.child(".exc-time-hour");
		exc.helper.makeNumericField(th, {allowDecimal: false, min:1, max:12} );
		th.addEventListener("blur", function(e){
			var o = e.target;
			var v = "" + o.html();

			if(!v.match(/^(([1-9]{1})|(0[1-9]{1})|(00)|(1[012]{1}))$/)){
				v = "01";
				o.html(v);
			}
			fn(o);
		});

		var tm = o.child(".exc-time-minutes");
		exc.helper.makeNumericField(tm, {allowDecimal: false, min:0, max:59} );
		tm.addEventListener("blur", function(e){
			var o = e.target;
			var v = "" + o.html();

			if(!/^[0-5]?[0-9]{1}$/.test(v)){
				v = "00";
				o.html(v);
			}else if(v.length == 1){
				v = "0" + v;
				o.html(v);
			}

			o.attr("lv", v);
			fn(o);
		});

		var ts = o.child(".exc-time-seconds");
		exc.helper.makeNumericField(ts, {allowDecimal: false, min:0, max:59} );
		ts.addEventListener("blur", function(e){
			var o = e.target;
			var v = "" + o.html();

			if(!/^[0-5]?[0-9]{1}$/.test(v)){
				v = "00";
				o.html(v);
				o.addClass('exc-time-pulsate');
			}else if(v.length == 1){
				v = "0" + v;
				o.html(v);
			}
			fn(o);
		});

		var tpm = o.child(".exc-time-pm");
		tpm.on("click", function(e){
			var o = e.target;
			var v = "" + o.html();
			o.html(( (v =="AM") ? "PM" : "AM"));
			fn(o);
		});
	}
});