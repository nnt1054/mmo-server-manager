import fetch from "node-fetch";
import { URLSearchParams } from 'url';

import config from "/config";

const server_states = {
	IDLE: "IDLE",
	ACTIVE: "ACTIVE",
	UNAVAILABLE: "UNAVAILABLE"
}

export default class ServerManagerService {

	// param: server_ids [str, ...]
	constructor(server_ids) {
		this.server_ids = server_ids;

		// To Do: store in Redis isntead of class attribute
		this.area_map = {
			testScene: null,
			area01Scene: null,
			area02Scene: null,
			area03Scene: null,
		}
		this.server_states = {}
		this.idle_servers = []
	}

	async setup() {
		var retry = false;
		for (var i = 0; i < this.server_ids.length; i++) {
			var server_id = this.server_ids[i];
			if (server_id in this.server_states) {
				retry = true;
				continue;
			}
			var data = await this.get_server_state(server_id)
			switch(data.state) {
				case server_states.IDLE:
					this.server_states[server_id] = data;
					this.idle_servers.push(server_id)
					break;
				case server_states.ACTIVE:
					this.server_states[server_id] = data;
					this.area_map[data.scene] = server_id;
					break;
				case server_states.UNAVAILABLE:
					console.log(`Server: ${server_id} is UNAVAILABLE`);
					break;
				default:
					console.log(`Server: ${server_id} has malformed state`);
					break;
			}
		}
		return retry;
	}

	async get_server_state(server_id) {
		let url = this.get_server_url(server_id) + `/state`
		let response = await fetch(url)
			.catch(e => console.log(e.message))
		let data = await response?.json()
			.catch(e => console.log(e.message))
		let result = {
			state: data?.state || server_states.UNAVAILABLE,
			scene: data?.scene || null
		}
		return result
	}

	get_server_url(server_id, http=true) {
		// return `http://${config.host_url}/gs/${server_id}`
		if (http) {
			return `http://localhost:3000/gs/${server_id}`
		} else {
			return `localhost:3000/gs/${server_id}`
		}
	}

	async get_server_from_scene(scene) {
		console.log('get_server_from_scene');
		console.log(scene);
		if (!(scene in this.area_map)) {
			console.log('didnt find scene')
			return null
		}
		if (!this.area_map[scene]) {
			if (this.idle_servers.length < 1) {
				console.log('no idle servers')
				return null
			}
			let server_id = this.idle_servers.shift()
			let result = await this.assign_scene_to_server(server_id, scene)
				.catch(e => console.log(e.message))
			return result
		} else {
			console.log(this.area_map[scene])
			return this.area_map[scene]
		}
	}

	async assign_scene_to_server(server_id, scene) {
		let params = {
			scene: scene
		}
		let url = this.get_server_url(server_id, params) + `/assign?${new URLSearchParams(params)}`
	  	let response = await fetch(url)
	  		.catch(e => console.log(e.message))
	  	let data = response?.json()
	  	if (data) {
			this.area_map[scene] = server_id;
			return server_id
	  	} else {
	  		return null
	  	}
	}

}