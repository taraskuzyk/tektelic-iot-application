const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mqtt = require("mqtt");
require('events').EventEmitter.defaultMaxListeners = 0;

let socketList = [];

let login = {
	ttn: {
		url: "https://eu1.cloud.thethings.industries:1883",
		username: "ttn-conference-demo@tektelic",
		password: "NNSXS.QGTIMKZYLCG4ZBNBGMHFJCFEZBVGZBKXRNEEPCY.2SXCBEUJHF3QRQTVD5T7CRTQP7ANBB6HQVRLL7XO3ASQVMNSANNQ",
	},
	tektelic: {
		url: "https://lorawan-ns-na.tektelic.com", //Credentials to the HQ Demo Application
		username: "k9fI2Gz90Bj694JjATUq",
		password: "Bb0Z1nOa2lpgFgjUdUsp"
	},
	tekteliceu: {
		url: "https://lorawan-ns-eu.tektelic.com", //Credentials to the HQ Demo Application
		username: "ttn-conference",
		password: "Tektelic123!"
	},
};

let connection = {
	ttn: mqtt.connect(login.ttn.url, {"username": login.ttn.username, "password": login.ttn.password}),
	tektelic: mqtt.connect(login.tektelic.url, {"username": login.tektelic.username, "password": login.tektelic.password}),
	tekteliceu: mqtt.connect(login.tekteliceu.url, {"username": login.tekteliceu.username, "password": login.tekteliceu.password})
};

connection.ttn.subscribe("#");
connection.tektelic.subscribe('app/#');
connection.tekteliceu.subscribe('app/#');

connection.ttn.on("message", (topic, message)=>{
	const receivedObject = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(message)));
	if (receivedObject.hasOwnProperty("uplink_message")) {
		const uplink = {
			"payload": receivedObject.uplink_message.frm_payload,
			"port": receivedObject.uplink_message.f_port,
			"devEUI": receivedObject.end_device_ids.dev_eui,
		};

		console.log("Uplink received:\n" + JSON.stringify(uplink));

		let sockets = [];
		for (let i = 0; i < socketList.length; i++) {
			if (socketList[i].devEUI.toLowerCase() === uplink.devEUI.toLowerCase()) {
				sockets.push(socketList[i])
			}
		}
		if (sockets[0]) {
			for (let i = 0; i < sockets.length; i++) {
				sockets[i].emit("uplink", uplink);
				console.log("Uplink emitted to", sockets[i].id);
			}
		}
	}
});

connection.tekteliceu.on("message", (topic, message)=>{
	const receivedObject = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(message)));
	if (receivedObject.hasOwnProperty("payloadMetaData")) {
		const uplink = {
			"payload": receivedObject.payload,
			"port": receivedObject.payloadMetaData.fport,
			"devEUI": receivedObject.payloadMetaData.deviceMetaData.deviceEUI,
		};

		console.log("Uplink received:\n" + JSON.stringify(uplink));

		let sockets = [];
		for (let i = 0; i < socketList.length; i++) {
			if (socketList[i].devEUI.toLowerCase() === uplink.devEUI.toLowerCase()) {
				sockets.push(socketList[i])
			}
		}
		if (sockets[0]) {
			for (let i = 0; i < sockets.length; i++) {
				sockets[i].emit("uplink", uplink);
				console.log("Uplink emitted to", sockets[i].id);
			}
		}
	}
});



http.listen(2000, function(){
	console.log('listening on *:2000');
});

app.get('/', function(req, res){
	res.sendfile('index.html');
});

/*
mosquitto_pub -h "eu1.cloud.thethings.industries" -p "1883" -u "ttn-conference-demo@tektelic" -P "NNSXS.QGTIMKZYLCG4ZBNBGMHFJCFEZBVGZBKXRNEEPCY.2SXCBEUJHF3QRQTVD5T7CRTQP7ANBB6HQVRLL7XO3ASQVMNSANNQ" -t "v3/ttn-conference-demo@tektelic/devices/647fda00000053ff/down/push" -m "{\"downlinks\":[{\"f_port\": 15,\"frm_payload\":\"vu8=\",\"priority\": \"NORMAL\"}]}" -d
 */