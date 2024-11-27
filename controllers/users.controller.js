const Confirmations = require("../models/Confirmations");
const Users = require("../models/Users");
const {v4: uuidv4} = require("uuid");
const bcrypt = require("bcrypt");
const {sendEmail} = require("../utils/mail");
const {createToken} = require("../utils/token");
const Blogs = require("../models/Blogs");
const {modifyResponseByLang, paginate} = require("../utils/helpers");
const path = require("path");
const {open} = require("node:fs/promises");
const fs = require("fs/promises");
const Standarts = require("../models/Standarts");
const Sektors = require("../models/Sektors");
const Applications = require("../models/Applications");

exports.loginOrRegsiter = async (req, res) => {
	try {
		const {email} = req.body;
		if (!email) {
			return res.status(500).json({
				status: false,
				message: "Please enter email",
			});
		}
		let confirmationw = await Confirmations.findOne({data: email});

		if (confirmationw) {
			let {expired, confirmation} = await Confirmations.checkAndDeleteExpired(
				confirmationw.uuid,
			);
			if (!expired) {
				return res.status(400).json({
					status: "waiting",
					message: "Confirmation already exists",
					data: {
						id: confirmation._id,
						uuid: confirmation.uuid,
						type: confirmation.type,
						createdAt: confirmation.createdAt,
						expiredAt: confirmation.expiredAt,
					},
				});
			}
		}

		const id = uuidv4();
		let code = Math.floor(1000 + Math.random() * 9000);
		await sendEmail(email, code);
		let hashedCode = await bcrypt.hash(code.toString(), 13);
		const newConfirmation = new Confirmations({
			type: "email",
			code: hashedCode,
			uuid: id,
			data: email,
			expiredAt: new Date(Date.now() + 1000 * 2 * 60),
		});
		await newConfirmation.save();
		return res.json({
			status: true,
			message: "SMS sent",
			data: {
				id: newConfirmation._id,
				uuid: id,
				type: "email",
				createdAt: newConfirmation.createdAt,
				expiredAt: newConfirmation.expiredAt,
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
exports.submitloginOrRegsiter = async (req, res) => {
	try {
		const {uuid} = req.params;
		const {code} = req.body;
		const confirmations = await Confirmations.findOne({uuid});
		if (!confirmations) {
			return res.status(404).json({
				status: "error",
				message: "Confirmation not found",
			});
		}
		const {expired, confirmation} = await Confirmations.checkAndDeleteExpired(
			uuid,
		);

		if (expired) {
			return res.status(400).json({
				status: "error",
				message: "Confirmation expired. send new code",
			});
		}

		const isMatch = await bcrypt.compare(code.toString(), confirmation.code);
		if (!isMatch) {
			return res.status(400).json({
				status: "error",
				message: "Invalid code",
			});
		}
		let user = await Users.findOne({email: confirmation.data});
		if (!user) {
			user = await Users.create({
				email: confirmation.data,
			});
		}

		await Confirmations.findOneAndDelete({uuid});

		const token = createToken(user._id);

		return res.json({
			status: true,
			message: "Confirmed",
			data: {
				auth_token: token,
				token_type: "bearer",
				createdAt: new Date(),
				expiredAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
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
exports.getMe = async (req, res) => {
	try {
		return res.json({
			status: true,
			message: "Get Me",
			data: req.user,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.editProfile = async (req, res) => {
	try {
		const user = await Users.findByIdAndUpdate(req.user._id, req.body, {
			new: true,
		});
		return res.json({
			status: true,
			message: "Get Me",
			data: user,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.getBlogs = async (req, res) => {
	try {
		let {page = 1, limit = 10, lang} = req.query;
		page = parseInt(page);
		limit = parseInt(limit);
		const skip = (page - 1) * limit;
		let blogs = await Blogs.find().skip(skip).limit(limit);
		const total = await Blogs.countDocuments();
		blogs = modifyResponseByLang(blogs, lang, ["title", "description"]);
		const response = paginate(page, limit, total, blogs, req.baseUrl, req.path);

		return res.json(response);
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.getBlogById = async (req, res) => {
	try {
		let {lang} = req.query;
		let blog = await Blogs.findById(req.params.id);
		if (!blog) {
			return res.status(404).json({
				status: false,
				message: "blog is not found",
				data: null,
			});
		}
		blog = modifyResponseByLang(blog, lang, ["title", "description"]);

		return res.json({
			status: true,
			message: "Success",
			data: blog,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};

exports.getAbout = async (req, res) => {
	let {lang} = req.query;
	const filePath = path.join(__dirname, "../database", `about.json`);
	try {
		let filehandle = await open(filePath, "r");
		let data = "";
		for await (const line of filehandle.readLines()) {
			data += line;
		}
		data = modifyResponseByLang(JSON.parse(data), lang, [
			"title",
			"description",
		]);
		return res.json({
			status: true,
			message: "success",
			data,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.getStandarts = async (req, res) => {
	try {
		let {page = 1, limit = 10, lang} = req.query;
		page = parseInt(page);
		limit = parseInt(limit);
		const skip = (page - 1) * limit;
		let standarts = await Standarts.find()
			.skip(skip)
			.limit(limit)
			.populate("sektor");
		const total = await Standarts.countDocuments();
		standarts = modifyResponseByLang(standarts, lang, [
			"short_description",
			"description",
			"sektor.name",
			"questions.title",
			"questions.description",
		]);
		const response = paginate(
			page,
			limit,
			total,
			standarts,
			req.baseUrl,
			req.path,
		);

		return res.json(response);
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.getStandartById = async (req, res) => {
	try {
		let {lang} = req.query;
		let standart = await Standarts.findById(req.params.id).populate("sektor");
		if (!standart) {
			return res.status(404).json({
				status: false,
				message: "standart is not found",
				data: null,
			});
		}
		standart = modifyResponseByLang(standart, lang, [
			"short_description",
			"description",
			"sektor.name",
			"questions.title",
			"questions.description",
		]);

		return res.json({
			status: true,
			message: "Success",
			data: standart,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.searchStandarts = async (req, res) => {
	try {
		const {text, lang} = req.query;

		if (!text) {
			return res.status(400).json({
				status: false,
				message: "Search query is required",
			});
		}

		let standarts = await Standarts.find({
			name: {$regex: text, $options: "i"},
		}).populate("sektor");

		standarts = modifyResponseByLang(standarts, lang, [
			"short_description",
			"description",
			"sektor.name",
			"questions.title",
			"questions.description",
		]);

		return res.json({
			status: true,
			message: "success",
			data: standarts,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.getStandartBySektorId = async (req, res) => {
	try {
		let {page = 1, limit = 10, lang} = req.query;
		page = parseInt(page);
		limit = parseInt(limit);
		const skip = (page - 1) * limit;
		let standarts = await Standarts.find({sektor: req.params.id})
			.skip(skip)
			.limit(limit)
			.populate("sektor");
		const total = await Standarts.countDocuments({sektor: req.params.id});
		standarts = modifyResponseByLang(standarts, lang, [
			"short_description",
			"description",
			"sektor.name",
			"questions.title",
			"questions.description",
		]);
		const response = paginate(
			page,
			limit,
			total,
			standarts,
			req.baseUrl,
			req.path,
		);

		return res.json(response);
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.getSektors = async (req, res) => {
	try {
		let {page = 1, limit = 10, lang} = req.query;
		page = parseInt(page);
		limit = parseInt(limit);
		const skip = (page - 1) * limit;

		const sektors = await Sektors.aggregate([
			{$skip: skip},
			{$limit: limit},
			{
				$lookup: {
					from: "standarts",
					localField: "_id",
					foreignField: "sektor",
					as: "standarts",
				},
			},
		]);

		const total = await Sektors.countDocuments();

		const modifiedSektors = sektors.map((sektor) => {
			const modifiedSektor = modifyResponseByLang([sektor], lang, ["name"])[0];
			modifiedSektor.standarts = modifyResponseByLang(sektor.standarts, lang, [
				"name",
				"short_description",
				"description",
			]);
			return modifiedSektor;
		});

		const response = paginate(
			page,
			limit,
			total,
			modifiedSektors,
			req.baseUrl,
			req.path,
		);

		return res.json(response);
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.getSektorById = async (req, res) => {
	try {
		const {lang} = req.query;
		const {id} = req.params;

		// Use aggregation to find the specific Sektor and include associated Standarts
		const sektorData = await Sektors.aggregate([
			{$match: {_id: parseInt(id)}},
			{
				$lookup: {
					from: "standarts",
					localField: "_id",
					foreignField: "sektor",
					as: "standarts",
				},
			},
		]);

		if (!sektorData.length) {
			return res.status(404).json({
				status: false,
				message: "Sektor not found",
				data: null,
			});
		}

		let sektor = modifyResponseByLang(sektorData, lang, ["name"])[0];
		sektor.standarts = modifyResponseByLang(sektor.standarts, lang, [
			"name",
			"short_description",
			"description",
		]);

		return res.json({
			status: true,
			message: "Success",
			data: sektor,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.searchSektors = async (req, res) => {
	try {
		const {text, lang} = req.query;

		if (!text) {
			return res.status(400).json({
				status: false,
				message: "Search query is required",
			});
		}

		// Use aggregation to search sectors and include associated standards
		const sektors = await Sektors.aggregate([
			{
				$match: {
					$or: [
						{name_uz: {$regex: text, $options: "i"}},
						{name_ru: {$regex: text, $options: "i"}},
						{name_en: {$regex: text, $options: "i"}},
					],
				},
			},
			{
				$lookup: {
					from: "standarts",
					localField: "_id",
					foreignField: "sektor",
					as: "standarts",
				},
			},
		]);

		// Modify the sektor data and associated standarts based on the language
		const modifiedSektors = sektors.map((sektor) => {
			const modifiedSektor = modifyResponseByLang([sektor], lang, ["name"])[0];
			modifiedSektor.standarts = modifyResponseByLang(sektor.standarts, lang, [
				"name",
				"short_description",
				"description",
			]);
			return modifiedSektor;
		});

		return res.json({
			status: true,
			message: "Success",
			data: modifiedSektors,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.createApplication = async (req, res) => {
	try {
		const application = await Applications.create({
			user: req.user._id,
			...req.body,
		});
		return res.json({
			status: true,
			message: "Success",
			data: application,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
