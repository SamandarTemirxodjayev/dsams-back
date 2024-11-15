const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

exports.createToken = (user) => {
	try {
		const now = new Date();
		const expirationDate = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate() + 1,
			0,
			0,
			0,
			0,
		); // End of today
		const expiresIn = Math.floor((expirationDate - now) / 1000); // Time in seconds until expiration

		return jwt.sign(
			{
				_id: user,
			},
			process.env.ACCESS_TOKEN,
			{expiresIn},
		);
	} catch (error) {
		console.error("Error creating token:", error);
		return null;
	}
};
exports.generateHashedToken = (data) => {
	const today = new Date().toISOString().split("T")[0];

	const token = `${today}:${data}`;

	const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

	return hashedToken;
};
exports.isTokenValid = (hashedToken, data) => {
	const today = new Date().toISOString().split("T")[0];
	const tokenToCheck = `${today}:${data}`;
	const expectedHashedToken = crypto
		.createHash("sha256")
		.update(tokenToCheck)
		.digest("hex");

	return hashedToken === expectedHashedToken;
};
