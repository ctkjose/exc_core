/* Based on work from
* jshashes - https://github.com/h2non/jshashes
* Released under the "New BSD" license
*/

exc.crypto = {
	utf8Encode: function(str) {
		var x, y, output = '',i = -1, l;
		
		if (str && str.length) {
			l = str.length;
			while ((i += 1) < l) {
				/* Decode utf-16 surrogate pairs */
				x = str.charCodeAt(i); y = i + 1 < l ? str.charCodeAt(i + 1) : 0;
				if (0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF) {
					x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF); i += 1;
				}
				/* Encode output as utf-8 */
				if (x <= 0x7F) {
					output += String.fromCharCode(x);
				} else if (x <= 0x7FF) {
					output += String.fromCharCode(0xC0 | ((x >>> 6) & 0x1F), 0x80 | (x & 0x3F));
				} else if (x <= 0xFFFF) {
					output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F), 0x80 | ((x >>> 6) & 0x3F), 0x80 | (x & 0x3F));
				} else if (x <= 0x1FFFFF) {
					output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07), 0x80 | ((x >>> 12) & 0x3F), 0x80 | ((x >>> 6) & 0x3F), 0x80 | (x & 0x3F));
				}
			}
		}
		return output;
	},
	utf8Decode: function(str) {
		var i, ac, c1, c2, c3, arr = [], l;
		i = ac = c1 = c2 = c3 = 0;

		if (str && str.length) {
			l = str.length;
			str += '';
			
			while (i < l) {
				c1 = str.charCodeAt(i);
				ac += 1;
				if (c1 < 128) {
					arr[ac] = String.fromCharCode(c1);
					i += 1;
				} else if (c1 > 191 && c1 < 224) {
					c2 = str.charCodeAt(i + 1);
					arr[ac] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
					i += 2;
				} else {
					c2 = str.charCodeAt(i + 1);
					c3 = str.charCodeAt(i + 2);
					arr[ac] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
					i += 3;
				}
			}
		}
		return arr.join('');
	},
	hex: function(input, hexcase) {
		var hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef',
		output = '',
		x, i = 0,
		l = input.length;
		for (; i < l; i += 1) {
			x = input.charCodeAt(i);
			output += hex_tab.charAt((x >>> 4) & 0x0F) + hex_tab.charAt(x & 0x0F);
		}
		return output;
	}
};

