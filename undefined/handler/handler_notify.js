E.setFlags({pretokenise:1});
//notifications
var notify={
	new:0,is:{im:0,info:0,call:0,mail:0} ,log:{},do:{}
};
notify.log.im=(require('Storage').read('log_im.log'))?require('Storage').readJSON('log_im.log'):[];
notify.log.info=(require('Storage').read('log_info.log'))?require('Storage').readJSON('log_info.log'):[];
notify.log.call=(require('Storage').read('log_call.log'))?require('Storage').readJSON('log_call.log'):[];
notify.log.euc=(require('Storage').read('log_e.c2luc.log'))?require('Storage').readJSON('log_euc.log'):[];

notify.alert=function(type,event,discrete){
	notify.is[type]++;
	notify.new++;
	let d=(Date()).toString().split(' ');
    let ti=(""+d[4]+" "+d[0]+" "+d[2]);
    event.time=ti;
	//notify.log[type].unshift("{\"src\":\""+event.src+"\",\"title\":\""+event.title+"\",\"body\":\""+event.body+"\",\"time\":\""+ti+"\"}");
	//notify.log[type].unshift({"src":event.src,"title":event.title,"body":event.body,"time":ti});
	notify.log[type].unshift(event);
	if (ew.def.buzz&&!notify.is.ring) {
		//face.off(8000);
		buzzer.nav([80,50,80]);
		if (face[0].bar){
			UI.btn.ntfy(1,4,0,"_bar",6,event.title,event.body,0,15);w.gfx.flip();
		}else if (!discrete){
			if (face.appCurr!="clock"||face.pageCurr!=0) {
				face.go("clock",0);
				face.appPrev="clock";face.pagePrev=-1;
			}
		}
	}
}

