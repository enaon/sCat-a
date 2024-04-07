//dsd6 acc handler 
var i2c=new I2C();
//var i2c=I2C1;
var acc={
	state:0,
	init:function(){
		i2c.setup({scl:13, sda:14, bitrate:100000});
	},
	read:function(reg,len){i2c.writeTo(0x1f,reg);return i2c.readFrom(0x1f,len);},
	write:function(reg,data){i2c.writeTo(0x1f,reg,data);},
	regDump:function(reg){
		val=acc.read(reg,1)[0];return val.toString(10)+" 0x"+val.toString(16)+" %"+val.toString(2);
	},
	coords:function(){
		coords=new Int16Array(acc.read(0x06,6).buffer);
		return {x:coords[0],y:coords[1],z:coords[2]};
	},
	wake:function(i){
		if (ew.tid.acc) {clearWatch(ew.tid.acc);ew.tid.acc=0;}
		//acc.init();
		acc.write(0x7f,0x00); 
		acc.write(0x19,0x00); 7
		acc.write(0x19,0x80);
		if (i==3){
			acc.write(0x18,0x42); //standby mode-high current-int1-2g-motion detect
			acc.write(0x1f,0x02); //motion report on int1
			acc.write(0x1c,0x30); //enable int1
			acc.write(0x18,0x62); //opp mode-hi current-int1-2g-motion detect

			
		}
		else if (i==2) {
			acc.write(0x18,0x45); //standby mode-high current-int1-2g-tap-tilt
			acc.write(0x22,0x01); //tilt
			acc.write(0x19,0x10); //enable face up
			acc.write(0x32,0x0C); //22 degrees
			//acc.write(0x32,0x03); //6 degrees
			acc.write(0x1f,0x05); //tap-tilt report on int1
			acc.write(0x1c,0x30); //enable int1
			acc.write(0x18,0xC5); //opp mode-high current-int1-2g-tap-tilt-enable
		}else if (i==1){
//			acc.write(0x18,0x44); //standby mode-high current-int1-2g-tap
//			acc.write(0x18,0x4C); //standby mode-high current-int1-4g-tap
//			acc.write(0x18,0x5C); //standby mode-high current-int1-8g-tap
			acc.write(0x18,0x04); //standby mode-low current-int1-2g-tap

			acc.write(0x1f,0x04); //tap report on int1
//			acc.write(0x1f,0x06); //tap-motion report on int1
			acc.write(0x1c,0x30); //enable int1
			acc.write(0x18,0x84); //opp mode-low current-int1-2g-tap
//			acc.write(0x18,0xC4); //opp mode-high current-int1-2g-tap
//			acc.write(0x18,0xCC); //opp mode-high current-int1-4g-tap
//			acc.write(0x18,0xDC); //opp mode-high current-int1-8g-tap

		} else {
			acc.write(0x18,0x41); //standby mode-high current-int1-2g-tilt
			acc.write(0x22,0x01); //tilt
			acc.write(0x19,0x10);
			acc.write(0x32,0x0C); //22 degrees
			//acc.write(0x32,0x03); //6 degrees
			acc.write(0x1f,0x01); //tilt report on int1
			acc.write(0x1c,0x30); //enable int1
			acc.write(0x18,0xC1); //opp mode-high current-int1-2g-tilt
		}		
		this.state=i?i:5;
		ew.tid.acc=setWatch(function(s){
			if (s.state){
				//console.log((acc.read(17,3)));
				let state=acc.read(17,3);
				if (state[2]==1) {
					if (state[0]==32||state[0]==4||state[0]==8) {
						acc.write(0x19,0x2c);
						acc.emit("action","face",1);
					}else {
						acc.write(0x19,0x10);
						acc.emit("action","face",0);
					}
				}else {
					if  (state[2]==4) {
						acc.emit("action","tap",state[1]);
					}else
						acc.emit("action","double",state[1]);
					}
			}
			acc.regDump(0x17);
		},D15,true);  
	},
	sleep:function(app){
		this.state=0;
		
		if (ew.tid.acc) {clearWatch(ew.tid.acc);ew.tid.acc=0;}
		acc.write(0x7f,0x00); 
		acc.write(0x18,0x00); 
		acc.write(0x19,0x00); 
		acc.write(0x19,0x80);
//		acc.write(0x1A,0x00); //cntrl3 slow
	}
};
acc.init();
//acc.sleep();