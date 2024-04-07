//m_gb
//parts of code from bangle.js**put link 
//E.setConsole(Serial1,{force:true});

global.GB= (event) => {
	if (ew.dbg && ew.log) {
		ew.log.unshift(event);
		if (100 < ew.log.length) ew.log.pop();
	}
	switch (event.t) {
	  case "notify":
      //case "notify-":
        gb.ntfy(event);
        break;
      case "musicinfo":
       gb.musicinfo(event);
        break;
      case "musicstate":
        gb.musicstate(event);
        break;
      case "call":
        gb.call(event);
        break;
      case "find":
        gb.find(event);
        break;
	  case "weather":
        gb.weather(event);
        break;
    }
};
gb={is:{}};
gb.send =function(message) {
	if (ew.dbg && ew.log) {
		ew.log.unshift(message);
		if (100 < ew.log.length) ew.log.pop();
	}
    Bluetooth.println("");
    Bluetooth.println(JSON.stringify(message));
};
gb.sendBattery=function() {
    gb.send({ t: "status", bat: w.batt(1) });
};
gb.dismiss=function(id) {
	gb.send({ "t":"notify", "id":id, "n":"DISMISS" });
}	;
gb.ntfy=function(event) {
	if (event.t === "notify-") return; //todo
	let d=(Date()).toString().split(' ');
    let ti=(""+d[4]+" "+d[0]+" "+d[2]);
	if (event.src){
		if (event.src.startsWith('Phone')||event.src.startsWith('Manage')){
			if (!event.body||!event.title) return;
			if (event.title.startsWith('Missed')||event.body.includes('Missed')){
				notify.alert("call",{src:event.src.substr(0,15),title:event.title.substr(0,20),body:event.body.substr(0,90),time:ti,id:event.id,idUnread:true});
			}
		}else if (event.src.startsWith('maps')){
			notify.alert("info",{"src":"MAPS","title":"MAPS","body":"MAPS"});
		}else if (event.src.startsWith('OsmAnd')){
			notify.alert("info",{"src":"OSMAND","title":"STATUS","body":event.body.substr(0,90)});
		}else if (event.src.startsWith('WheelLog')){
			notify.alert("euc",{"src":"WHEELLOG","title":"STATUS","body":event.body.substr(0,90)});
		}else{
			notify.alert("im",{src:event.src.substr(0,15),title:(event.title)?event.title.substr(0,20):"-",body:(event.body)?event.body.substr(0,90):"-",time:ti,id:event.id,idUnread:true});
		}
    }else if (event.sender) {
		notify.alert("im",{src:"SMS",title:event.sender.substr(0,20),body:(event.body)?event.body.substr(0,90):"-",time:ti,id:event.id,idUnread:true});
	}else if(event.title=="Voice"){
		notify.alert("info",{"src":"GB","title":"Voice","body":event.body.substr(0,90)});
	}
} ;
gb.musicstate =function(event) {
//	notify.alert("info",{"src":"GB","title":"MUSIC","body":"STATE"});
	gb.is.musicState=event.state;
}
gb.musicinfo =function(event) {
//	notify.alert("info",{"src":"GB","title":"MUSIC","body":"INFO"});
}
gb.weather =function(event) {
	  notify.wupd=1;
	  notify.weather=event;
	  notify.alert("im",{"src":"Weather","title":"WEATHER UPDATE","body":+event.loc,"TIME":ti});
} ;
gb.call =function(event) {
	if (event.cmd==="incoming"&&event.name){
		notify.in=event;notify.ring=1;
		buzzer.nav([80,50,80,50,200,50,80,50,80]);
		if (face.appCurr!="clock"||face.pageCurr!=0) {
			face.go("clock",0);
			face.appPrev="clock";face.pagePrev=-1;
        }
	}else if (event.cmd=="end") {
		  notify.ring=0;notify.in=0;
	}
} ;
//require('Storage').writeJSON("messages.log",messages)
//if ( JSON.parse(messages[0]).t=="notify") print(1)
// var _GB = global.GB;
gb.find =function(event) {
    if (event.n===true) {
	  if (!ew.tid.GB_find){
		notify.alert("info",{"src":"GB","title":"FIND WATCH","body":"HERE I AM"});
		ew.tid.GB_find=setInterval(function(){ buzzer.nav([100,50,100,50,100]); },1000); 
	  }
	} else { // found
		notify.alert("info",{"src":"GB","title":"FIND WATCH","body":"FOUND !"});
		clearInterval(ew.tid.GB_find);ew.tid.GB_find=0;
    }
} ;  
  
  