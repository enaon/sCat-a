// MIT License (c) 2020 fanoush https://github.com/fanoush
// see full license text at https://choosealicense.com/licenses/mit/
// Magic3-Rock 
E.setFlags({ pretokenise: 1 });
//ll
ew.is.dddm = 12;
Modules.addCached("eucWatch", function() {
  //screen driver
  // compiled with options LCD_BPP=12,SHARED_SPIFLASH,SPIFLASH_CS=(1<<5)
  var SPI2 = (function(){
  var bin=toFlatString(atob("AAAAAAAAAAAAAAAAAAAAAAAAAAAFKgAAAAAFKwAAAAABLAAA////////////////ELUDTHxEIoBggKGA44AQvcj///8HS3tEG4lDsQRKE2gAK/zQACMTYANKekQTgXBHGPECQLb///+i////OLUjS3tE2mgAKjDQGUoHJBRgGUwBJSVgG2kURguxF0oTYP/32f8WSwAiGmCj9YRjGmAUShBgUWCi8jRSASERYBpoACr80AAiGmASS3tEG2kLsQ1KE2AQS3tEG2kLsQpKE2AKSwAgASIgYBpgOL1P8P8w++cA9QJAcPUCQAwFAFA49QJARPUCQAgFAFAE8AJAjP///0T///84////E7UAKB7bACmmv434BRACJAEkACqkvwKpCRmN+AQApL8BNAH4BCwAK6K/AqoSGQE0IUYBqKi/AvgEPP/3k/8gRgKwEL0AJPrncLUFRoixRhgAJChGEPgBGxmxRRi1QgLZZEIgRnC9//d9/wAo+dEBNO/nBEb15wAAAPT/cBC0AjFEuglIAfT/cXhEATlJulK6W7rEggGDgoPDgw8hFDBd+ARL//fRvwC/bP7//xJLG2gQteu5EUsbaAuxEUoTYBNLEEp7RAAGXGoUYJxqVGDcapRgT/D/NNRg2mgLS0kAGmAAIlpgQ/hIDEP4GBwBIBC9T/D/MPvnAL8A9QJABPMCQAjzAkAI9QJAbPUCQDL+//8HSgAjE2Ci9X5yE2AFSwEiGmAD9UBzG2gLsQNKE2BwRwD1AkAE8AJACPMCQBC1BUx8RMTpCQEBIQH6AvLE6QMyEL0Av7T9//8t6fBPt7DN6QESakp6RJL4AJAAKADwuoAAKQDwt4AJ8f8zBysA8rKAASMD+gnzATvbsgOTAXhDeJeIQeoDIQKbGUFUSwAkHGBTTAcjI2ATaQWUAPECC4myC7FQShNgT+pJA9uyT/AACASTREYerlJLAp17RLP4AqADmwGaC0BB+gnxMvgTwAObC0BB+gnxMvgTIASbHUTtsgctZ9iJsk/qLBMzVRMSBPECDkPqDBwzGQM0qvECCl8sg/gBwB/6ivoG+A4gGN3/943+NUoAIxNgovWEYhNgwvgsZML4MEQxTAEiImA1THxEsusICCKBB78erkRGHEYGrrrxAA+80TBLe0QBP9uIGES/skN4AXhB6gMhApsZQQDxAguJsgAvptEALDDQ//de/h1LH0ofYKP1hGOi8jRSH2DC+DRlwvg4RQEhEWAaaAAq/NAAIhpgHUt7RBtpC7EVShNgBZsAIBhgE0sBIhpgN7C96PCP3kYIPR74ATvtssXxCAsD+gvzGUOJsvNGi+f/9y3+4OdP8P8w6ecAv3D1AkAA9QJADAUAUDj1AkAQ8AJARPUCQAgFAFAE8AJAkP3//yr9//+2/P//nPz//0z8//8="));
  return {
    cmd:E.nativeCall(109, "int(int,int)", bin),
    cmds:E.nativeCall(337, "int(int,int)", bin),
    cmd4:E.nativeCall(265, "int(int,int,int,int)", bin),
    setpins:E.nativeCall(581, "void(int,int,int,int)", bin),
    setwin:E.nativeCall(385, "void(int,int,int,int)", bin),
    enable:E.nativeCall(437, "int(int,int)", bin),
    disable:E.nativeCall(537, "void()", bin),
    blit_setup:E.nativeCall(49, "void(int,int,int,int)", bin),
    blt_pal:E.nativeCall(609, "int(int,int,int)", bin),
  };
})();

  // this method would produce code string that can replace bin declaration above with heatshrink compressed variant
  // however it seems the gain is very small so is not worth it
  //    shrink:function(){return `var bin=E.toFlatString(require("heatshrink").decompress(atob("${btoa(require("heatshrink").compress(bin))}")))`;}
  //*/
  E.kickWatchdog();

  D7.write(1); // turns off HR red led
  //MAGIC3 pins
CS=D3;DC=D47;RST=D2;BL=D12;SCK=D45;MOSI=D44;
RST.reset();
SCK.write(0);MOSI.write(0);CS.write(1);DC.write(1);

function toFlatString(arr,retries){
  return (E.toFlatString||E.toString)(arr) || (function(){
    if (retries==0) return undefined;
    E.kickWatchdog();E.defrag();print("toFlatString() fail&retry!");
    return toFlatString(arr,retries?retries-1:2); // 3 retries
  })();
}
function toFlatBuffer(a){return E.toArrayBuffer(toFlatString(a));}

SPI2.setpins(SCK,MOSI,CS,DC);
SPI2.enable(0x14,0); //32MBit, mode 0

function delayms(ms){ // for short delays, blocks everything
  digitalPulse(DC,0,ms);// use some harmless pin (LCD DC)
  digitalPulse(DC,0,0); // 0ms just waits for previous call
}



function cmd(a){
  var l=a.length;
  if (!l)return SPI2.cmd4(a,-1,-1,-1);
  if (l==2)return SPI2.cmd4(a[0],a[1],-1,-1);
  if (l==3)return SPI2.cmd4(a[0],a[1],a[2],-1);
  if (l==4)return SPI2.cmd4(a[0],a[1],a[2],a[3]);
  if (l==1)return SPI2.cmd4(a[0],-1,-1,-1);
  var b=toFlatString(a);
  SPI2.cmd(E.getAddressOf(b,true),b.length);
}

function cmds(arr){
  var b=toFlatString(arr);
  var c=SPI2.cmds(E.getAddressOf(b,true),b.length);
  if (c<0)print('lcd_cmds: buffer mismatch, cnt='+c);
  return c;
}


  RST.set();

  function init(bppi) {
    //"ram";
    cmd(0x01); //ST7735_SWRESET: Software reset, 0 args, w/delay: 150 ms delay
    delayms(120); // no apps to run 
    cmd(0x11); //SLPOUT
    delayms(50);
    //MADCTL: Set Memory access control (directions), 1 arg: row addr/col addr, bottom to top refresh
    cmd(0x36, 0x00);
    //COLMOD: Set color mode, 1 arg, no delay: 16-bit color /5=16,3=12bit
    cmd([0x3a, 0x03]);
    //PORCTRL: Porch control
    cmd(0xb2, [0x0b, 0x0b, 0x33, 0x00, 0x33]);
    //GCTRL: Gate control
    cmd(0xb7, 0x11);
    // VCOMS: VCOMS setting
    cmd(0xbb, 0x35);
    //LCMCTRL: CM control
    cmd(0xc0, 0x2c);
    //VDVVRHEN: VDV and VRH command enable
    cmd(0xc2, 0x01);
    // VRHS: VRH Set
    cmd(0xc3, 0x08);
    // VDVS: VDV Set
    cmd(0xc4, 0x20);
    //VCMOFSET: VCOM Offset Set .
    cmd(0xC6, 0x1F);
    //PWCTRL1: Power Control 1
    cmd(0xD0, [0xA4, 0xA1]);
    // PVGAMCTRL: Positive Voltage Gamma Control
    //cmd(0xe0, [0xF0, 0x04, 0x0a, 0x0a, 0x08, 0x25, 0x33, 0x27, 0x3d, 0x38, 0x14, 0x14, 0x25, 0x2a]);
    cmd([0xe0, 0x70, 0x15, 0x20, 0x15, 0x10, 0x09, 0x48, 0x33, 0x53, 0x0B, 0x19, 0x15, 0x2a, 0x2f]); // PVGAMCTRL (E0h): Positive Voltage Gamma Control
    cmd([0xe1, 0x70, 0x15, 0x20, 0x15, 0x10, 0x09, 0x48, 0x33, 0x53, 0x0B, 0x19, 0x15, 0x2a, 0x2f]); // NVGAMCTRL (E1h): Negative Voltage Gamma Contro
    // NVGAMCTRL: Negative Voltage Gamma Contro
    // NVGAMCTRL: Negative Voltage Gamma Contro
    // cmd(0xe1, [0xf0, 0x05, 0x08, 0x07, 0x06, 0x02, 0x26, 0x32, 0x3d, 0x3a, 0x16, 0x16, 0x26, 0x2c]);
    //TFT_INVONN: Invert display, no args, no delay
    cmd(0x21);
    //TFT_NORON: Set Normal display on, no args, w/delay: 10 ms delay
    cmd(0x13);
    //TFT_DISPON: Set Main screen turn on, no args w/delay: 100 ms delay
    cmd(0x29);


    //cmd([0x35, 0]);
    //cmd(0x2a,[0,0,0,239]);
    //cmd(0x2b,[0,0,0,279]);
    //cmd([0x2c]);

  }

  var bpp = (require("Storage").read("ew.json") && require("Storage").readJSON("ew.json").bpp) ? require("Storage").readJSON("ew.json").bpp : 1;
  if (require('Storage').read('.displayM')) bpp=1;//V1 support
  var g = Graphics.createArrayBuffer(240, 280, bpp);
  var pal;
  g.sc = g.setColor;

  // 16bit RGB565  //0=black,1=dgray,2=gray,3=lgray,4=raf,5=raf1,6=raf2,7=red,8=blue,9=purple,10=?,11=green,12=olive,13=yellow,14=lblue,15=white
  // 16bit RGB565  //0=black,1=dgray,2=red,3=lgray,4=raf,5=raf1,6=raf2,7=red,8=green,9=purple,10=?,11=green,12=olive,13=yellow,14=blue,15=white

  //g.col=Uint16Array([ 0x000,0x31C8,0x5B2F,0xD6BA,0x3276,0x4B16,0x3ADC,0xF165,0xEFBF,0xA815,2220,0x5ff,0x3C0C,0xFFE0,0xD7BF,0xFFFF ]);
  //g.col=Uint16Array([  0,31,2016,2016,31,2047,0,63488,63519,63519,   31,63519,63519,65504,  65535,65535]);


  // 16bit RGB565  //0=black,1=dgray,2=gray,3=lgray,4=raf,5=raf1,6=raf2,7=red,8=blue,9=purple,10=?,11=green,12=olive,13=yellow,14=lblue,15=white
  //g.col=Uint16Array([ 0x000,54,2730,3549,1629,83,72,3840,143,3935,2220,0x5ff,115,4080,1535,4095 ]);

  // 16bit RGB565  //0=black,1=dgray,2=gray,3=lgray,4=raf,5=dgreen,6=dark2,7=green,8=blue,9=purple,10=?,11=lblue,12=olive,13=red,14=yellow,15=white
  //g.col=Uint16Array([ 0x000,54,2220,3549,1629,83,72,0x0d0,143,3935,2220,0x5ff,115,3840,1535,4095 ]);
  //g.col=Uint16Array([ 0x000,54,2220,3549,1629,83,72,0x0d0,143,3935,2220,0x5ff,115,3840,4080,4095 ]);
  //g.col = Uint16Array([0x000, 54, 2220, 3549, 1629, 83, 72, 0x0d0, 143, 3935, 2220, 0x5ff, 143, 3840, 4080, 4095]);
  //g.col = Uint16Array([0x000, 1365, 2730, 3549, 1629, 2474, 1963, 0x0d0, 143, 3935, 2220, 1535, 170, 3840, 4080, 4095]);
    g.col = Uint16Array([0x000, 1365, 2730, 3549, 143, 1628, 1963, 0x0d0, 143, 3935, 1659, 1535, 170, 3840, 4080, 4095]);

  //2730 old gray
  //1622 dgray 1610 dbue 1655-good grey 1672  dblack 50,68.85  115, 152 green
  //54,
  /*
  red e84417
  gred 0ed145
  blue 00a8f3 , 0962c8

  purple e85521
  */
  switch (bpp) {
    case 1:
      pal = Uint16Array([0x000, 4095]);
      //let sc = g.setColor;
      g.setColor = function(c, v) {
        if (c == 1) pal[1] = g.col[v];
        else pal[0] = g.col[v];
        g.sc(c);
      };
      break;
    case 2:
      pal = Uint16Array([0x000, 1365, 1629, 1535]); // white won't fit
      g.buffer = new ArrayBuffer(16800);
      break;
    case 4:
      g.buffer = new ArrayBuffer(33600);
      pal = g.col;
      g.setColor = (c, v) => { g.sc(v); };
      break;
  }
  // preallocate setwindow command buffer for flip
  g.winCmd = toFlatBuffer([
    5, 0x2a, 0, 0, 0, 0,
    5, 0x2b, 0, 0, 0, 0,
    1, 0x2c,
    0
  ]);
  /*
    cmd([0x2a,0,x1,0,x2-1]);
    cmd([0x2b,0,r.y1,0,r.y2]);
    cmd([0x2c]);
  */

  // precompute addresses for flip
  g.winA = E.getAddressOf(g.winCmd, true);
  g.palA = E.getAddressOf(pal.buffer, true); // pallete address
  g.buffA = E.getAddressOf(g.buffer, true); // framebuffer address
  g.stride = g.getWidth() * bpp / 8;
  
  if (require('Storage').read('.displayM')){  //V1 support
    g.lala=g.fillRect;
    g.fillRect=function(x,y,x1,y1){
      g.lala(x,y+30,x1,y1+30);
    };
    g.lal3=g.clearRect;
    g.clearRect=function(x,y,x1,y1){
      g.lal3(x,y+30,x1,y1+30);
    };
    g.lal4=g.drawLine;
    g.drawLine=function(x,y,x1,y1){
      g.lal4(x,y+30,x1,y1+30);
    };    
    g.lal1=g.drawString;
    g.drawString=function(t,x,y){
      g.lal1(t,x,y+30);
    };
    g.lal2=g.drawImage;
    g.drawImage=function(t,x,y,o){
      g.lal2(t,x,y+30,o);
    };  
    g.lal5=g.setFont;
    g.setFont=function(f,s){
      g.lal5(f,s);
    };
    
  }
  g.flip = function(force) {
    //"ram";
    var r = g.getModified(true);
    if (force)
      r = { x1: 0, y1: 0, x2: this.getWidth() - 1, y2: this.getHeight() - 1 };
    if (r === undefined) return;
    var x1 = r.x1 & 0xfe;
    var x2 = (r.x2 + 2) & 0xfe; // for 12bit mode align to 2 pixels
    var xw = (x2 - x1);
    var yw = (r.y2 - r.y1 + 1);
    if (xw < 1 || yw < 1) { print("empty rect ", xw, yw); return; }
    var c = g.winCmd;
    c[3] = x1;
    c[5] = x2 - 1; //0x2a params
    var y = r.y1 + 20;
    c[9] = y % 256;
    c[8] = y >> 8;
    y = r.y2 + 20;
    c[11] = y % 256;
    c[10] = y >> 8; // 0x2b params
    SPI2.blit_setup(xw, yw, bpp, g.stride);
    var xbits = x1 * bpp;
    var bitoff = xbits % 8;
    var addr = g.buffA + (xbits - bitoff) / 8 + r.y1 * g.stride; // address of upper left corner
    //VIB.set();//debug
    SPI2.cmds(g.winA, c.length);
    SPI2.blt_pal(addr, g.palA, bitoff);
    //VIB.reset();//debug
  };

  g.isOn = false;
  init();

  g.on = function() {
    "ram";
    if (this.isOn) return;
    cmd(0x11);
    g.flip();
    //cmd(0x13); //ST7735_NORON: Set Normal display on, no args, w/delay: 10 ms delay
    //cmd(0x29); //ST7735_DISPON: Set Main screen turn on, no args w/delay: 100 ms delay
    this.isOn = true;
    this.bri.set(this.bri.lv);
    //this.setBrightness();
  };

  g.off = function() {
    //"ram";
    if (!this.isOn) return;
    //cmd(0x28);
    cmd(0x10);
    BL.reset();
    this.isOn = false;
  };

  g.bri = {
    lv: ((require("Storage").readJSON("ew.json", 1) || {}).bri) ? (require("Storage").readJSON("ew.json", 1) || {}).bri : 3,
    set: function(o) {
      if (o) this.lv = o;
      else { this.lv++; if (this.lv > 7) this.lv = 1;
        o = this.lv; }
      if (this.lv == 0 || this.lv == 7)
        digitalWrite(BL, (this.lv == 0) ? 0 : 1);
      else
        //analogWrite(BL,(this.lv*42.666)/256);
        analogWrite(BL, (this.lv * 42.666) / 256, { freq: 4096 });
      //digitalWrite([D23,D22,D14],7-o);
      ew.def.bri = o;
      return o;
    }
  };
  //battery
  const batt = function(i, c) {
    //"ram";
    let v = 4.20 / 0.60 * analogRead(ew.pin.BAT);
    let l = 3.5,
      h = 4.19;
    let hexString = ("0x" + (0x50000700 + (ew.pin.BAT * 4)).toString(16));
    poke32(hexString, 2); // disconnect pin for power saving, otherwise it draws 70uA more 	
    if (i === "info") {
      if (c) return ((100 * (v - l) / (h - l) | 0) + '%-' + v.toFixed(2) + 'V');
      return (((v <= l) ? 0 : (h <= v) ? 100 : ((v - l) / (h - l) * 100 | 0)) + '%-' + v.toFixed(2) + 'V');
    }
    else if (i) {
      if (c) return (100 * (v - l) / (h - l) | 0);
      return ((v <= l) ? 0 : (h <= v) ? 100 : ((v - l) / (h - l) * 100 | 0));
    }
    else return +v.toFixed(2);
  };
  module.exports = {
    batt: batt,
    gfx: g
  };
});