(function(crypto){
	crypto.b64URL = {
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
	
})(exc.crypto);




(function(crypto){

	function safe_add(x, y) { //Add integers, wrapping at 2^32
		var lsw = (x & 0xFFFF) + (y & 0xFFFF),
		msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return (msw << 16) | (lsw & 0xFFFF);
	}
	function bit_rol(num, cnt) { //Bitwise rotate a 32-bit number to the left.
		return (num << cnt) | (num >>> (32 - cnt));
	}

	/**
   * Convert a raw string to an array of big-endian words
   * Characters >255 have their high-byte silently ignored.
   */
   function rstr2binb(input) {
		var i, l = input.length * 8,
		output = Array(input.length >> 2),
		lo = output.length;
		for (i = 0; i < lo; i += 1) {
			output[i] = 0;
		}
		for (i = 0; i < l; i += 8) {
			output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (24 - i % 32);
		}
		return output;
	}

	/**
   * Convert an array of big-endian words to a string
   */
	function binb2rstr(input) {
		var i, l = input.length * 32,
		output = '';
		for (i = 0; i < l; i += 8) {
			output += String.fromCharCode((input[i >> 5] >>> (24 - i % 32)) & 0xFF);
		}
		return output;
	}


	//Compute SHA256 RAW
	function sha256_raw(s, utf8) {
		s = (utf8) ? utf8Encode(s) : s;
		return binb2rstr(binb(rstr2binb(s), s.length * 8));
    }
	/**
	* Calculate the HMAC-sha256 of a key and some data (raw strings)
	*/

	function sha256_hmac(key, data, utf8) {
		key = (utf8) ? crypto.utf8Encode(key) : key;
		data = (utf8) ? crypto.utf8Encode(data) : data;
		var hash, i = 0,
		bkey = rstr2binb(key),
		ipad = Array(16),
		opad = Array(16);
		
		if (bkey.length > 16) {
			bkey = binb(bkey, key.length * 8);
		}
		
		for (; i < 16; i += 1) {
			ipad[i] = bkey[i] ^ 0x36363636;
			opad[i] = bkey[i] ^ 0x5C5C5C5C;
		}
		
		hash = binb(ipad.concat(rstr2binb(data)), 512 + data.length * 8);
		return binb2rstr(binb(opad.concat(hash), 512 + 256));
	} 

	/*
	* Main sha256 function, with its support functions
	*/

	function sha256_S(X, n) {
		return (X >>> n) | (X << (32 - n));
	}

	function sha256_R(X, n) {
		return (X >>> n);
	}
	
	function sha256_Ch(x, y, z) {
		return ((x & y) ^ ((~x) & z));
	}
	
	function sha256_Maj(x, y, z) {
		return ((x & y) ^ (x & z) ^ (y & z));
	}
	
	function sha256_Sigma0256(x) {
		return (sha256_S(x, 2) ^ sha256_S(x, 13) ^ sha256_S(x, 22));
	}
	
	function sha256_Sigma1256(x) {
		return (sha256_S(x, 6) ^ sha256_S(x, 11) ^ sha256_S(x, 25));
	}
	
	function sha256_Gamma0256(x) {
		return (sha256_S(x, 7) ^ sha256_S(x, 18) ^ sha256_R(x, 3));
	}
	
	function sha256_Gamma1256(x) {
		return (sha256_S(x, 17) ^ sha256_S(x, 19) ^ sha256_R(x, 10));
	}
	
	function sha256_Sigma0512(x) {
		return (sha256_S(x, 28) ^ sha256_S(x, 34) ^ sha256_S(x, 39));
	}
	
	function sha256_Sigma1512(x) {
		return (sha256_S(x, 14) ^ sha256_S(x, 18) ^ sha256_S(x, 41));
	}

	function sha256_Gamma0512(x) {
		return (sha256_S(x, 1) ^ sha256_S(x, 8) ^ sha256_R(x, 7));
	}
	
	function sha256_Gamma1512(x) {
		return (sha256_S(x, 19) ^ sha256_S(x, 61) ^ sha256_R(x, 6));
	}
	
	sha256_K = [
	1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993, -1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
	1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
	264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
	113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
	1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885, -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
	430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
	1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872, -1866530822, -1538233109, -1090935817, -965641998
	];

    function binb(m, l) {
		var HASH = [1779033703, -1150833019, 1013904242, -1521486534,1359893119, -1694144372, 528734635, 1541459225];
		var W = new Array(64);
		var a, b, c, d, e, f, g, h;
		var i, j, T1, T2;
		
		/* append padding */
		m[l >> 5] |= 0x80 << (24 - l % 32);
		m[((l + 64 >> 9) << 4) + 15] = l;
		
		for (i = 0; i < m.length; i += 16) {
			a = HASH[0];
			b = HASH[1];
			c = HASH[2];
			d = HASH[3];
			e = HASH[4];
			f = HASH[5];
			g = HASH[6];
			h = HASH[7];
			
			for (j = 0; j < 64; j += 1) {
				if (j < 16) {
					W[j] = m[j + i];
				} else {
					W[j] = safe_add(safe_add(safe_add(sha256_Gamma1256(W[j - 2]), W[j - 7]), sha256_Gamma0256(W[j - 15])), W[j - 16]);
				}
				
				T1 = safe_add(safe_add(safe_add(safe_add(h, sha256_Sigma1256(e)), sha256_Ch(e, f, g)), sha256_K[j]), W[j]);
				T2 = safe_add(sha256_Sigma0256(a), sha256_Maj(a, b, c));
				h = g;
				g = f;
				f = e;
				e = safe_add(d, T1);
				d = c;
				c = b;
				b = a;
				a = safe_add(T1, T2);
			}
			
			HASH[0] = safe_add(a, HASH[0]);
			HASH[1] = safe_add(b, HASH[1]);
			HASH[2] = safe_add(c, HASH[2]);
			HASH[3] = safe_add(d, HASH[3]);
			HASH[4] = safe_add(e, HASH[4]);
			HASH[5] = safe_add(f, HASH[5]);
			HASH[6] = safe_add(g, HASH[6]);
			HASH[7] = safe_add(h, HASH[7]);
		}
		return HASH;
	}

	crypto.SHA256HMAC = function(k, data, opUTF8){
		var b = (typeof(opUTF8) == "boolean") ? opUTF8 : true;
		return sha256_hmac(k, data, b);
	};
	crypto.SHA256 = function(data){
		var b = (typeof(opUTF8) == "boolean") ? opUTF8 : true;
		return sha256_raw(data, b);
	};

})(exc.crypto);

(function(crypto){
	crypto.jwt = {
		create: function(header, payload, key){
			var o = crypto.b64URL.encode(JSON.stringify(header)) + "." + crypto.b64URL.encode(JSON.stringify(payload));
			var sig = exc.crypto.SHA256HMAC(key, o);
			sig = exc.crypto.b64URL.encode(sig);
			var out = {'sig': sig, 'jwt': o + '.' + sig };
			return out;
		},
		parse: function(hash){
			var jwt = {'header':{}, 'payload':[], 'sig':""};
			var tkp = hash.split('.');
			jwt.sig = tkp[2];
			try{
				jwt.header = JSON.parse(crypto.b64URL.decode(tkp[0]));
				jwt.payload = JSON.parse(crypto.b64URL.decode(tkp[1]));
				
			}catch(e){}

			return jwt;
		},
	};
	
})(exc.crypto);