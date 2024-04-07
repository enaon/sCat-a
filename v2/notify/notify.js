//notify	
tcNext.replaceWith(()=>{buzzer.nav(buzzer.buzz.ok);face.go("clock",0);});
tcBack.replaceWith(()=>{buzzer.nav(buzzer.buzz.na);});
face[0] = {
	run:false,
	btn:{},
	g:w.gfx,
	offms: (ew.def.off[face.appCurr])?ew.def.off[face.appCurr]:10000,
	bpp:ew.def.bpp?0:1,
	init: function(o){ 
		UI.ele.fill("_main",15,0);
	UI.ele.ind(1,4,0,0);
    UIc.start(1,1);
  	UI.btn.img("main","_3x1",1,"ntfy_call",notify.is.call,notify.is.call?11:3,0,1);
		UI.btn.img("main","_3x1",2,"ntfy_im",notify.is.im,notify.is.im?11:3,0,1);
    UIc.end();
		this.bar();
		UIc.main._3x1=(i)=>{
		  this.view(i);
	  };
	},
	show : function(s){
		if (!this.run) return;
	},
	view:function(n){
    let type=["","call","im","info","euc"]
    let msg=notify.log[type[n]][0];
    //this.msg=JSON.parse(notify.log[type[n]][0]);
    //let this.msg=require("Storage").read(this.type+this.list[this.go].substr(4)).split("|");
    //if (this.dowrap>0) this.msg.body=this.wrap(this.msg.body,this.dowrap);
    let body=w.gfx.wrapString(msg.body||"",220);
		UI.btn.c2l("main","_main",3,"INFO","",15,1);
		UI.ele.txt("_main",6,body.join("\n"),15,1);
	},
	bar:function(){
		//"ram";
		ew.temp.bar=0;
		UIc.start(0,1);
  		UI.ele.fill("_bar",6,0);
			UI.btn.img("bar","_3x1",3,"ntfy_info",notify.is.info,notify.is.info?11:3,0,1);
		UIc.end();
		UIc.bar._3x1=(i)=>{
		  this.view(i);
	  };
	},
	clear : function(o){
		ew.temp.bar=0;/*TC.removeAllListeners();*/if (this.tid) clearTimeout(this.tid);this.tid=0;return true;
	},
	off: function(o){
		this.g.off();this.clear(o);
	}
};
//



