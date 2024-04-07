E.setConsole(Bluetooth, { force: true });
pinMode(D22, "opendrain_pullup");
pinMode(D23, "opendrain_pullup");
//D23.set();

scata = {
  tap: 0,
  clb: (ew.def.name == "eL-6f") ? -0.01 : -0.05,
  busy: 0,
  run: 0,
  state: { lock: 1, ball: 0, recovery: 0 },
  pos: { lock: 0.2, ball: 0.2 },
  volt: { base: 0, min: 0 },
  tid: {},
  move: function(pin, pos, range) {
    i = range ? 0.5 : 1;
    if (pos < 0) pos = 0;
    if (pos > 1 / i) pos = 1 / i;
    analogWrite(pin, (i + pos) / 50.0, { freq: 20, soft: false });
    //analogWrite(pin, (i+(pos/i)) / 50.0, {freq:20, soft: false});
  },
  count: function() {
    if (scata.tid.cntdn) {
      clearInterval(scata.tid.cntdn);
      scata.tid.cntdn = 0;
    }
    //scata.wake();
    let v = 120;
    ew.oled.msg("Hello Kitty");
    scata.tid.cntdn = setInterval(() => {
      v--;
      ew.oled.msg((118 <= v) ? "Hello Kitty" : "Empty in " + v);
      if (v == 90) digitalPulse(D23, 0, [50, 100, 50]);
      if (v <= 10) buzzer([200, 100, 100]);
      if (v <= 0) {
        clearInterval(scata.tid.cntdn);
        scata.tid.cntdn = 0;
        acc.sleep();
        scata.empty();
      }
    }, 1000);
  },

  go: function(a, b, c, d) {
    scata.pos.flip = 0;
    //scata.motion1();reset()
    if (scata.tid.move) { clearInterval(scata.tid.move); }
    //print("move : " + scata.pos.ball, scata.pos.flip);
    scata.tid.move = setInterval(() => {
      //step=dir?0.01:-0.01
      if (scata.pos.flip == 1) scata.pos.ball = scata.pos.ball - 0.005;
      else if (scata.pos.flip == 2) scata.pos.ball = scata.pos.ball + 0.005;
      else scata.pos.ball = scata.pos.ball + 0.005;
      scata.move(D22, scata.pos.ball, 1);
      //print("move : " + scata.pos.ball, scata.pos.flip);
      if (a <= scata.pos.ball && !scata.pos.flip) scata.pos.flip = 1;
      else if (scata.pos.flip == 1 && scata.pos.ball <= b) scata.pos.flip = 0 <= c ? 2 : 3;
      else if (scata.pos.flip == 2 && c <= scata.pos.ball) scata.pos.flip = 3;
      if (scata.pos.flip == 3) {
        clearInterval(scata.tid.move);
        scata.tid.move = 0;
        print("movement-ok, running", d);
        if (d) scata[d]();
      }
    }, 50);
  },
  unlock: function() {
    digitalPulse(D23, 1, 1.2);
    t = getTime() + 0.2;
    while (getTime() < t);
    digitalPulse(D23, 1, 1.2);
    t = getTime() + 0.2;
    while (getTime() < t);
    digitalPulse(D23, 1, 1.2);
    t = getTime() + 0.2;
    while (getTime() < t);
    digitalPulse(D23, 1, 1.2);
  },
  empty: function(mode) {
    if (scata.busy) return;
    scata.busy = 1;
    acc.sleep();
    if (scata.tid.cntdn) {
      clearInterval(scata.tid.cntdn);
      scata.tid.cntdn = 0;
      scata.tap = 0;
    }
    (mode == "sand") ? scata.run = 0: scata.run++;
    print("empty");
    scata.unlock();
    ew.oled.msg("Unlocking", 1);
    scata.go(0.5 + scata.clb, 0.27 + scata.clb, 0.35 + scata.clb, mode ? "sand" : "poop");
    ew.oled.msg("Emptying", 1);
    return "ok";
  },
  poop: function() {
    scata.go(2, 0, 0.65, "end");
    //scata.volt.dropEmpty = scata.volt.base - scata.volt.min;
    // scata.volt.min = scata.volt.base;
    // ew.oled.msg("Returning", 1);
    // scata.volt.dropReturn = scata.volt.base - scata.volt.min;
    //scata.end();
  },
  sand: function() {
    s22.move(0.85, 10000, function() {
      s22.move(0.95 + scata.clb, 5000, function() {
        s22.move(0.4, 10000, function() {
          s22.move(0.95 + scata.clb, 10000, function() {
            s22.move(0.4, 15000, function() {
              s22.move(0.97 + scata.clb, 10000, function() {
                s22.move(0.4, 10000, function() {
                  s22.move(1 + scata.clb, 10000, function() {
                    s22.move(0.4, 10000, function() {
                      s22.move(1 + scata.clb, 20000, function() {
                        ew.oled.msg("Returning", 1);
                        s22.move(0.30 + scata.clb, 15000, function() {
                          scata.end();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  },
  back: function() {

  },
  end: function() {
    ew.oled.msg("Locking", 1);
    D23.reset();
    //scata.pos.ball=0.30;
    //s23.move(0.8, 4000, function() {
    digitalPulse(D23, 1, 1.8);

    //ew.oled.msg("Done !", 1);
    scata.go(0.65, 0.25 + scata.clb, 0.4 + scata.clb, "sleep");
    // });
  },
  abord: function() {
    scata.busy = 1;
    //NRF.updateServices({0xffa0:{0xffa1:{value:se.buf+data.split(/\x03|\n/)[0],notify:true}} });
    //s23.move(0, 100, function() {
    s22.move(0.2, 60000, function() {
      scata.busy = 0;
      //});
    });
  },
  pwr: function() {
    scata.volt.base = ew.is.ondcVoltage();
    scata.volt.min = scata.volt.base;
    if (scata.tmr) {
      clearInterval(scata.tmr);
      scata.tmr = 0;
    }
    scata.tmr = setInterval(() => {
      if (scata.volt.min > ew.is.ondcVoltage()) {
        scata.volt.min = ew.is.ondcVoltage();
      }
      if (4.5 > ew.is.ondcVoltage()) {
        scata.sysV = ew.is.ondcVoltage();
        //clearInterval(scata.tmr); scata.tmr=0;
        print(scata.sysV);
        if (3.5 > scata.sysV) {
          clearInterval(scata.tmr);
          scata.tmr = 0;
        }
      }
    }, 10);
  },
  sleep: function() {
    if (ew.tid.scata) {
      clearTimeout(ew.tid.scata);
      ew.tid.scata = 0;
    }
    if (scata.tmr) {
      clearInterval(scata.tmr);
      scata.tmr = 0;
    }
    D23.set();
    //poke32(0x50000700 + 23 * 4, 2);
    ew.oled.msg((scata.volt.dropEmpty * 1000 | 0) + "-" + (scata.volt.dropReturn * 1000 | 0));
    //digitalPulse(D23,0,[100,200,100]);
    ew.tid.scata = setTimeout(() => {
      //scata.pwr();
      ew.tid.scata = 0;
      scata.tap = 0;
      scata.busy = 0;
      //poke32(0x50000700 + 22 * 4, 2);
      // poke32(0x50000700 + 23 * 4, 2);
      digitalPulse(D23, 0, [100, 300, 100]);
      buzzer([200, 80, 80]);
      ew.oled.msg("Going to Sleep");
      ew.tid.scata = setTimeout(() => {
        ew.tid.scata = 0;
        acc.wake(1);
      }, 2000);
    }, 3000);
  },
  wake: function(i) {
    print("waking up");
    ew.oled.msg("Waking up", 1);

    if (scata.tid.move) {
      clearInterval(scata.tid.move);
      scata.tid.move = 0;
    }
    scata.tid.move = setInterval(() => {
      if (ew.is.charging()) {
        print("power on");
        clearInterval(scata.tid.move);
        scata.tid.move = 0;
        poke32(0x50000700 + 23 * 4, 2);
        pinMode(D23, "output");
        // t = getTime() + 2;
        //  while (getTime() < t);

        if (i) {
          print("go to ", i);
          scata[i]();
        }
      }
      else {
        print("waiting for power");
        digitalPulse(D23, 1, [200, 200, 200]);
      }
    }, 1000);
  }
};
ew.on("BTRX", (i) => {
  eval(i);
  ew.oled.msg("yes master");
  // lala=print(i);
  //    lalo=i;
});
ew.updateBT();
NRF.setTxPower(4);


ew.on("ondc", (x) => {
  if (scata.busy) {
    print("recovery-event");
    if (!x.state && !scata.state.recovery) {
      print("recovery-power is down");

      if (ew.tid.scata) clearTimeout(ew.tid.scata);
      if (scata.tid.move) {
        clearInterval(scata.tid.move);
        scata.tid.move = 0;
      }
      print("recovery-correction");
      scata.pos.ball = scata.pos.ball + (scata.pos.flip == 1 ? 0.25 : -0.25);
      scata.move(D22, scata.pos.ball, 1);
      //scata.go(scata.pos.ball,scata.pos.ball);
      scata.state.recovery = 1;
      scata.tid.move = setInterval(() => {
        digitalPulse(D23, 0, 200);
        print("recovery-wake command");
      }, 1000);
    }
    else if (x.state && scata.state.recovery) {
      if (scata.tid.move) {
        clearInterval(scata.tid.move);
        scata.tid.move = 0;
      }
      var t = getTime() + 0.8;
      while (getTime() < t);
      scata.state.recovery = 0;
      print("recovery-awake");
      poke32(0x50000700 + 23 * 4, 2);
      pinMode(D23, "output");
      t = getTime() + 0.5;
      while (getTime() < t);
      scata.unlock();
      scata.go(0.45, 0, 0.65, "end");
    }
  }
});


ew.on("button", (x) => {
  if (x == "double") {
    ew.oled.msg(scata.run + "-" + ew.is.batt(1) + " %");
  }
  else
  if (scata.busy) {
    buzzer(400);
    ew.oled.msg("I am busy", 1);
    return;
  }
  if (x == "short") {
    ew.oled.msg(ew.is.charging() ? "Going to sleep" : "Woke up");
    digitalPulse(D23, 0, ew.is.charging() ? [100, 100, 100] : 100);
  }
  else
  if (x == "triple") {
    buzzer([80, 80, 100, 80, 200]);
    ew.oled.msg("Emptying Sand");
    scata.empty(2);
  }
  else
  if (x == "long") {
    buzzer([80, 80, 100, 80, 200]);
    ew.oled.msg("Yes Master");
    scata.wake("empty");
  }
});
acc.on("action", (x, y) => {
  print("acc action:", x, y);
  if (y == 1 || y == 2)(x == "double") ? scata.tap = 5 : scata.tap++;
  else return;
  if (ew.tid.scata) {
    clearTimeout(ew.tid.scata);
    ew.tid.scata = 0;
  }
  ew.tid.scata = setTimeout(() => {
    ew.tid.scata = 0;
    scata.tap = 0;
    print("out of tmr, scata.tap:", scata.tap);
  }, (1 < scata.tap) ? 120000 : 45000);
  if (scata.tap == 1) ew.oled.msg("who is there?");
  if (scata.busy) return;
  else scata.count();
});

if (ew.tid.scata) {
  clearTimeout(ew.tid.scata);
  ew.tid.scata = 0;
}
ew.tid.scata = setTimeout(() => {
  ew.tid.scata = 0;
  ew.oled.off();
  acc.wake(1);
}, 4000);
