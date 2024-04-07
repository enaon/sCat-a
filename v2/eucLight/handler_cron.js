E.setFlags({pretokenise:1});
//tasks
cron={
	event:{
		//date:()=>{ setTimeout(() =>{ cron.emit('dateChange',Date().getDate());cron.event.date();},(Date(Date().getFullYear(),Date().getMonth(),Date().getDate()+1)-Date()));},
		hour:()=>{ew.tid.cronH=setTimeout(() =>{ew.tid.cronH=0; cron.emit('hour',Date().getHours());cron.event.hour();},(Date(Date().getFullYear(),Date().getMonth(),Date().getDate(),Date().getHours()+1,0,1)-Date()));},
		//min: ()=>{setTimeout(() =>{ cron.emit('min',Date().getMinutes());cron.event.min();},(Date(Date().getFullYear(),Date().getMonth(),Date().getDate(),Date().getHours(),Date().getMinutes()+1)-Date()));},
		//sec:()=>{setTimeout(() =>{ cron.emit('sec',Date().getSeconds());cron.event.sec();},(Date(Date().getFullYear(),Date().getMonth(),Date().getDate(),Date().getHours(),Date().getMinutes(),Date().getSeconds()+1)-Date()));},
	}
};


cron.event.hour();

//cron.on('hour',cron.task.euc.hour);
//cron.on('day',cron.task.euc.day);
//cron.on('month',cron.task.euc.month);