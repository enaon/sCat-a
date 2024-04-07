//dsd6 handler 

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
ew.is.charging=function(){
  		  let v=digitalRead(D2);
		  poke32(0x50000708,2); // disconnect pin for power saving, otherwise it draws 70uA more
		  return v;
};

ew.tid.charge = setWatch(function(s) {
	ew.is.ondc = s.state;
	//print(s.state);
	//buzzer(s.state?400:[50,100,50]);
	if (ew.def.autoC) ew.emit('chargeEl', s);
	ew.emit('ondc', s);
}, ew.pin.CHRG, { repeat: true, debounce: 50, edge: 0 });

ew.on('chargeEl', (s) => {
	"ram";
	//print("s:",s);
	//print("count",ew.is.chargeTick);
	ew.is.chargeTick++;
	if (ew.tid.chargeDelay) clearTimeout(ew.tid.chargeDelay);
	ew.tid.chargeDelay = setTimeout((s) => {
		ew.is.chargeTick = 0;
		ew.tid.chargeDelay = 0;
		ew.emit('euc', s?'start':'stop');
		//print("euc start", s);
	}, 1000, s.state);
	if (3 < ew.is.chargeTick && s.state && ew.tid.chargeDelay ) {
			clearTimeout(ew.tid.chargeDelay);
			ew.tid.chargeDelay = 0;
	}
});