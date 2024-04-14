//watchdog
E.kickWatchdog();
function kickWd(){
  if(!BTN.read())E.kickWatchdog();
}
var wdint=setInterval(kickWd,2000);
E.enableWatchdog(6, false);
global.ew = { "dbg": 0, "log": [], "def": {}, "is": {}, "do": {"maxTx": 4, "reset": {}, "update": {} }, "tid": {}, "temp": {}, "pin": {} };
ew.pin = { BAT: D3, CHRG: D2, BUZZ: D25, BUZ0: 1, BL: D12, i2c: { SCL: D13, SDA: D14 }, touch: { RST: D13, INT: D28 }, disp: { SPI:D5, MOSI: D6 ,CS: D29, DC: D28, RST: D04, BL: D14 }, acc: { INT: D8 } , serial: {rx: D22, tx:D23 } } ;
E.showMessage = print; //apploader suport
global.save = function() { throw new Error("You don't need to use save() on DSD6!"); };

//errata 108 fix // poke32(0x40000EE4,0x4f)
buzzer = digitalPulse.bind(null,D25,1);
//load in devmode
if (BTN1.read() || require("Storage").read("devmode")) { 
	let mode=(require("Storage").read("devmode"));
	if ( mode=="off"){ 
		require("Storage").write("devmode","done");
		NRF.setAdvertising({},{connectable:false});
		NRF.disconnect();
		NRF.sleep();
		buzzer(250);
	} else {
		require("Storage").write("devmode","done");
		NRF.setAdvertising({}, { name:"eL-"+process.env.SERIAL.substring(15)+"-dev",connectable:true });
		
		NRF.setServices({
			0xffa0: {
				0xffa1: {
					value : [0x00],
					maxLen : 20,
					writable:true,
					onWrite : function(evt) {
						print(1);
						//set.emit("btIn",evt);
					},
					readable:true,
					notify:true,
				   description:"Key Press State"
				}
			}
		}, {advertise: ['0xffa0'],uart:true});
		buzzer(100);
		print("Welcome!\n*** DevMode ***\nShort press the button\nto restart in WorkingMode");
		if (global.o) {
			setTimeout(()=>{
				o.gfx.setFont8x16();
				o.gfx.clear();
				o.gfx.drawString("DEV mode",20,12);
				o.flip();
			},200);
		}else 	global.gotosleep=setTimeout(()=>{NRF.sleep();},300000);
		D22.set();setTimeout(()=>{poke32(0x50000700 + 22 * 4, 2);},8)
	}
	setWatch(function(){
		require("Storage").erase("devmode");
		NRF.setServices({},{uart:false});
		NRF.setServices({},{uart:true}); 
		NRF.disconnect();
		setTimeout(() => {
			reset();
		}, 500);
	},BTN1,{repeat:false, edge:"rising"}); 
}else{ //load in working mode
	if (require('Storage').read('sysOled')) {eval(require('Storage').read('sysOled')); ew.is.oled=1;
		setTimeout(()=>{global.g=ew.oled.gfx;},2000);
	}

	//NRF.disconnect();
	if (require('Storage').read('handler')) eval(require('Storage').read('handler')); //call handler
	if (require('Storage').read('scata')) eval(require('Storage').read('scata')); //call scatar
	if (require('Storage').read('powerbank')) eval(require('Storage').read('powerbank')); //call scatar

	//if (require('Storage').read('euc')) eval(require('Storage').read('euc')); //call euc
	//if (require('Storage').read('eucLight')) {
	//	eval(require('Storage').read('eucLight')); //call euc
	//	euc.brakeLight.hello=1;
	//}
  
  
	print("Welcome!\n*** WorkingMode ***\nLong hold the button\nto restart in DevMode");
	buzzer(150);

}



