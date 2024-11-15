const jwt = require("jsonwebtoken");
const Users = require("../models/Users.js");
const dotenv = require("dotenv");
dotenv.config();

async function UserMiddleware(req, res, next) {
	const authorizationHeader = req.headers.authorization;
	if (!authorizationHeader) {
		return res
			.status(401)

			.set({
				"Content-Type": "application/json",
				"WWW-Authenticate": 'Bearer realm="api"',
			})
			.json({
				error: "Not Authorized!",
				message: "Missing authorization header",
			});
	}

	const accessToken = authorizationHeader.split(" ")[1];
	if (!accessToken) {
		return res
			.status(401)
			.json({error: "Not Authorized!", message: "Invalid access token"});
	}

	try {
		const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
		const user = await Users.findById(decoded);
		if (!user) {
			return res
				.status(401)
				.json({error: "Not Authorized!", message: "Invalid access token"});
		}
		req.user = user;
		return next();
	} catch (error) {
		if (error instanceof jwt.JsonWebTokenError) {
			return res
				.status(401)
				.json({error: "Not Authorized!", message: "Invalid access token"});
		}
		return res
			.status(500)
			.json({error: "Internal Server Error", message: "An error occurred"});
	}
}

module.exports = UserMiddleware;
