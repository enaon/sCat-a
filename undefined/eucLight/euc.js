//euc module loader
if (!global.dash) global.dash={} ;
dash.live=require("Storage").readJSON("eucSlot.json",1);
ampL=[];batL=[];almL=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
ew.is.bt=4;
global.euc= {
	state: "OFF",
	reconnect:0,
    busy:0,
	night:1,
	day:[7,19],
	run:0,
	update:function(slot){require('Storage').write('eucSlot'+slot+'.json', dash.live);},
	start:function(){
		if (euc.dbg) console.log("EUC start");
		if (ew.tid.bt) {clearTimeout(ew.tid.bt); ew.tid.bt=0;}
		if (euc.state!="OFF") {;return;}
		euc.proxy.i()
		euc.run=0;
		NRF.setTxPower(ew.do.maxTx);
		this.mac=ew.def.mac;
		if(!this.mac) {
			print("nomac");
		}else {
			//print("on");
			eval(require('Storage').read('eucKingsong'));
			this.state="ON";
			this.conn(this.mac); 
		}
	},
	end:function(){
			if (euc.dbg) console.log("EUC end");
			if (this.state=="OFF") return;
			this.state="OFF";
			euc.wri("end");
			return;
	},
	tgl:function(){ 
		if(euc.state=="OFF")
			euc.start();
		else 
			euc.end();
	}
};

euc.off=function(err){
	if (euc.dbg) console.log("EUC.off :",err);
	euc.emit("connState",0);
	if (euc.reconnect) {clearTimeout(euc.reconnect); euc.reconnect=0;}
	if (euc.state!="OFF") {
		if (euc.dbg) console.log("EUC: Restarting");
		if ( ew.def.retry < euc.run) {
				euc.end();
				acc.wake(2);
				return;
		}
		euc.run=euc.run+1;
		if ( err==="Connection Timeout"  )  {
			euc.state="LOST";
			euc.reconnect=setTimeout(() => {
				euc.reconnect=0;
				if (euc.state!="OFF") euc.conn(euc.mac); 
			}, 5000);
		}else if ( err==="Disconnected"|| err==="Not connected")  {
			euc.state="FAR";
			euc.reconnect=setTimeout(() => {
				euc.reconnect=0;
				if (euc.state!="OFF") euc.conn(euc.mac); 
			}, 1000);
		} else {
			euc.state="RETRY";
			if(euc.brakeLight.tid) clearInterval(euc.brakeLight.tid);euc.brakeLight.tid=0;
			buzzer(100);
			euc.reconnect=setTimeout(() => {
				euc.reconnect=0;
				if (euc.state!="OFF") euc.conn(euc.mac); 
			}, 2000);
		}
	} else {
		if ( global["\xFF"].BLE_GATTS&&global["\xFF"].BLE_GATTS.connected ) {
			if (euc.dbg) console.log("ble still connected"); 
			global["\xFF"].BLE_GATTS.disconnect();
		}
		global["\xFF"].bleHdl=[];
		if (euc.dbg) console.log("EUC OUT:",err);
		if (euc.busy) { clearTimeout(euc.busy);euc.busy=0;} 
		if (euc.reconnect) {clearTimeout(euc.reconnect); euc.reconnect=0;}
		euc.wri=function(i) {if (euc.dbg) console.log("not connected yet"); if (i=="end") euc.off("end");  };
		ew.tid.bt=setTimeout(() => {
			if (euc.dbg) console.log("EUC: reseting BT");
			ew.tid.bt=0;
			ew.updateBT();
		}, 2000);
	}
};
if (require('Storage').read('proxyKingsong')&&ew.is.bt==4){
	eval(require('Storage').read('proxyKingsong'));
	//euc.proxy.i()
}	




