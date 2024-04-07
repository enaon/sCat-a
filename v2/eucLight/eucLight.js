euc.brakeLight={
	int:2000,
	tid:0,
	pos:0,
	lp:0,
	en:1,
	hello:0,
	motion:function(){
		"ram";
		if(euc.brakeLight.tid) clearInterval(euc.brakeLight.tid);euc.brakeLight.tid=0;
		euc.brakeLight.lp=0;
		euc.brakeLight.tid=setInterval(()=>{
			euc.brakeLight.lp++;
				if (dash.live.spd<3) return;
				if (dash.live.amp<0) {
					if ( dash.live.amp< -6) {  euc.brakeLight.lp=10;buzzer(50); return;}		
					if ( euc.brakeLight.lp<19 ) {D25.set();euc.brakeLight.lp=20; return;}
					if ( euc.brakeLight.lp<25 ) return;
					if (euc.brakeLight.lp==25) {D25.reset(); return;}
					if (26<euc.brakeLight.lp) {euc.brakeLight.lp=0; return;}
				}else if  (19<euc.brakeLight.lp) euc.brakeLight.lp=0;
				else if (euc.brakeLight.lp==8) buzzer([40,40,40]);
				else if (euc.brakeLight.lp==7)	buzzer(40);
				else if (euc.brakeLight.lp==1||euc.brakeLight.lp==4) buzzer(80);
		},100);
	},
	still:function(){
		  "ram";
  		if(euc.brakeLight.tid) clearInterval(euc.brakeLight.tid);euc.brakeLight.tid=0;
		euc.brakeLight.lp=0;
		euc.brakeLight.tid=setInterval(()=>{
			euc.brakeLight.lp++;
			if(!euc.brakeLight.en||5<euc.brakeLight.lp) euc.brakeLight.end();
			digitalPulse(D25,1,[80,150,80]);
		},2200);
	},
	end:function(){
		if(euc.brakeLight.tid) clearInterval(euc.brakeLight.tid);
		euc.status="STOPPED"
		euc.brakeLight.tid=0;
		setTimeout(()=>{buzzer([500]);},300);
	}
};
//euc.on("state",(x)=>{if (x) {euc.brakeLight.motion();} else{euc.brakeLight.end();} });
//euc.on("charge",(x)=>{if (!x) {euc.brakeLight.motion();} else{ euc.brakeLight.end();} });
euc.on("brakeLight",(x)=>{
	euc.brakeLight.en=x?1:0;
	if (euc.brakeLight.en) digitalPulse(D25,1,600);//else digitalPulse(D25,1,[500,250,100]);
	if(x) euc.brakeLight.still();
	else  euc.brakeLight.end();
});
euc.on("amp",(x)=>{ 
	"ram";
	if (euc.brakeLight.hello) {euc.brakeLight.hello=0; return;}
	if (3<dash.live.spd) {
		if (euc.status!="motion")  { euc.status="motion"; euc.brakeLight.motion();}
	}else if (euc.status!="still")  { euc.status="still"; D25.reset();euc.brakeLight.still();}
});

euc.on("connState",(x)=>{ 
	if (x) NRF.wake();
	else NRF.sleep();
	euc.proxy.state=x;
});

ew.on("button",(x)=>{ 
	"ram";
	if (x=="long"){
		acc.sleep();
		euc.brakeLight.end();
		if (euc.state!="OFF" ) euc.end();
	}else if (x=="double"){
		//E.reboot();
		reset();
		//euc.brakeLight.hello=1;
		//if (euc.state=="OFF" ) euc.start();
	}else if (x=="triple"){
		dash.live.spd=10;euc.brakeLight.motion();		
	}else if (x=="short"){
		if(euc.brakeLight.tid) clearInterval(euc.brakeLight.tid);euc.brakeLight.tid=0;
		if (ew.is.batt(1)<25) buzzer(50); 
		else if (ew.is.batt(1)<50) buzzer([50,250,50]); 
		else if (ew.is.batt(1)<75) buzzer([50,250,50,250,50]); 
		else buzzer([50,250,50,250,50,250,50]);   
	}
});

acc.on("action",(x,y)=>{
	if (euc.state!="OFF") return;
	//acc.sleep();
	//E.reboot();
	ew.emit("button","double");
});

function ewcron(){
	NRF.setAdvertising({}, { name: (euc.state=="OFF"?"eL-":"eL-ks-") + process.env.SERIAL.substring(15), manufacturerData: [[euc.state,"-"+ew.is.batt(1),"-"+(ew.is.ondc?"1":"0")]],connectable: true});
	//NRF.setAddress(ew.def.mac);
}
ew.tid.cron=setInterval(ewcron,10000);


//>NRF.findDevices(function(devices) {print(devices);},  {timeout : 3000, active:true,filters: [{namePrefix:'eL'}]  });
