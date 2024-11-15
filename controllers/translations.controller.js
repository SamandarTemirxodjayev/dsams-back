const {updateOrAddObject, deleteObject} = require("../utils/db.updater");
const path = require("path");
const {open} = require("node:fs/promises");

exports.findByLang = async (req, res) => {
	const filePath = path.join(
		__dirname,
		"../database",
		`${req.params.lang}-lang.json`,
	);
	try {
		let filehandle = await open(filePath, "r");
		let data = "";
		for await (const line of filehandle.readLines()) {
			data += line;
		}
		return res.json({
			status: true,
			message: "success",
			data: JSON.parse(data),
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.createLang = async (req, res) => {
	try {
		await updateOrAddObject(
			`./database/${req.params.lang}-lang.json`,
			req.body,
		);
		return res.json({
			status: true,
			message: "success",
			data: {
				message: "add successfully",
			},
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.deleteObj = async (req, res) => {
	try {
		await deleteObject(
			`./database/${req.params.lang}-lang.json`,
			req.params.name,
		);
		return res.json({
			status: true,
			message: "success",
			data: {
				message: "deleted successfully",
			},
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
