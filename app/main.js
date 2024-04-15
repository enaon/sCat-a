// MIT License (c) 2024 enaon https://github.com/enaon
// see full license text at https://choosealicense.com/licenses/mit/

E.setConsole(Bluetooth, { force: true });
pinMode(D22, "opendrain_pullup");
pinMode(D23, "opendrain_pullup");
//main
scata = {
  state: {
    is: {
      sys: { busy: 0, run: 0, pause: 0, tap: 0, pwr: 0, cnt: 0, abort: 0 },
      auto: { uvc: 0, empty: 0, light: 0 },
      pos: { lock: 0.2, ball: 0.45, flip: 0 },
      volt: { drop: 0, base: 0, min: 0, failed: 0, litres: 0 }
    },
    update: function() { require('Storage').write('scata.json', scata.state.def); },
    print: function() {
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "lt=" + scata.state.is.volt.litres, notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "rtod=" + scata.state.is.sys.run, notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "rtot=" + (scata.state.is.sys.run + scata.state.def.is.total), notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "ps=" + scata.state.is.sys.pause, notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "sp=" + scata.state.def.is.sand, notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "ss=" + (19 - (scata.state.def.sandType[scata.state.def.is.sand].speed * 10)), notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "ac=" + scata.state.def.auto.clean, notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "ad=" + scata.state.def.auto.delay, notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "au=" + scata.state.def.auto.uvc, notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "vp=" + ew.is.ondcVoltage(), notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "pp=" + ew.is.ondcVoltage(1), notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "vc=" + ew.is.batt(), notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "dt=" + Date().toString().split(' ')[4], notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "pwr=" + scata.state.is.sys.pwr, notify: true } } });
      NRF.updateServices({ 0xffa0: { 0xffa2: { value: "busy=" + scata.state.is.sys.busy, notify: true } } });
    },
    nrfUpdate: function(v) {
      if (!scata.state.is.nrf) return;
    },
    acc: function(v) {
      if (v) {
        scata.state.def.auto.clean = 1;
        if (!scata.state.is.sys.busy) acc.wake(1);
      }
      else {
        scata.state.def.auto.clean = 0;
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
      scata.state.is.sys.abort = 0;
      scata.state.is.pos.flip = 0;
      if (!i.speed) i.speed = 100;
      if (i.act == "Emptying") scata.state.is.volt.min = scata.state.is.volt.base;
      if (ew.tid.scataI) {
        clearInterval(ew.tid.scataI);
        ew.tid.scataI = 0;
      }
      ew.oled.msg(i.act, 1);
      ew.tid.scataI = setInterval(() => {
        scata.call.move(D22, scata.state.is.pos.ball, 1);
        if (i.act == "Emptying" && (ew.is.ondcVoltage() < scata.state.is.volt.min)) {
          scata.state.is.volt.min = ew.is.ondcVoltage();
        }
        //set custom movement speed
        if (i.act != "Lockcing") changeInterval(ew.tid.scataI, i.speed * scata.state.def.sandType[scata.state.def.is.sand].speed);
        //set movement direction
        if (!scata.state.is.pos.flip && i.one <= scata.state.is.pos.ball) {
          if (i.act1) {
            ew.oled.msg(i.act1, 1);
            if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString(i.act1), notify: true } } });
          }
          scata.state.is.pos.flip = 1;
        }
        else if (scata.state.is.pos.flip == 1 && scata.state.is.pos.ball <= i.two) scata.state.is.pos.flip = 0 <= i.three ? 2 : 3;
        else if (scata.state.is.pos.flip == 2 && i.three <= scata.state.is.pos.ball) scata.state.is.pos.flip = 3;
        else if (scata.state.is.pos.flip == 3) {
          clearInterval(ew.tid.scataI);
          ew.tid.scataI = 0;
          if (i.act == "Emptying") {
            if (scata.state.def.auto.uvc) scata.state.is.auto.uvc = 1;
            scata.state.is.volt.drop = scata.state.is.volt.base - scata.state.is.volt.min;
            scata.state.is.volt.litres = (scata.state.is.volt.drop * (40 - (scata.state.is.volt.drop * 50))).toFixed(1);
          }
          if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString(i.act + " done"), notify: true } } });
          if (i.next) {
            //NRF.updateServices({0xffa0:{0xffa1:{value:E.toString(i.next),notify:true}} });
            scata.action[i.next]();
          }
        }
        //recovery
        if (ew.is.ondcVoltage() <= scata.state.def.is.fail || scata.state.is.sys.abort) {
          scata.state.is.volt.failed = ew.is.ondcVoltage();
          if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("power down-recovery"), notify: true } } });
          clearInterval(ew.tid.scataI);
          ew.tid.scataI = 0;
          if (!scata.state.is.sys.abort) {
            scata.state.is.pos.ball = scata.state.is.pos.ball + (scata.state.is.pos.flip == 1 ? 0.25 : -0.25);
            scata.call.move(D22, scata.state.is.pos.ball, 1);
          }
          if (ew.tid.scataT) {
            clearTimeout(ew.tid.scataT);
            ew.tid.scataT = 0;
          }
          ew.tid.scataT = setTimeout(() => {
            ew.tid.scataT = 0;
            scata.call.wake("recovery");
          }, 1000);
        }
        else if (!scata.state.is.sys.pause) scata.state.is.pos.ball = scata.state.is.pos.ball + (scata.state.is.pos.flip == 1 ? -0.01 : 0.01);
        if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa2: { value: "pos=" + (scata.state.is.pos.ball * 100).toString(), notify: true } } });
      }, i.speed);
    },
    wake: function(i, e) {
      scata.action.count("clear");
      if (ew.tid.scataT) { clearTimeout(ew.tid.scataT);
        ew.tid.scataT = 0; }
      if (i != "recovery" && ew.is.ondcVoltage() < 3.35) {
        if (3 <= ew.is.ondcVoltage()) {
          if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("low battery"), notify: true } } });
          ew.oled.msg("Low Battery");
        }
        else {
          if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("no drawer/power"), notify: true } } });
          ew.oled.msg("No Drawer/Power");
        }
        return;
      }
      scata.state.is.sys.pwr = 1;
      //scata.state.is.sys.busy = 1;
      pinMode(D22, "opendrain_pullup");
      pinMode(D23, "opendrain_pullup");
      if (ew.is.ondcVoltage() <= 4.4 && 3.3 <= ew.is.ondcVoltage()) {
        if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("waking up"), notify: true } } });
        ew.oled.msg("Waking up");
        digitalPulse(D23, 1, [200, 100, 200]);
      }
      else if (4.4 <= ew.is.ondcVoltage()) {
        if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("power already on"), notify: true } } });

        if (i) {
          if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("starting " + i + " " + (e ? e : "")), notify: true } } });

          scata.action[i](e ? e : "");
        } //else  scata.state.is.sys.busy = 0;
        return;
      }
      if (ew.tid.scataI) {
        clearInterval(ew.tid.scataI);
        ew.tid.scataI = 0;
      }
      ew.tid.scataI = setInterval(() => {
        if (4.4 <= ew.is.ondcVoltage()) {
          if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("power is on"), notify: true } } });
          //  
          if (ew.tid.scataT) {
            clearTimeout(ew.tid.scataT);
            ew.tid.scataT = 0;
          }
          clearInterval(ew.tid.scataI);
          ew.tid.scataI = 0;
          if (i) {
            if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("starting " + i + " " + (e ? e : "")), notify: true } } });
            scata.action[i](e ? e : "");
          } //else  scata.state.is.sys.busy = 0;
        }
        else if (3 <= ew.is.ondcVoltage()) {
          if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("waiting for power"), notify: true } } });
          digitalPulse(D23, 1, 500);
        }
        else {
          if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("Drawer missing"), notify: true } } });
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
      if (ew.tid.scataI) {
        clearInterval(ew.tid.scataI);
        scata.state.is.sys.cnt = 0;
        ew.tid.scataI = 0;
      }
      if (i) {
        if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("Clear counter"), notify: true } } });
        return;
      }
      else {
        if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("Start counter"), notify: true } } });
      }
      let v = 60 * scata.state.def.auto.delay;
      //scata.state.is.sys.busy = 0;
      ew.oled.msg("Hello Kitty");
      ew.tid.scataI = setInterval(() => {
        v--;
        ew.oled.msg((60 * scata.state.def.auto.delay - 3 <= v) ? "Hello Kitty" : "Empty in " + v);
        scata.state.is.sys.cnt = v;
        if (v == (scata.state.def.auto.delay * 60) - 40)
          digitalPulse(D23, 0, [200, 300, 200, 300, 200]);
        else if (v <= 0) {
          clearInterval(ew.tid.scataI);
          ew.tid.scataI = 0;
          scata.state.is.sys.cnt = 0;
          if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("Counter expired"), notify: true } } });
          scata.call.wake("sand", "clean");
        }
        else if (v <= 5) {
          acc.sleep();
          buzzer([200, 100, 100]);
        }
      }, 1000);
    },
    sand: function(mode) {
      // if (scata.state.is.sys.busy) return;
      scata.state.is.sys.busy = 1;
      scata.state.is.volt.base = ew.is.ondcVoltage();
      if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("Acc sleep"), notify: true } } });
      acc.sleep();
      if (mode == "clean") {
        scata.state.is.sys.run++;
        mode = scata.state.def.sandType[scata.state.def.is.sand].name;
      }
      else if (mode == "empty") scata.state.is.sys.run = 0;
      scata.call.unlock();
      scata.call.go({ one: 0.52 + scata.state.def.is.clb, two: 0.30 + scata.state.def.is.clb, three: 0.38 + scata.state.def.is.clb, act: "Unlocking", next: mode });
    },
    //ball movement patterns
    // trigger uvc light
    uvc: () => { scata.call.go({ one: 0.85 + scata.state.def.is.clb, two: 0.65, act: "Turn on UVC", act1: "Returning ", next: "lock", speed: 70 }); },
    // fine grain betonite sand
    betonite: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 0, three: 0.65, act: "Emptying", act1: "Returning ", next: "lock", speed: 100 }); },
    // standard non-stick sand
    nonstick: () => { scata.call.go({ one: 1 + scata.state.def.is.clb, two: 0, three: 1.2, act: "Preparing", next: "nonstick_1", speed: 80 }); },
    nonstick_1: () => { scata.call.go({ one: 1.4 + scata.state.def.is.clb, two: 1.3, three: 1.4, act: "Step 1", act2: "Returning", next: "nonstick_2", speed: 110 }); },
    nonstick_2: () => { scata.call.go({ one: 1.5 + scata.state.def.is.clb, two: 1.4, three: 1.5, act: "Step 2", act2: "Returning", next: "nonstick_3", speed: 110 }); },
    nonstick_3: () => { scata.call.go({ one: 1.6 + scata.state.def.is.clb, two: 1.5, three: 1.6, act: "Step 3", act2: "Returning", next: "nonstick_4", speed: 110 }); },
    nonstick_4: () => { scata.call.go({ one: 1.7 + scata.state.def.is.clb, two: 1.6, three: 1.7, act: "Step 4", act2: "Returning", next: "nonstick_5", speed: 110 }); },
    nonstick_5: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 0, three: 0.65, act: "Emptying", act2: "Returning", next: "lock", speed: 100 }); },
    // light crystalic silicone sand
    silicone: () => { scata.call.go({ one: 1 + scata.state.def.is.clb, two: 0, three: 1.2, act: "Preparing", next: "silicone1", speed: 80 }); },
    silicone1: () => { scata.call.go({ one: 1.4 + scata.state.def.is.clb, two: 1.3, three: 1.4, act: "Step 1", act2: "Returning", next: "silicone2", speed: 110 }); },
    silicone2: () => { scata.call.go({ one: 1.5 + scata.state.def.is.clb, two: 1.4, three: 1.5, act: "Step 2", act2: "Returning", next: "silicone3", speed: 110 }); },
    silicone3: () => { scata.call.go({ one: 1.6 + scata.state.def.is.clb, two: 1.5, three: 1.6, act: "Step 3", act2: "Returning", next: "silicone4", speed: 110 }); },
    silicone4: () => { scata.call.go({ one: 1.7 + scata.state.def.is.clb, two: 1.6, three: 1.7, act: "Step 4", act2: "Returning", next: "silicone5", speed: 110 }); },
    silicone5: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 0, three: 0.65, act: "step5", act2: "Returning", next: "silicone6", speed: 100 }); },
    silicone6: () => { scata.call.go({ one: 1 + scata.state.def.is.clb, two: 0, three: 0.65, act: "Emptying", act2: "Returning", next: "lock", speed: 100 }); },

  /*  silicone: () => { scata.call.go({ one: 1.6 + scata.state.def.is.clb, two: 0.6 + scata.state.def.is.clb, act: "Getting ready", next: "silicone1", speed: 100 }); },
    silicone1: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 1.9 + scata.state.def.is.clb, act: "Emptying", next: "silicone_return", speed: 150 }); },
    silicone_return: () => { scata.call.go({ one: 2 + scata.state.def.is.clb, two: 0, act: "Returning", next: "silicone_return1", speed: 100 }); },
    silicone_return1: () => { scata.call.go({ one: 0.1, two: 0, act: "Leveling", next: "silicone_return2", speed: 80 }); },
    silicone_return2: () => { scata.call.go({ one: 0.1, two: 0, act: "Leveling", next: "silicone_return3", speed: 80 }); },
    silicone_return3: () => { scata.call.go({ one: 0.1, two: 0, act: "Leveling", next: "silicone_return4", speed: 50 }); },
    silicone_return4: () => { scata.call.go({ one: 0.1, two: 0, act: "Leveling", next: "silicone_return5", speed: 80 }); },
    silicone_return5: () => { scata.call.go({ one: 0.8, two: 0.65, act: "Leveling", next: "lock", speed: 100 }); },
*/

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
      //scata.state.is.sys.busy = 1;
      if (ew.tid.scataT) {
        clearTimeout(ew.tid.scataT);
        ew.tid.scataT = 0;
      }
      if (ew.tid.scataI) {
        clearInterval(ew.tid.scataI);
        ew.tid.scataI = 0;
      }
      //scata.state.is.sys.busy = 0;
      ew.oled.msg("Going to Sleep", 1);
      scata.state.is.sys.tap = 0;
      digitalPulse(D23, 1, [500, 100, 500, 100]);
      if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("going to sleep"), notify: true } } });
      ew.tid.scataT = setTimeout(() => {
        ew.tid.scataT = 0;
        if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("acc wake"), notify: true } } });
        ew.oled.msg(scata.state.is.volt.litres + " Litres");
        if (scata.state.def.auto.clean) acc.wake(1);
        if (3 <= ew.is.ondcVoltage() && ew.is.ondcVoltage() <= 4.4) {
          if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("sleeping"), notify: true } } });
          scata.state.is.sys.pwr = 0;
          poke32(0x50000700 + 22 * 4, 2);
          poke32(0x50000700 + 23 * 4, 2);
        }
        else {
          if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("no sleep"), notify: true } } });
        }
        scata.state.is.sys.busy = 0;
        if (scata.state.is.auto.uvc) {
          if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("uvc wake scheduled"), notify: true } } });
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
//BT service
NRF.setServices({
  0xffa0: {
    0xffa1: {
      value: [0x01],
      maxLen: 20,
      writable: true,
      onWrite: function(evt) {
        ew.emit("BTRXcmd", E.toString(evt.data));
      },
      readable: true,
      notify: true,
      description: "status"
    },
    0xffa2: {
      value: [0x01],
      maxLen: 20,
      writable: true,
      onWrite: function(evt) {
        ew.emit("BTRX", E.toString(evt.data));
      },
      readable: true,
      notify: true,
      description: "position"
    }
  }
}, { advertise: ['0xffa0'], uart: true });
//BT
ew.on("BTRXcmd", (i) => {
  if (i.startsWith(1)) {
    if (i == 11) ew.emit('button', 'short');
    else if (i == 12) ew.emit('button', 'long');
    else if (i == 13) ew.emit('button', 'triple');
    else if (i == 14) scata.state.print();
    else if (i.startsWith(16)) setTime(Number(i.split("=")[1] / 1000));
    else if (i.startsWith(17)) {
      scata.state.def.is.tz = i.split("=")[1];
      E.setTimeZone(scata.state.def.is.tz);
    }
    else if (i == 18) scata.state.is.sys.abort = 1;
    else if (i == 19) scata.state.update();
  }
  else if (i.startsWith(3)) scata.state.def.sandType[scata.state.def.is.sand].speed = (19 - (i - 30)) / 10;
  else if (i.startsWith(4)) scata.state.def.is.sand = i - 40;
  else if (i.startsWith(5)) scata.state.def.auto.uvc = i - 50
  else if (i.startsWith(6)) scata.state.def.auto.delay = i - 60;
  else if (i.startsWith(7)) scata.state.def.auto.clean = i - 70;
  else if (i.startsWith(8)) scata.state.is.sys.pause = i - 80;
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
    4.4 <= ew.is.ondcVoltage() ? scata.action.sleep() : scata.call.wake();
  }
  else if (x == "triple") {
    buzzer([80, 80, 100, 80, 100]);
    scata.call.wake("sand", "empty");
  }
  else if (x == "long") {
    buzzer([80, 80, 100]);
    scata.call.wake("sand", "clean");
  }
});
//accelerator
acc.on("action", (x, y) => {
  if (y == 1 || y == 2) {
    scata.state.is.sys.tap = 5;
    if (ew.tid.scataT) {
      clearTimeout(ew.tid.scataT);
      ew.tid.scataT = 0;
    }
    ew.tid.scataT = setTimeout(() => {
      ew.tid.scataT = 0;
      scata.call.wake("count");
    }, 500);
  }
});
//cron
cron.on('hour', (x) => {
  //console.log("log- ","hour",x);
  if (scata.state.is.nrf) NRF.updateServices({ 0xffa0: { 0xffa1: { value: E.toString("hour :" + x), notify: true } } });
  if (x == 0) {
    scata.state.def.is.total = scata.state.is.sys.run;
    scata.state.is.sys.run = 0;
    scata.state.update();
  }
  if (scata.state.is.sys.busy) return;
  if (ew.is.batt(1) <= 50 && ew.is.ondcVoltage() <= 4.4) scata.call.wake();
  else if (100 <= ew.is.batt(1) && 4.4 <= ew.is.ondcVoltage()) scata.action.sleep();
});
//defaults
if (!require('Storage').read("scata.json"))
  scata.state.def = {
    is: {
      sand: 1,
      fail: (ew.def.name == "eL-6f") ? 4.4 : 4.2,
      clb: (ew.def.name == "eL-6f") ? 0 : -0.03,
      tz: 3,
      total: 0
    },
    auto: {
      uvc: 1,
      clean: 1,
      delay: 3,
      every: { on: 0, hours: [2, 8, 15, 20] },
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
  E.setTimeZone(scata.state.def.is.tz);

  NRF.on('disconnect', function() {
    if (ew.tid.nrf) { clearInterval(ew.tid.nrf);
      ew.tid.nrf = 0; }
    scata.state.is.nrf = 0;
  });
  NRF.on('connect', function() {
    if (ew.tid.nrf) clearInterval(ew.tid.nrf);
    scata.state.is.nrf = 1;
    ew.tid.nrf = setInterval(function() {
      scata.state.print();
    }, 1000);
  });

  scata.state.is.nrf = 1;
  ew.tid.scataT = 0;
  NRF.restart();
  //ew.updateBT();
  NRF.setTxPower(4);
  clearWatch(ew.tid.charge);
  ew.tid.charge = 0;
  ew.oled.off();
  scata.action.sleep();
}, 1000);
