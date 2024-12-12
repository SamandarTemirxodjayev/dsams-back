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
const Sections = require("../models/Sections");
const Experts = require("../models/Experts");
const About = require("../models/About");

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
	const {lang} = req.query;

	try {
		let about = await About.findOne();

		if (!about) {
			return res.status(404).json({
				status: false,
				message: "About data not found",
			});
		}

		about = modifyResponseByLang(about, lang, ["title", "description"]);

		return res.json({
			status: true,
			message: "success",
			data: about,
		});
	} catch (error) {
		console.error(error);
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
		let standarts = await Standarts.find().skip(skip).limit(limit);
		const total = await Standarts.countDocuments();
		standarts = modifyResponseByLang(standarts, lang, [
			"short_description",
			"description",
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
		let standart = await Standarts.findById(req.params.id);
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
		});

		standarts = modifyResponseByLang(standarts, lang, [
			"short_description",
			"description",
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
			.limit(limit);
		const total = await Standarts.countDocuments({sektor: req.params.id});
		standarts = modifyResponseByLang(standarts, lang, [
			"short_description",
			"description",
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
					from: "sections",
					localField: "_id",
					foreignField: "sektor",
					as: "sections",
				},
			},
		]);

		const total = await Sektors.countDocuments();

		const modifiedSektors = modifyResponseByLang(sektors, lang, [
			"name",
			"sections.name",
		]);

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

		// Find the sektor by ID
		let sektor = await Sektors.findById(id);
		if (!sektor) {
			return res.status(404).json({
				status: false,
				message: "Sektor not found",
			});
		}

		// Modify the sektor response based on language
		sektor = modifyResponseByLang(sektor, lang, ["name"]);

		// Find sections associated with the sektor ID
		const sections = await Sections.find({sektor: id});
		const modifiedSections = sections.map((section) =>
			modifyResponseByLang(section, lang, ["name"]),
		);

		// Return response
		return res.json({
			status: true,
			message: "Success",
			data: {
				sektor,
				sections: modifiedSections,
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
		let sektors = await Sektors.aggregate([
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
					from: "sections",
					localField: "_id",
					foreignField: "sektor",
					as: "sections",
				},
			},
		]);

		// Modify the sektor data and associated standarts based on the language
		sektors = modifyResponseByLang(sektors, lang, ["name", "sections.name"]);

		return res.json({
			status: true,
			message: "Success",
			data: sektors,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.getSections = async (req, res) => {
	try {
		let {page = 1, limit = 10, lang} = req.query;
		page = parseInt(page);
		limit = parseInt(limit);
		const skip = (page - 1) * limit;

		const sektors = await Sections.find()
			.skip(skip)
			.limit(limit)
			.populate("sektor");

		const total = await Sections.countDocuments();

		const modifiedSektor = modifyResponseByLang(sektors, lang, [
			"name",
			"sektor.name",
		]);

		const response = paginate(
			page,
			limit,
			total,
			modifiedSektor,
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
exports.getSectionById = async (req, res) => {
	try {
		const {lang} = req.query;
		const {id} = req.params;

		// Use aggregation to find the specific Sektor and include associated Standarts
		let section = await Sections.findById(id).populate("sektor");

		section = modifyResponseByLang(section, lang, ["name", "sektor.name"]);

		return res.json({
			status: true,
			message: "Success",
			data: section,
		});
	} catch (error) {
		console.log(error);
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
exports.getApplications = async (req, res) => {
	try {
		let {page = 1, limit = 10, filter = {}, lang} = req.query;
		page = parseInt(page);
		limit = parseInt(limit);
		const skip = (page - 1) * limit;

		let applications = await Applications.find({...filter, user: req.user._id})
			.skip(skip)
			.limit(limit)
			.populate("experts.main.id")
			.populate("experts.secondary.id")
			.populate("sektor")
			.populate("standart")
			.populate("user");

		const total = await Applications.countDocuments({
			...filter,
			user: req.user._id,
		});

		applications = modifyResponseByLang(applications, lang, [
			"sektor.name",
			"standart.short_description",
			"standart.description",
			"standart.questions.title",
			"standart.questions.description",
		]);
		const response = paginate(
			page,
			limit,
			total,
			applications,
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
exports.getExperts = async (req, res) => {
	try {
		let {page = 1, limit = 10} = req.query;
		page = parseInt(page);
		limit = parseInt(limit);
		const skip = (page - 1) * limit;
		let experts = await Experts.find().skip(skip).limit(limit);
		const total = await Experts.countDocuments();
		const response = paginate(
			page,
			limit,
			total,
			experts,
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
exports.getAllApplications = async (req, res) => {
	try {
		let {page = 1, limit = 10, filter = {}, lang} = req.query;
		page = parseInt(page);
		limit = parseInt(limit);
		const skip = (page - 1) * limit;

		let applications = await Applications.find({...filter})
			.skip(skip)
			.limit(limit)
			.populate("experts.main.id")
			.populate("experts.secondary.id")
			.populate("sektor")
			.populate("standart")
			.populate("user");

		const total = await Applications.countDocuments({...filter});

		applications = modifyResponseByLang(applications, lang, [
			"sektor.name",
			"standart.short_description",
			"standart.description",
			"standart.questions.title",
			"standart.questions.description",
		]);
		const response = paginate(
			page,
			limit,
			total,
			applications,
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
exports.getAllApplicationsSearch = async (req, res) => {
	try {
		const {text, lang} = req.query;

		if (!text) {
			return res.status(400).json({
				status: false,
				message: "Search query is required",
			});
		}

		let applications = await Applications.find({
			"company.name": {$regex: text, $options: "i"},
		})
			.populate("experts.main.id")
			.populate("experts.secondary.id")
			.populate("sektor")
			.populate("standart")
			.populate("user");

		applications = modifyResponseByLang(applications, lang, [
			"sektor.name",
			"standart.short_description",
			"standart.description",
			"standart.questions.title",
			"standart.questions.description",
		]);

		return res.json({
			status: true,
			message: "success",
			data: applications,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
