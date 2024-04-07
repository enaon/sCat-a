E.setConsole(Bluetooth, { force: true });
pinMode(D22, "opendrain_pullup");
pinMode(D23, "opendrain_pullup");

scata = {
  clb: (ew.def.name == "eL-6f") ? 0 : -0.03,
  state: { busy: 0, run: 0, tap: 0, dbg: 1, lock: 1, ball: 0, recovery: 0 },
  pos: { lock: 0.2, ball: 0.2, flip: 0 },
  volt: { drop: {}, base: 0, min: 0 },
  tid: {},
  move: function(pin, pos, range) {
    i = range ? 0.5 : 1;
    if (pos < 0) pos = 0;
    if (pos > 1 / i) pos = 1 / i;
    analogWrite(pin, (i + pos) / 50.0, { freq: 20, soft: false });
  },
  count: function(i) {
    if (scata.tid.cntdn) {
      clearInterval(scata.tid.cntdn);
      scata.tid.cntdn = 0;
    }
    if (i) { if (scata.state.dbg) print("scata-Info: clear counter"); return; }
    if (scata.state.dbg) print("scata-Info: start counter");
    scata.wake();
    let v = 121;
    ew.oled.msg("Hello Kitty");
    scata.tid.cntdn = setInterval(() => {
      v--;
      ew.oled.msg((118 <= v) ? "Hello Kitty" : "Empty in " + v);
      if (v == 90 && ew.def.name != "eL-6f") {
        if (scata.state.dbg) print("scata-Info: sleep counter");
        digitalPulse(D23, 0, [200, 300, 200, 300, 200]);
      }
      if (v <= 5) {
        acc.sleep();
        buzzer([200, 100, 100]);
      }
      if (v <= 0) {
        clearInterval(scata.tid.cntdn);
        scata.tid.cntdn = 0;
        //acc.sleep();
        if (scata.state.dbg) print("scata-Info: counter expired, staring");
        scata.wake("empty");
      }
    }, 1000);
  },
  go: function(i) {
    scata.pos.flip = 0;
    if (!i.speed) i.speed = 100;
    //scata.volt.base = ew.is.ondcVoltage();
    scata.volt["min" + i.act] = scata.volt.base;
    if (scata.tid.move) { clearInterval(scata.tid.move); }
    ew.oled.msg(i.act, 1);
    scata.tid.move = setInterval(() => {
      scata.pos.ball = scata.pos.ball + (scata.pos.flip == 1 ? -0.01 : 0.01);
      scata.move(D22, scata.pos.ball, 1);
      //if (scata.state.dbg) print("move : " + scata.pos.ball, scata.pos.flip);
      if (!scata.pos.flip && i.one <= scata.pos.ball) { if (i.act1) { ew.oled.msg(i.act1, 1); if (scata.state.dbg) print("scata-Info:", i.act1); } scata.pos.flip = 1; }
      else if (scata.pos.flip == 1 && scata.pos.ball <= i.two) scata.pos.flip = 0 <= i.three ? 2 : 3;
      else if (scata.pos.flip == 2 && i.three <= scata.pos.ball) scata.pos.flip = 3;
      if (scata.volt["min" + i.act] > ew.is.ondcVoltage()) {
        scata.volt["min" + i.act] = ew.is.ondcVoltage();
      }
      if (scata.pos.flip == 3) {
        clearInterval(scata.tid.move);
        scata.tid.move = 0;
        if (i.act == "Emptying") {
          scata.volt.drop[i.act] = scata.volt.base - scata.volt["min" + i.act];
          if (scata.state.dbg) print("scata-Info: voltage drop", scata.volt.drop[i.act].toFixed(3), "V");
          if (scata.state.dbg) print("scata-Info: sand estimate", (scata.volt.drop[i.act] * (40 - (scata.volt.drop[i.act] * 50))).toFixed(1), " litres");
          scata.state.litres = (scata.volt.drop[i.act] * (40 - (scata.volt.drop[i.act] * 50))).toFixed(1);
        }
        if (scata.state.dbg) print("scata-Info:", i.act, "done, running", i.next);
        if (i.next) scata[i.next]();
      }
      //recovery
      if (ew.is.ondcVoltage() <= 4) {
        if (scata.state.dbg) print("scata-Error: power is down, waking up");
        clearInterval(scata.tid.move);
        scata.tid.move = 0;
        scata.pos.ball = scata.pos.ball + (scata.pos.flip == 1 ? 0.25 : -0.25);
        scata.move(D22, scata.pos.ball, 1);
        scata.wake("recovery");
      }

    }, i.speed);
  },
  empty: function(mode) {
    if (scata.state.busy) return;
    scata.state.busy = 1;
    if (scata.state.dbg) print("scata-Info: acc sleep");
    acc.sleep();
    scata.count("clear");
    mode == "sand" ? scata.state.run = 0 : scata.state.run++;
    scata.unlock();
    scata.go({ one: 0.52 + scata.clb, two: 0.30 + scata.clb, three: 0.38 + scata.clb, act: "Unlocking", next: mode ? "sand" : "betonite" });
    //ew.oled.msg("Emptying", 1);
    return "ok";
  },
  // fine grain betonite sand
  betonite: () => { scata.go({ one: 2 + scata.clb, two: 0, three: 0.65, act: "Emptying", act1: "Returning ", next: "lock", speed: 100 }); },
  // standard non-stick sand
  nonstic: () => { scata.go({ one: 1.6 + scata.clb, two: 1 + scata.clb, act: "Emptying", next: "nonstic_return" }); },
  nonstic_return: () => { scata.go({ one: 2 + scata.clb, two: 0, three: 0.65, act: "Emptying", act1: "Returning", next: "lock", speed: 100 }); },
  // light crystalic silicone sand
  silicone: () => { scata.go({ one: 1.6 + scata.clb, two: 0.6 + scata.clb, act: "Getting ready", next: "silicone1", speed: 50 }); },
  silicone1: () => { scata.go({ one: 2 + scata.clb, two: 1.9 + scata.clb, act: "Emptying", next: "silicone_return", speed: 100 }); },
  silicone_return: () => { scata.go({ one: 2 + scata.clb, two: 0, act: "Emptying", next: "silicone_return1", speed: 100 }); },
  silicone_return1: () => { scata.go({ one: 0.1, two: 0, act: "Leveling", next: "silicone_return2", speed: 80 }); },
  silicone_return2: () => { scata.go({ one: 0.1, two: 0, act: "Leveling", next: "silicone_return3", speed: 80 }); },
  silicone_return3: () => { scata.go({ one: 0.8, two: 0.65, act: "Leveling", next: "lock", speed: 100 }); },
  // empty sand
  sand: () => { scata.go({ one: 2 + scata.clb, two: 0.65, act: "Empty all sand", next: "sand1" }); },
  sand1: () => { scata.go({ one: 2 + scata.clb, two: 0.65, act: "Empty all sand", next: "sand2", speed: 50 }); },
  sand2: () => { scata.go({ one: 2 + scata.clb, two: 0.65, act: "Empty all sand", next: "sand3", speed: 50 }); },
  sand3: () => { scata.go({ one: 2, two: 0.65, act: "Empty all sand", next: "lock", speed: 100 }); },
  recovery: () => {
    scata.unlock();
    t = getTime() + 2;
    while (getTime() < t);
    scata.go({ one: 0.45, two: 0, three: 0.65, act: "recover", next: "lock" });
  },
  // lock ball
  lock: function() {
    D23.reset();
    digitalPulse(D23, 1, 1.8);
    scata.go({ one: 0.65, two: 0.28 + scata.clb, three: 0.45 + scata.clb, act: "Lockcing", next: "sleep" });
  },
  unlock: function() {
    digitalPulse(D23, 1, 1.2);
    t = getTime() + 0.2;
    while (getTime() < t);
    digitalPulse(D23, 1, 1.2);
    t = getTime() + 0.2;
    while (getTime() < t);
    digitalPulse(D23, 1, 1.2);
    t = getTime() + 1;
    while (getTime() < t);
  },
  //
  sleep: function() {
    if (ew.tid.scata) { clearTimeout(ew.tid.scata);
      ew.tid.scata = 0; }
    scata.state.busy = 0;
    ew.oled.msg("Going to Sleep", 1);
    scata.state.tap = 0;
    digitalPulse(D23, 1, [300, 100, 300, 100]);
    if (scata.state.dbg) print("scata-Info: going to sleep");
    ew.tid.scata = setTimeout(() => {
      ew.tid.scata = 0;
      if (scata.state.dbg) print("scata-Info: acc wake");
      ew.oled.msg(scata.state.litres + " Litres");
      acc.wake(1);
      //poke32(0x50000700 + 22 * 4, 2);
      //poke32(0x50000700 + 23 * 4, 2);
    }, 1500);
  },
  wake: function(i, e) {
    if (scata.state.dbg) print("scata-Info: waking up");
    ew.oled.msg("Waking up");
    if (scata.tid.move) clearInterval(scata.tid.move);
    //D23.reset();
    // pinMode(D22, "opendrain_pullup");
    // pinMode(D23, "opendrain_pullup");
    if (ew.is.ondcVoltage() <= 4.5)
      digitalPulse(D23, 1, [100, 100, 100]);
    t = getTime() + 0.5;
    while (getTime() < t);
    scata.tid.move = setInterval(() => {
      if (4.5 <= ew.is.ondcVoltage()) {
        //if (ew.is.ondcVoltage(1) <= 20)
        //if (scata.state.dbg) print("scata-Error: low battery"); //do something
        if (scata.state.dbg) print("scata-Info: power is up");
        clearInterval(scata.tid.move);
        scata.tid.move = 0;
        scata.volt.base = ew.is.ondcVoltage();
        if (i) {
          if (scata.state.dbg) print("scata-Info: starting", i, e ? e : "");
          scata[i](e ? e : "");
        }
      }
      else {
        if (scata.state.dbg) print("scata-Info: waiting for power");
        digitalPulse(D23, 1, [500, 100, 500]);
      }
    }, 2000);
  }
};
//BT events
ew.on("BTRX", (i) => {
  eval(i);
  ew.oled.msg("yes master");
});
// power events
/* //no use
ew.on("ondc", (x) => {
  if (scata.state.busy) {
    if (!x.state && !scata.state.recovery && !ew.is.charging()) {
      if (scata.state.dbg) print("scata-Error: ondc power is down, waking up");
      scata.pos.ball = scata.pos.ball + (scata.pos.flip == 1 ? 0.25 : -0.25);
      scata.move(D22, scata.pos.ball, 1);
      scata.state.recovery = 1;
      scata.wake();
    }
    else if (x.state && scata.state.recovery) {
      scata.state.recovery = 0;
      if (scata.state.dbg) print("scata-info: power is up");
      t = getTime() + 2;
      while (getTime() < t);
      scata.unlock();
      scata.go({ one: 0.45, two: 0, three: 0.65, act: "recover", next: "lock" });
    }
    //else if (scata.state.dbg) print("scata-Recovery event: false alarm-",x.state,scata.state.recovery);
  }
});
*/
// button events
ew.on("button", (x) => {
  if (scata.state.busy) {
    buzzer(400);
    ew.oled.msg("I am busy", 1);
    return;
  }
  acc.sleep();
  if (x == "double") {
    ew.oled.msg(scata.state.run + "-" + ew.is.batt(1) + " %", 1, ew.is.ondcVoltage(4) + "% - " + ew.is.ondcVoltage().toFixed(2) + "V");
  }
  else if (x == "short") {
    ew.oled.msg(4.5 <= ew.is.ondcVoltage() ? "Going to sleep" : "Waiking up");
    if (scata.state.dbg) print("scata-Info: button single tap");
    //digitalPulse(D23, ew.is.charging() ? 0 : 1, [200, 200, 200]);
    4.5 <= ew.is.ondcVoltage() ? scata.sleep() : scata.wake();
  }
  else
  if (x == "triple") {
    buzzer([80, 80, 100, 80, 200]);
    if (scata.state.dbg) print("scata-Info: button triple tap");
    scata.wake("empty", 2);
  }
  else
  if (x == "long") {
    buzzer([80, 80, 100, 80, 200]);
    if (scata.state.dbg) print("scata-Info: button long hold");
    scata.wake("empty");
  }
  acc.wake();
});
//accelerator events
acc.on("action", (x, y) => {
  if (scata.state.dbg) print("scata-Info: acc event", x, y);
  if (y == 1 || y == 2) scata.state.tap = 5;
  //(x == "double")?scata.state.tap=5 : scata.state.tap++;
  else { if (scata.state.dbg) print("scata-Info: acc event", x, y, "ignored"); return; }
  if (ew.tid.scata) {
    clearTimeout(ew.tid.scata);
    ew.tid.scata = 0;
  }
  ew.tid.scata = setTimeout(() => {
    ew.tid.scata = 0;
    scata.state.tap = 0;
    if (scata.state.dbg) print("scata-Info: out of tmr, scata.state.tap:", scata.state.tap);
  }, (1 < scata.state.tap) ? 120000 : 45000);
  if (scata.state.tap == 1) ew.oled.msg("who is there?");
  if (scata.state.busy || BTN1.read()) { if (scata.state.dbg) print("scata-Info: acc event", x, y, "canceled"); return; }
  else scata.count();
});
//init
ew.updateBT();
NRF.setTxPower(4);
//
if (ew.tid.scata) {
  clearTimeout(ew.tid.scata);
  ew.tid.scata = 0;
}
ew.tid.scata = setTimeout(() => {
  ew.tid.scata = 0;
  ew.oled.off();
  acc.wake(1);
}, 4000);
