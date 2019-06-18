self.exc = self.exc || {};
exc.options = {

};

//Configurable options
exc.options.datepicker = {
	strs : {},
	strings : {
		"en" : {
			'months' : ['','January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
			'weekdays': ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
			"weekdays_short": ["S", "M", "T", "W", "T", "F", "S"],
			'th_days' : '<tr><th>Su</th><th>M</th><th>Tu</th><th>W</th><th>Th</th><th>F</th><th>Sa</th></tr>',
			'today' : 'Today',
			'nm' : 'Next Month',
			'pm' : 'Previous Month'
		},
		"es" : {
			'months' : ['','Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
			'weekdays':["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
			"weekdays_short": ["D", "L", "M", "M", "J", "V", "S"],
			'th_days' : '<tr><th>D</th><th>L</th><th>M</th><th>W</th><th>J</th><th>V</th><th>S</th></tr>',
			'today' : 'Hoy',
			'nm' : 'Proximo Mes',
			'pm' : 'Mes Anterior'
		}
	}
};