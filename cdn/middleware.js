const jwt = require("jsonwebtoken");
const Superadmins = require("../models/Superadmins");
const {isTokenValid} = require("../utils/token");
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
		const user = await Superadmins.findById(decoded);
		if (!user) {
			return res
				.status(401)
				.json({error: "Not Authorized!", message: "Invalid access token"});
		}
		req.admin = user;
		const hashedToken = req.headers.hash;
		if (!hashedToken) {
			return res
				.status(401)
				.json({error: "no hashed", message: "Invalid hash token"});
		}
		const isValid = isTokenValid(hashedToken, req.admin._id);
		if (isValid) {
			return next();
		} else {
			return res
				.status(401)
				.json({error: "no hashed", message: "Invalid hash token"});
		}
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
