// MIT License (c) 2024 enaon https://github.com/enaon
// see full license text at https://choosealicense.com/licenses/mit/

E.setConsole(Bluetooth, { force: true });
pinMode(D22, "opendrain_pullup");
pinMode(D23, "opendrain_pullup");
//main
scata = {
  state: {
    is: {
      sys: { busy: 0, run: 0, pause: 0, tap: 0, pwr: 0, cnt: 0, abort:0 },
      auto: { uvc: 0, empty: 0, light: 0 },
      pos: { lock: 0.2, ball: 0.45, flip: 0 },
      volt: { drop: 0, base: 0, min: 0, failed: 0, litres: 0 }
    },
    update: function() { require('Storage').write('scata.json', scata.state.def); },
    print: function() {
      Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-State:");
      Bluetooth.println("log- ","Sand Type :",scata.state.def.is.sand);
      Bluetooth.println("log- ","Sand Speed :",scata.state.def.sandType[scata.state.def.is.sand].speed);
      Bluetooth.println("log- ","Drop fail :",scata.state.def.is.fail);
      Bluetooth.println("log- ","Calibration :",scata.state.def.is.clb);
      Bluetooth.println("log- ","UV-C auto :",scata.state.def.auto.uvc);
      Bluetooth.println("log- ","Debug :",scata.state.def.is.dbg);
    },
    acc: function(v) {
      if (v) {
        scata.state.def.auto.clean=1;
        if (!scata.state.is.sys.busy) acc.wake(1);
      } else {
        scata.state.def.auto.clean=0;
        acc.sleep();
      }
    }
  },
  call: {
    move: function(pin, pos, range) {
      i = range ? 0.5 : 1;
      if (pos < 0) pos = 0;
      if (pos > 1 / i) pos = 1 / i;
      analogWrite(pin, (i + pos) / 50.0, { freq: 20, soft: false });
    },
    go: function(i) {
      if (ew.tid.scataI) { clearInterval(ew.tid.scataI);
        ew.tid.scataI = 0; }
      scata.state.is.pos.flip = 0;
      if (!i.speed) i.speed = 100;
      if (i.act == "Emptying") scata.state.is.volt.min = scata.state.is.volt.base;
      if (ew.tid.scataI) { clearInterval(ew.tid.scataI);
        ew.tid.scataI = 0; }
      ew.oled.msg(i.act, 1);
      ew.tid.scataI = setInterval(() => {
        scata.call.move(D22, scata.state.is.pos.ball, 1);
        if (i.act == "Emptying" && (ew.is.ondcVoltage() < scata.state.is.volt.min)) {
          scata.state.is.volt.min = ew.is.ondcVoltage();
        }
        if (i.act != "Lockcing")changeInterval(ew.tid.scataI, i.speed * scata.state.def.sandType[scata.state.def.is.sand].speed);
        if (!scata.state.is.pos.flip && i.one <= scata.state.is.pos.ball) { if (i.act1) { ew.oled.msg(i.act1, 1); if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: "+i.act1); } scata.state.is.pos.flip = 1; }
        else if (scata.state.is.pos.flip == 1 && scata.state.is.pos.ball <= i.two) scata.state.is.pos.flip = 0 <= i.three ? 2 : 3;
        else if (scata.state.is.pos.flip == 2 && i.three <= scata.state.is.pos.ball) scata.state.is.pos.flip = 3;
        else if (scata.state.is.pos.flip == 3) {
          clearInterval(ew.tid.scataI);
          ew.tid.scataI = 0;
          if (i.act == "Emptying") {
            if (scata.state.def.auto.uvc) scata.state.is.auto.uvc = 1;
            scata.state.is.volt.drop = scata.state.is.volt.base - scata.state.is.volt.min;
            scata.state.is.volt.litres = (scata.state.is.volt.drop * (40 - (scata.state.is.volt.drop * 50))).toFixed(1);
            if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: voltage drop "+scata.state.is.volt.drop.toFixed(3)+" V");
            if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: sand estimate "+scata.state.is.volt.litres+" litres");
          }
          if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: "+i.act+" done, running "+i.next);
          if (i.next) scata.action[i.next]();
        }
        //recovery
        if (ew.is.ondcVoltage() <= scata.state.def.is.fail || scata.state.is.sys.abort) {
          scata.state.is.volt.failed = ew.is.ondcVoltage();
          
          if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Error: power is down, waking up");
          clearInterval(ew.tid.scataI);
          ew.tid.scataI = 0;
          if (scata.state.is.sys.abort) scata.state.is.sys.abort=0;
          else scata.state.is.pos.ball = scata.state.is.pos.ball + (scata.state.is.pos.flip == 1 ? 0.25 : -0.25);
          scata.call.move(D22, scata.state.is.pos.ball, 1);
          if (ew.tid.scataT) { clearTimeout(ew.tid.scataT);
            ew.tid.scataT = 0; }
          ew.tid.scataT = setTimeout(() => {
            ew.tid.scataT = 0;
            scata.call.wake("recovery");
          }, 1000);
        }
        else if (!scata.state.is.sys.pause) scata.state.is.pos.ball = scata.state.is.pos.ball + (scata.state.is.pos.flip == 1 ? -0.01 : 0.01);
      }, i.speed);
    },
    wake: function(i, e) {
      scata.action.count("clear");
      if (ew.tid.scataT) { clearTimeout(ew.tid.scataT);ew.tid.scataT = 0; }
      if (i != "recovery" && ew.is.ondcVoltage() < 3.35) {
        if (3 <= ew.is.ondcVoltage()) {
          if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Error: low battery");
          ew.oled.msg("Low Battery");
        }
        else {
          if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Error: no drawer/power");
          ew.oled.msg("No Drawer/Power");
        }
        return;
      }
      scata.state.is.sys.pwr = 1;
      scata.state.is.sys.busy = 1;
      pinMode(D22, "opendrain_pullup");
      pinMode(D23, "opendrain_pullup");
      if (ew.is.ondcVoltage() <= 4.4 && 3.3 <= ew.is.ondcVoltage()) {
        if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: waking up");
        ew.oled.msg("Waking up");
        digitalPulse(D23, 1, [200, 100, 200]);
      }
      else if (4.4 <= ew.is.ondcVoltage()) {
        if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: power already on");
        
        if (i) {
          if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: starting "+ i+" "+(e ? e : ""));
          scata.action[i](e ? e : "");
        }else  scata.state.is.sys.busy = 0;
        return;
      }
      if (ew.tid.scataI) { clearInterval(ew.tid.scataI);
        ew.tid.scataI = 0; }
      ew.tid.scataI = setInterval(() => {
        if (4.4 <= ew.is.ondcVoltage()) {
          if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: power is on");
          if (ew.tid.scataT) { clearTimeout(ew.tid.scataT);
            ew.tid.scataT = 0; }
          clearInterval(ew.tid.scataI);
          ew.tid.scataI = 0;
          scata.state.is.sys.busy = 0;
          if (i) {
            if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: starting "+ i+" "+(e ? e : ""));
            scata.action[i](e ? e : "");
          }
        }
        else if (3 <= ew.is.ondcVoltage()) {
          if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: waiting for power");
          digitalPulse(D23, 1, 500);
        }
        else {
          if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Error: Drawer missing");
          ew.oled.msg("Drawer missing");
        }
      }, 1500);
    },
    unlock: function() {
      digitalPulse(D23, 1, 1.4);
      t = getTime() + 0.3;
      while (getTime() < t);
      digitalPulse(D23, 1, 1.4);
      t = getTime() + 1;
      while (getTime() < t);
      pinMode(D23, "opendrain_pullup");
    }
  },
  action: {
    count: function(i) {
      if (ew.tid.scataI) { clearInterval(ew.tid.scataI);
        scata.state.is.sys.cnt=0;
        ew.tid.scataI = 0; }
      if (i) { if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: clear counter"); return; }
      else if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: start counter");
      let v = 60*scata.state.def.auto.delay;
      scata.state.is.sys.busy = 0;
      ew.oled.msg("Hello Kitty");
      ew.tid.scataI = setInterval(() => {
        v--;
        ew.oled.msg((60*scata.state.def.auto.delay -3 <= v) ? "Hello Kitty" : "Empty in " + v);
        scata.state.is.sys.cnt=v;
        if (v ==(scata.state.def.auto.delay*60)-40 ) {
          if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: sleep counter");
          digitalPulse(D23, 0, [200, 300, 200, 300, 200]);
        }
        else if (v <= 0) {
          clearInterval(ew.tid.scataI);
          ew.tid.scataI = 0;
          scata.state.is.sys.cnt=0;
          if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: counter expired, staring");
          scata.call.wake("sand", "clean");
        }
        else if (v <= 5) {
          acc.sleep();
          buzzer([200, 100, 100]);
        }
      }, 1000);
    },
    sand: function(mode) {
      if (scata.state.is.sys.busy) return;
      scata.state.is.sys.busy = 1;
      scata.state.is.volt.base = ew.is.ondcVoltage();
      if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: acc sleep");
      acc.sleep();
      if (mode == "clean") {
        scata.state.is.sys.run++;
        mode = scata.state.def.sandType[scata.state.def.is.sand].name;
      } else if (mode == "empty") scata.state.is.sys.run = 0;
      scata.call.unlock();
      scata.call.go({ one: 0.52 + scata.state.def.is.clb, two: 0.30 + scata.state.def.is.clb, three: 0.38 + scata.state.def.is.clb, act: "Unlocking", next: mode });
    },
    // trigger uvc light
    uvc: () => { scata.call.go({ one: 0.85 + scata.state.def.is.clb, two: 0.65, act: "Turn on UVC", act1: "Returning ", next: "lock", speed: 70 }); },
    // fine grain betonite sand
    betonite: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 0, three: 0.65, act: "Emptying", act1: "Returning ", next: "lock", speed: 100 }); },
    // standard non-stick sand
    nonstick: () => { scata.call.go({ one: 1 + scata.state.def.is.clb, two: 0 , three: 1.2, act: "Preparing", next: "nonstick_1", speed: 80 }); },
    nonstick_1: () => { scata.call.go({ one: 1.4 + scata.state.def.is.clb, two: 1.3, three: 1.4 , act: "Step 1", act2: "Returning", next: "nonstick_2", speed: 110 }); },
    nonstick_2: () => { scata.call.go({ one: 1.5 + scata.state.def.is.clb, two: 1.4, three: 1.5 , act: "Step 2", act2: "Returning", next: "nonstick_3", speed: 110 }); },
    nonstick_3: () => { scata.call.go({ one: 1.6 + scata.state.def.is.clb, two: 1.5, three: 1.6 , act: "Step 3", act2: "Returning", next: "nonstick_4", speed: 110 }); },
    nonstick_4: () => { scata.call.go({ one: 1.7 + scata.state.def.is.clb, two: 1.6, three: 1.7 , act: "Step 4", act2: "Returning", next: "nonstick_5", speed: 110 }); },
    nonstick_5: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 0, three: 0.65 , act: "Emptying", act2: "Returning", next: "lock", speed: 100 }); },


    //nonstick_1: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 1.9, act: "Emptying", act2: "Returning", next: "nonstick_2", speed: 150 }); },
    //nonstick_2: () => { scata.call.go({ one: 1.9 + scata.state.def.is.clb, two: 0, three: 0.65, act: "Returning", act2: "Returning", next: "lock", speed: 100 }); },

    // light crystalic silicone sand
    silicone: () => { scata.call.go({ one: 1.6 + scata.state.def.is.clb, two: 0.6 + scata.state.def.is.clb, act: "Getting ready", next: "silicone1", speed: 100 }); },
    silicone1: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 1.9 + scata.state.def.is.clb, act: "Emptying", next: "silicone_return", speed: 150 }); },
    silicone_return: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 0, act: "Returning", next: "silicone_return1", speed: 100 }); },
    silicone_return1: () => { scata.call.go({ one: 0.1, two: 0, act: "Leveling", next: "silicone_return2", speed: 80 }); },
    silicone_return2: () => { scata.call.go({ one: 0.1, two: 0, act: "Leveling", next: "silicone_return3", speed: 80 }); },
    silicone_return3: () => { scata.call.go({ one: 0.1, two: 0, act: "Leveling", next: "silicone_return4", speed: 50 }); },
    silicone_return4: () => { scata.call.go({ one: 0.1, two: 0, act: "Leveling", next: "silicone_return5", speed: 80 }); },
    silicone_return5: () => { scata.call.go({ one: 0.8, two: 0.65, act: "Leveling", next: "lock", speed: 100 }); },
    // empty sand
    empty: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 0.65, act: "Emptying Sand", next: "empty1" }); },
    empty1: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 0.65, act: "Take 2", next: "empty2", speed: 50 }); },
    empty2: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 0.65, act: "Take 3", next: "empty3", speed: 50 }); },
    empty3: () => { scata.call.go({ one: 2, two: 0.65, act: "Returning", next: "lock", speed: 100 }); },
    recovery: function() {
      scata.call.unlock();
      t = getTime() + 1;
      while (getTime() < t);
      scata.call.go({ one: 0.45, two: 0, three: 0.65, act: "recover", next: "lock" });
    },
    lock: function() {
      D23.reset();
      digitalPulse(D23, 1, 2.2);
      scata.call.go({ one: 0.65, two: 0.28 + scata.state.def.is.clb, three: 0.45 + scata.state.def.is.clb, act: "Lockcing", next: "sleep" });
    },
    //
    sleep: function() {
      scata.state.is.sys.busy = 1;
      if (ew.tid.scataT) { clearTimeout(ew.tid.scataT);
        ew.tid.scataT = 0; }
      if (ew.tid.scataI) { clearInterval(ew.tid.scataI);
        ew.tid.scataI = 0; }
      //scata.state.is.sys.busy = 0;
      ew.oled.msg("Going to Sleep", 1);
      scata.state.is.sys.tap = 0;
      digitalPulse(D23, 1, [200, 200, 200, 200]);
      if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: going to sleep");
      ew.tid.scataT = setTimeout(() => {
        ew.tid.scataT = 0;
        if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: acc wake");
        ew.oled.msg(scata.state.is.volt.litres + " Litres");
        if (scata.state.def.auto.clean) acc.wake(1);
        if (3 <= ew.is.ondcVoltage() && ew.is.ondcVoltage() <= 4.4) {
          scata.state.is.sys.pwr=0;
          poke32(0x50000700 + 22 * 4, 2);
          poke32(0x50000700 + 23 * 4, 2);
        }
        scata.state.is.sys.busy = 0;
        if (scata.state.is.auto.uvc) {
          scata.state.is.auto.uvc = 0;
          ew.tid.scataT = setTimeout(() => {
            ew.tid.scataT = 0;
            scata.call.wake("sand", "uvc");
          }, 180000);
        }
      }, 1500);
    }
  }
};
//events
//BT

