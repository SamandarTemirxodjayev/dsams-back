const bcrypt = require("bcrypt");

exports.createHash = async (code) => {
	return await bcrypt.hash(code, 13);
};

exports.compare = async (input, hash) => {
	return await bcrypt.compare(input, hash);
};
