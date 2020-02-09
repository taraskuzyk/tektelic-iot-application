const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mqtt = require("mqtt");
require('events').EventEmitter.defaultMaxListeners = 0;

let socketList = [];
//rework started at 4:25 in case you need to reverse.

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

io.on('connection', function(socket){

	socket.on('info', (info)=>{
		if (info.devEUI !== undefined) {
			socket.devEUI = info.devEUI.toLowerCase();
			socket.ns = info.ns;
			socketList.push(socket);


			socket.on("downlink", function (downlink) {
				console.log("Downlink received");
				try {
					if (socket.ns === "TTN") {
						const topic = "v3/ttn-conference-demo@tektelic/devices/" + socket.devEUI + "/down/push"
						const message = JSON.stringify({
							"downlinks": [
								{
									"f_port": parseInt(downlink.port),
									"priority": "NORMAL",
									"frm_payload": downlink.data
								}
							]
						});
						connection.ttn.publish(topic, message);
					} else {
						const topic = "app/tx";
						const message = JSON.stringify({
							"msgId": 1,
							"devEUI": downlink.devEUI,
							"port": downlink.port,
							"confirmed": false,
							"data": downlink.data
						});

						if (socket.ns === "TEKTELICEU") {
							connection.tekteliceu.publish(topic, message);
						} else {
							connection.tektelic.publish(topic, message);
						}
						socket.emit('mqttPublishSuccess');
					}

				} catch (err) {
					console.log("inside socket.on(downlink): ", err);
					socket.emit('mqttPublishError');
				}
			});
		}
		console.log('WebSocket connection established with socket ID ', socket.id);

		socket.on('disconnect', () => {
			console.log('WebSocket connection terminated with socket ID ', socket.id);
			socketList.splice(socketList.indexOf(socket), 1);
		});
	});

});

http.listen(2000, function(){
	console.log('listening on *:2000');
});

app.get('/', function(req, res){
	res.sendfile('index.html');
});

function emitUplinkToSocketsWithCorrectDevEUI(uplink, devEUI){
	let sockets = [];
	for (let i = 0; i < socketList.length; i++) {
		if (socketList[i].devEUI.toLowerCase() === devEUI.toLowerCase()) {
			sockets.push(socketList[i])
		}
	}
	if (sockets[0]) {
		for (let i = 0; i < sockets.length; i++) {
			sockets[i].emit("uplink", uplink);
			console.log("Uplink emitted to", sockets[i].id)
		}
	}
}

/*
mosquitto_pub -h "eu1.cloud.thethings.industries" -p "1883" -u "ttn-conference-demo@tektelic" -P "NNSXS.QGTIMKZYLCG4ZBNBGMHFJCFEZBVGZBKXRNEEPCY.2SXCBEUJHF3QRQTVD5T7CRTQP7ANBB6HQVRLL7XO3ASQVMNSANNQ" -t "v3/ttn-conference-demo@tektelic/devices/647fda00000053ff/down/push" -m "{\"downlinks\":[{\"f_port\": 15,\"frm_payload\":\"vu8=\",\"priority\": \"NORMAL\"}]}" -d
 */