/*
status=Idle|on|busy
powerbank=percentage|voltage
controler=percentage|voltage
auto=1|0
mode=


*/

NRF.setServices({
	0xffa0: {
		0xffa1: {
			value: [0x01],
			maxLen: 20,
			writable: false,
			readable: true,
			notify: true,
			description: "status"
		},
		0xffa2: {
			value: [0x01],
			maxLen: 20,
			writable: false,
			readable: true,
			notify: true,
			description: "powerbank"
		},
		0xffa3: {
			value: [0x01],
			maxLen: 20,
			writable: false,
			readable: true,
			notify: true,
			description: "controler"
		},
		0xffa4: {
			value: [0x01],
			maxLen: 20,
			writable: true,
			onWrite: function(evt) {
				ew.emit("BTRX",E.toString(evt.data));
			},
			readable: true,
			notify: true,
			description: "auto"
		},
		0xffa5: {
			value: [0x01],
			maxLen: 20,
			writable: true,
			onWrite: function(evt) {
				ew.emit("BTRX",E.toString(evt.data));
			},
			readable: true,
			notify: true,
			description: "mode"
		},
		0xffa6: {
			value: [0x01],
			maxLen: 20,
			writable: true,
			readable: true,
			notify: true,
			description: "action"
		},
		0xffa7: {
			value: [0x01],
			maxLen: 20,
			writable: true,
			readable: true,
			notify: true,
			description: "save"
		},
		0xffa8: {
			value: [0x01],
			maxLen: 20,
			writable: true,
			onWrite: function(evt) {
        ew.emit("BTRX",E.toString(evt.data));
      },
			readable: true,
			notify: true,
			description: "debug"
		},					
		0xffa9: {
			value: [0x01],
			maxLen: 20,
			writable: false,
			readable: true,
			notify: true,
			description: "log"
		}
	}
}, { advertise: ['0xffa0'], uart: true });
			
