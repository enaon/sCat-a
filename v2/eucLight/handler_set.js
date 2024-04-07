//dsd6 set handler 
//kx023 https://kionixfs.kionix.com/en/datasheet/KX023-1025%20Specifications%20Rev%2012.0.pdf
// http://static6.arrow.com/aropdfconversion/d627a443f35fdb58d80c5dedaee45b6bd2b8ae25/5332090777856918an04120getting20started20with20the20kx02320and20kx02.pdf
// https://kionixfs.kionix.com/en/document/TN014%20KX022%2C%20KX023%20Accelerometer%20Power-On%20Procedure.pdf
//NRF.findDevices(function(devices) {print(devices);},  {timeout : 3000, active:true,filters: [{namePrefix:'eL-7d'}]  });

ew.updateBT = function() { //run this for settings changes to take effect.
	NRF.setTxPower(ew.def.rfTX);
	NRF.setAddress(`${NRF.getAddress()} random`);
	NRF.setAdvertising({}, { name: "eL-" + process.env.SERIAL.substring(15), manufacturerData: [["OFF","-"+ew.is.batt(1),"-"+(ew.is.ondc?"1":"0")]],connectable: true });
	//NRF.setAddress(ew.def.mac);
	NRF.setServices({
		0xffa0: {
			0xffa1: {
				value: [0x01],
				maxLen: 20,
				writable: true,
				onWrite: function(evt) {
					//global.lala=evt;
					//paca(E.toString(evt.data))
					ew.emit("BTRX",E.toString(evt.data));
				},
				readable: true,
				notify: true,
				description: "ew"
			}
		}
	}, { advertise: ['0xffa0'], uart: true });
	//NRF.disconnect();
	NRF.restart();
};
ew.updateSettings = function() { require('Storage').write('ew.json', ew.def); };
ew.resetSettings = function() {
	ew.def = {
		name: "eL-" + process.env.SERIAL.substring(15),
		rfTX: +4,
		bri: 2, //Screen brightness 1..7
		cli: 1,
		retry: 10,
		addr: NRF.getAddress(),
		mac: "c2:c5:c3:01:d6:63 public",
		//mac: "64:69:4e:75:89:4d public",
		buzz: 1
	};
	ew.updateSettings();
};
ew.fileSend=function(filename) {
  let length=0;
  let d = require("Storage").read(filename, length, 20);
  while (d!=="") {
    console.log(btoa(d));
    //console.log(d);
    length=length+20;
     d = require("Storage").read(filename, length, 20);
  }
};

//this.mac="64:69:4e:75:89:4d public";
//this.mac="f8:33:31:a5:ef:fe public";
if (!require('Storage').read("ew.json") || !JSON.parse(require('Storage').read("ew.json")).name.startsWith("eucLight"))
	ew.resetSettings();
else{
	ew.def = require('Storage').readJSON("ew.json");

}
//ew.updateBT();

//function ewcron(){
	NRF.setAdvertising({}, { name: "eL-" + process.env.SERIAL.substring(15), manufacturerData: [["OFF","-"+ew.is.batt(1),"-"+(ew.is.ondc?"1":"0")]],connectable: true });
	//NRF.setAddress(ew.def.mac);
//}
//ew.tid.cron=setInterval(ewcron,10000);