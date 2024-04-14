//dsd6 btn handler 
ew.is.btnPress=0;
ew.btn=(x)=>{
	if (ew.tid.long) {clearTimeout(ew.tid.long);ew.tid.long=0;}
	if (x.state) { 
		ew.is.lastBTNtime=x.time-x.lastTime;
		ew.is.btnPress++;
		ew.tid.long=setTimeout(() => {
			ew.tid.long=0;
			ew.emit("button","long");
			ew.is.btnPress=0;
		}, 1000);
		return;
	}else if (ew.is.btnPress) {
		if (ew.tid.short) {clearTimeout(ew.tid.short);ew.tid.short=0;} 
	//	if (ew.is.lastBTNtime<0.3){ 
	//		ew.emit("button","double");
	//		ew.is.btnPress=0;
	//	} 
	//	else {
			ew.tid.short=setTimeout(() => {
				if (2<ew.is.btnPress)	ew.emit("button","triple");
				else if (1<ew.is.btnPress)	ew.emit("button","double");
				else ew.emit("button","short");
				ew.tid.short=0;
				ew.is.btnPress=0;
			}, 500);
	//	}
	}
	
};
ew.tid.btn=setWatch(ew.btn,BTN1, {repeat:true, debounce:10,edge:"both"});