ew.on("BTRX", (i) => {
  //eval(i);
  ew.oled.msg("yes master");
  NRF.updateServices({0xffa0:{0xffa5:{value:E.toString(i),notify:true}} });

});
// button
ew.on("button", (x) => {
  if (scata.state.is.sys.busy) {
    if (x == "long") {
      ew.oled.msg(scata.state.is.sys.pause ? "Resume" : "Pause", 1);
      scata.state.is.sys.pause = 1 - scata.state.is.sys.pause;
      return;
    }
    buzzer(300);
    ew.oled.msg("I am busy", 1);
    return;
  }
  if (x == "double") {
    ew.oled.msg(scata.state.is.sys.run + "-" + ew.is.batt(1) + " %", 1, ew.is.ondcVoltage(4) + "% - " + ew.is.ondcVoltage().toFixed(2) + "V");
  }
  else if (x == "short") {
    ew.oled.msg(4.4 <= ew.is.ondcVoltage() ? "Going to sleep" : "Waiking up");
    if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: button single tap");
    //digitalPulse(D23, ew.is.charging() ? 0 : 1, [200, 200, 200]);
    4.4 <= ew.is.ondcVoltage() ? scata.action.sleep() : scata.call.wake();
  }
  else if (x == "triple") {
    buzzer([80, 80, 100, 80, 100]);
    if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: button triple tap");
    scata.call.wake("sand", "uvc");
  }
  else if (x == "long") {
    buzzer([80, 80, 100]);
    if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: button long hold");
    scata.call.wake("sand", "clean");
  }
});
//accelerator
acc.on("action", (x, y) => {
  if (y == 1 || y == 2) {
    if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: acc event "+x+" "+y);
    scata.state.is.sys.tap = 5;
    if (ew.tid.scataT) { clearTimeout(ew.tid.scataT);
      ew.tid.scataT = 0; }
    ew.tid.scataT = setTimeout(() => {
      ew.tid.scataT = 0;
      scata.call.wake("count");
    }, 500);
  }
  else if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: acc event "+x+" "+y+" ignored");
});
//cron
cron.on('hour', (x) => {
  //Bluetooth.println("log- ","hour",x);
  if (scata.state.is.sys.busy) {
    if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: cron event ignored");
    return;
  }
  if (ew.is.batt(1) <= 50 && ew.is.ondcVoltage() <= 4.4) {
    if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: cron event power on");
    scata.call.wake();
  }
  else if (100 <= ew.is.batt(1) && 4.4 <= ew.is.ondcVoltage()) {
    if (scata.state.def.is.dbg) Bluetooth.println("log- "+Date().toString().split(' ')[4]+" "+ "scata-Info: cron event power off");
    scata.action.sleep();
  }
});
//defaults
if (!require('Storage').read("scata.json"))
  scata.state.def = {
    is: {
      sand: 1,
      fail: (ew.def.name == "eL-6f") ? 4.4 : 4.2,
      clb: (ew.def.name == "eL-6f") ? 0 : -0.03,
      dbg: 1
    },
    auto: {
      uvc: 1, clean: 1, delay: 3,
      every: { on: 0, hours:[2,8,15,20] },
      light: { on: 0, dur: 0, time: 0 }
    },
    sandType: {
      1: { name: "betonite", speed: 1 },
      2: { name: "silicone", speed: 1 },
      3: { name: "nonstick", speed: 1 },
      4: { name: "tofu", speed: 1 }
    },
  };
else scata.state.def = require('Storage').readJSON("scata.json");
//init
ew.tid.scataT = setTimeout(() => {
  ew.tid.scataT = 0;
  NRF.restart();
  //ew.updateBT();
  NRF.setTxPower(4);
  clearWatch(ew.tid.charge);
  ew.tid.charge = 0;
  ew.oled.off();
  if (scata.state.def.auto.clean) acc.wake(1);
}, 4000);
