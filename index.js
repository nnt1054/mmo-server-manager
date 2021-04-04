var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();
const fetch = require("node-fetch");
const { URL, URLSearchParams } = require('url');
app.use(cors());
app.use(bodyParser.json());

// app.get('/', function (req, res) {
// 	res.send('hello')
// })

const server_states = {
	IDLE: "IDLE",
	ACTIVE: "ACTIVE",
	UNAVAILABLE: "UNAVAILABLE"
}

// area_name : server endpoint? (/test/0)
// area_name : server endpoint? (0) if its local
var area_map = {
	testScene: null,
	area01: null,
	area02: null,
	area03: null,
}
// [/test/0, /test/1, /test/2]
// [0, 1, 2] if its local
var idle_servers = []

var replicas = 3
async function setup() {
	for (var i = 0; i < replicas; i++) {
		// here we would for loop through test.docker-registry.com/test/0 - (replicas - 1)
		// var url = 'http://test.docker-registry.com/test/' + i + '/state'
		var url = 'http://localhost:' + (8000 + i) + '/state'

		console.log('connecting to url: ' + url);
	  	let response = await fetch(url)
	  		.catch((e) => console.log(e.message));
	  	let data = await response?.json()
	  		.catch((e) => console.log(e))
	  	data = data || {
	  		state: server_states.UNAVAILABLE
	  	}
		// for now assume 1 replica hosted on localhost:8080
		// let url = 'localhost:8080'

		// send http requests to url/health or url/status
		// if idle:
			// add to idle_servers list
		// if active:
			// get area name and add to area_map
			// throw area for collisions
		switch(data.state) {
			case server_states.IDLE:
				// idle_servers.push('/test/' + i)
				idle_servers.push(i)
				break;
			case server_states.ACTIVE:
				// area_map[data.scene] = '/test/'+ i;
				area_map[data.scene] = i;
				break;
			default:
				console.log('something went wrong xd');
				break;
		}
	}
	console.log(area_map)
	console.log(idle_servers)
}
setup();
// after this setup loop, we can assume that the area_map and idle_servers are properly configured


// EXAMPLE for fetch Post request later
// console.log('https://example.com?' + new URLSearchParams({
//     foo: 'value',
//     bar: 2,
// }))

app.get('/status', function(req, res) {
	res.json({
		area_map: area_map,
		idle_servers: idle_servers
	})
})

app.get('/gameserver', function(req, res) {
	var scene_name = req.query.scene
	if (scene_name == null) {
		res.json({
			result: 'something went wrong dude',
		})
	} else {
		if (scene_name in area_map) {
			if (area_map[scene_name] == null) {
				// this means allocate game server to run scene
				if (idle_servers.length < 1) {
					res.json({
						result: 'no allocated server for ' + scene_name,
					})
				} else {
					let server = idle_servers.shift();
					assign_server(server, scene_name, res);
				}
			} else {
				// res.json({
				// 	scene: scene_name,
				// 	origin: 'test.docker-registry.com/',
				// 	pathname: area_map[scene_name] + '/socket.io'
				// })
				res.json({
					scene: scene_name,
					origin: 'localhost:' + (8000 + area_map[scene_name]) + '/',
					pathname: '/socket.io'
				})
			}
		} else {
			res.json({
				result: scene_name + ' not in area_map list',
			})	
		}
	}

	// res.json({
	// 	'scene': 'area03',
	// 	// 'origin': 'localhost:8080/',
	// 	// 'pathname': '/socket.io',
	// 	'origin': 'test.docker-registry.com/',
	// 	'pathname': '/test/0/socket.io'88833333	
	// });
})

// app.use('/', express.static(__dirname + '/client-build'));
// app.use('/client', express.static(__dirname + '/client-build'));

const port = process.env.PORT || 8081;
var server = app.listen(port);
console.log('App is listening on port ' + port);

async function assign_server(server, scene, res) {
	let params = {
		scene: scene
	}
	// let url = 'http://test.docker-registry.com' + server + '/assign?' + new URLSearchParams(params);
	let url = 'http://localhost:' + (8000 + server) + '/assign?' + new URLSearchParams(params);
	console.log(url);
  	let response = await fetch(url)
  		.catch('af;sldkfa;slkjf')
  	console.log(response)
	// res.json({
	// 	scene: scene,
	// 	origin: 'test.docker-registry.com/',
	// 	pathname: server + '/socket.io'
	// })
	area_map[scene] = server;
	res.json({
		scene: scene,
		origin: 'localhost:' + (8000 + area_map[scene]) + '/',
		pathname: '/socket.io'
	})
}