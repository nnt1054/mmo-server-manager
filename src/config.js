import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const env_found = dotenv.config();
if (env_found.error) {
	// This error should crash whole process
	throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {

	env: process.env.NODE_ENV,
	port: parseInt(process.env.PORT, 10),
	host_url: process.env.HOST_URL,

}