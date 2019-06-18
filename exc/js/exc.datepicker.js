
exc.views.showDatePicker = function(options){
	var name = "dialogDatePicker";
	
	var ops = core.extend({
		'lng': "en",
		'target' : null,
		'center' : false,
		'valueBuild': null,
		'valueSet': null,
		'valueGet': null,
	}, options);


	if(ops.hasOwnProperty("publish") && !ops.valueSet){
		ops.valueSet = function(v){
			app.publish(ops.publish, {'value': v});
		};
	}
	if(!ops.valueSet) return null;
	
	var p;
	var strs = exc.options.datepicker.strings[ ops.lng ];
	var _weekdays = strs['weekdays'];
	var dialog;
	var _state = {
		dialog: null,
		ops: null,
		y: 0,
		m: 0,
		d: 0,
		ld:0,
		save: function(){
			p.setAttribute("data-month", this.m);
			p.setAttribute("data-year", this.y);
			p.setAttribute("data-day", this.d);
			p.setAttribute("data-ld", this.ld);
		},
		getDate: function(){
			return new Date(this.y, this.m-1, this.d);
		},
		refresh: function(){
			
			this.dim = [0,31,28,31,30,31,30,31,31,30,31,30,31];
			if( ( (this.y%4 === 0) && (this.y%100 !== 0) ) || (this.y%400 === 0) ){
				this.dim[2] = 29;
			}

			this.ld = this.dim[this.m];
		},
		setMonth: function(v){
			if( (v<1) || (v>12)) v = 1;

			p.child(".dtp.vm .v").html( strs.months[v] );

			this.m = v;
			this.refresh();
			
			var d = this.d;
			if(this.d > this.ld) d = this.ld;
			this.setDay(d);
		},
		setDay: function(v){
			var pd = p.child(".dtp.vd");

			if(v>this.ld) v = 1;
			if(v<1) v = ld;
			this.d = v;
	
			var dt = new Date(this.y, this.m-1, v);

			pd.child(".v .vdn").html(v);
			if(dt)  pd.child(".v .vdw").html( strs.weekdays[ dt.getDay() ] );
		},
		setYear: function(v){
			var pd = p.child(".dtp.vy");
	
			if(v<1900) v = 1900;
			this.y = v;
			this.refresh();

			var dt = new Date(v, this.m-1, this.d);
			
			var d = this.d;
			if(dt.getDate() != d) d = 1;
			this.setDay(d);
			
			pd.child(".v").html(v);
		}
	};
	
	
	dialog = exc.views.items[name];
	if(!dialog ){
		var def = { ///
			name: "dialogDatePicker",
			options:{
				closeButton: false,
			}
		};

		var getDatePickerState = function(){
			return dialog._datepicker_state;
		};

		exc.views.items[name] = exc.views.modal.create(def);
		dialog = exc.views.items[name];
		
		
		p= dialog.o.child( ".exc-modal-body");
		
		dialog.o.child(".exc-modal-dialog").addClass("no-padding").css({"width": "180px", "min-width": "auto"});
		

		s = "<div class='dtp vm'><div class='la'><i></i></div><div class='v'></div><div class='ra'><i></i></div></div>";
		$.append(p, s);

		p.child(".dtp.vm .la").on("click", function(){
			var _state = getDatePickerState();
			var m = _state.m - 1;
			if(m<=0) m = 12;
			_state.setMonth(m);
		});
		p.child(".dtp.vm .ra").on("click", function(){
			var _state = getDatePickerState();
			var m = _state.m + 1;
			if(m>12) m = 1;
			_state.setMonth(m);
		});

		s = "<div class='dtp vd'><div class='la'><i></i></div><div class='v'><span class='vdn'></span><span class='vdw'></span></div><div class='ra'><i></i></div></div>";
		$.append(p, s);
		var n = p.child(".dtp.vd .la");
		p.child(".dtp.vd .la").on("click", function(){
			var _state = getDatePickerState();
			var v = _state.d - 1;
			_state.setDay(v);
		});
		p.child(".dtp.vd .ra").on("click", function(){
			var _state = getDatePickerState();
			var v = _state.d + 1;
			_state.setDay(v);
		});

		s = "<div class='dtp vy'><div class='la'><i></i></div><div class='v' contenteditable='true'></div><div class='ra'><i></i></div></div>";
		$.append(p, s);

		p.child(".dtp.vy .la").on("click", function(){
			var _state = getDatePickerState();
			var v = _state.y - 1;
			_state.setYear(v);
		});
		p.child(".dtp.vy .ra").on("click", function(){
			var _state = getDatePickerState();
			var v = _state.y + 1;
			_state.setYear(v);
		});
		p.child(".dtp.vy .v").on("keyup", function(){
			var _state = getDatePickerState();
			var pv = p.get(".dtp.vy .v");
			var v = pv.html();

			if(v.match(/^[0-9]{4}$/)){
				var y  = v * 1;
				_state.setYear(y);
			}
		});

		
		s = "<div class='dtp ok'><div class='ok'><i></i></div><div class='cal'><i></i></div><div class='cancel'><i></i></div></div>";
		$.append(p, s);
		p.child(".dtp.ok .ok").on("click", function(){
			var _state = getDatePickerState();
			if(typeof(_state.ops.valueSet) != "function") return;

			var dt = new Date(_state.y, _state.m-1, _state.d);
			core.callbackWithArguments(_state.ops.valueSet, [dt]);
			_state.dialog.close();
		});
		p.child(".dtp.ok .cancel").on("click", function(){
			var _state = getDatePickerState();
			_state.dialog.close();
		});
		p.child(".dtp.ok .cal").on("click", function(){
			var _state = getDatePickerState();
			var dt = new Date();

			_state.setMonth(dt.getMonth()+1);
			_state.setYear(dt.getFullYear());
			_state.setDay(dt.getDate());
		});
	}else{
		p= dialog.o.child( ".exc-modal-body");
	}
	
	var dt;
	if(ops.hasOwnProperty("valueGet") && (typeof(ops.valueGet) == "function")){
		var d = ops.valueGet();
		dt =  exc.types.date.create(d);
	}else{
		dt =  exc.types.date.create();
	}

	dialog._datepicker_state = _state;
	_state.dialog = dialog;
	_state.ops = ops;
	_state.y = dt.year;
	_state.d = dt.day;

	_state.setMonth(dt.month);
	_state.setYear(dt.year);
	_state.setDay(dt.day);
	dialog.show();
	
};