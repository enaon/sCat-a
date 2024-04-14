//dsd6 charge handler 
E.setFlags({ pretokenise: 1 });
//charging notify
ew.is.chargeTick=0;
ew.is.ondc=0;
ew.is.batt=function(i){
		  let v=6.61207596594*analogRead(D3);
		  poke32(0x5000070c,2); // disconnect pin for power saving, otherwise it draws 70uA more
		  if (i) return Math.round( (v*100-350)*(100/( 415-350)));
		  else return Number(v.toFixed(2));
};
ew.is.ondcVoltage=function(i){
		  let v=6.61207596594*analogRead(D2);
		  //if (scata && scata.busy ) print ("skipping disconnection"); else 
		  poke32(0x50000708,2); // disconnect pin for power saving, otherwise it draws 70uA more
		  if (i) return Math.round( (v*100-330)*(100/( 420-330)));
		  else return Number(v.toFixed(2));
};
ew.tid.charge = setWatch(function(s) {
	ew.is.ondc = s.state;
	ew.emit('ondc', s);
}, ew.pin.CHRG, { repeat: true, debounce: 50, edge: 0 });

