//Kingsong Proxy
ew.is.bt=4;
if (global.euc&&!euc.proxy){
	euc.proxy={
		state:0,
		f:0,
		r:(o)=>{
		"ram";
			if (euc.state=="READY") euc.wri("proxy",o.data);
		},
		w:(o)=>{
		"ram";
			if (ew.is.bt!=4||!euc.proxy.state) return;
			NRF.updateServices({0xffe0:{0xffe1:{value:o,notify:true}} });
		},
		i:(o)=>{
			NRF.setServices({
				0xfff0: {
					0xfff1: {
						value: [0x01],
						maxLen: 20,
						writable: false,
						readable: true,
						description: "Characteristic 1"
					},
				},
				0xffa0: {
					0xffa1: {
						value: [0x01],
						maxLen: 20,
						writable: true,
						onWrite: function(evt) {
							ew.emit("ewBtIn",evt);
						},
						readable: true,
						notify: true,
						description: "ew"
					},
					0xffa9: {
						value: [0x01],
						maxLen: 20,
						writable: false,
						readable: true,
						notify: false,
						description: "Kingsong"
					}
				},
				0xffe0: {
					0xffe1: {
						value: [0x00],
						maxLen: 20,
						writable: true,
						onWrite: function(evt) {
							euc.proxy.r(evt);
						},
						readable: true,
						notify: true,
						description: "Kingsong"
					}
				}
			}, { advertise: ['0xfff0', '0xffa0'], uart: true });
			NRF.setAdvertising({}, { name: (euc.state=="OFF"?"eL-":"eL-ks-") + process.env.SERIAL.substring(15), manufacturerData: [[euc.state,"-"+ew.is.batt(1),"-"+(ew.is.ondc?"1":"0")]],connectable: true });
			NRF.setAddress(ew.def.mac);
			NRF.sleep();
		}
	};

}

