import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

import ServerManagerService from '/ServerManagerService';

async function generateServerManager(server_ids) {
	var app = express();
	app.use(cors());
	app.use(bodyParser.json());

	var serverManager = new ServerManagerService(server_ids);
	let _ = await serverManager.setup();

	app.get('/', function(req, res) {
		res.json({
			pee: 'poo'
		})
	})

	app.get('/status', function(req, res) {
		res.json({
			area_map: serverManager.area_map,
			idle_servers: serverManager.idle_servers
		})
	})

	app.get('/gameserver', async function(req, res) {
		var scene = req.query.scene || ''
		var server = await serverManager.get_server_from_scene(scene)
			.catch(e => console.log(e.message))

		// To Do: add better error handling
		res.json({
			scene: scene,
			// origin: serverManager.get_server_url(server, false),
			origin: 'http://localhost:8000',
			pathname: `/gs/${server}/socket.io`
		})
	})

	return app;
}

module.exports = generateServerManager