const Blogs = require("../models/Blogs");
const Admins = require("../models/Superadmins");
const {createHash, compare} = require("../utils/codeHash");
const {modifyResponseByLang, paginate} = require("../utils/helpers");
const {createToken, generateHashedToken} = require("../utils/token");
const path = require("path");
const {open} = require("node:fs/promises");
const fs = require("fs/promises");
const Sektors = require("../models/Sektors");
const Standarts = require("../models/Standarts");
const Applications = require("../models/Applications");
const Sections = require("../models/Sections");
const About = require("../models/About");

exports.register = async (req, res) => {
	try {
		let hashedCode = await createHash(req.body.password.toString());
		const admin = await Admins.create({
			name: req.body.name,
			surname: req.body.surname,
			login: req.body.login,
			password: hashedCode,
		});
		await admin.save();
		return res.json({
			status: true,
			message: "success",
			data: admin,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.login = async (req, res) => {
	try {
		const admin = await Admins.findOne({
			login: req.body.login,
		});
		if (!admin) {
			return res.status(400).json({
				status: false,
				message: "Login Xato",
				data: [],
			});
		}
		const comparePassword = await compare(req.body.password, admin.password);

		if (!comparePassword) {
			return res.status(400).json({
				status: false,
				message: "Parol Xato",
				data: [],
			});
		}
		const token = createToken(admin._id);
		const cdnToken = generateHashedToken(admin._id);
		return res.json({
			status: true,
			message: "success",
			data: {
				cdn_token: cdnToken,
				auth_token: token,
				token_type: "bearer",
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
			data: req.admin,
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
		const admin = await Admins.findByIdAndUpdate(req.admin._id, req.body, {
			new: true,
		});
		return res.json({
			status: true,
			message: "edit Me",
			data: admin,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.createBlog = async (req, res) => {
	try {
		const blog = await Blogs.create(req.body);
		return res.json({
			status: true,
			message: "blog created",
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
exports.editBlogById = async (req, res) => {
	try {
		let blog = await Blogs.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});

		if (!blog) {
			return res.status(404).json({
				status: false,
				message: "blog is not found",
				data: null,
			});
		}

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
exports.deleteBlogById = async (req, res) => {
	try {
		let blog = await Blogs.findByIdAndDelete(req.params.id);
		if (!blog) {
			return res.status(404).json({
				status: false,
				message: "blog is not found",
				data: null,
			});
		}

		return res.json({
			status: true,
			message: "Success deleted",
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

exports.updateAbout = async (req, res) => {
	try {
		const {
			title_uz,
			title_ru,
			title_en,
			description_uz,
			description_ru,
			description_en,
			photo_url,
		} = req.body;

		// Find the existing about document or create a new one
		let about = await About.findOne();

		if (about) {
			// Update existing document
			about.title_uz = title_uz;
			about.title_ru = title_ru;
			about.title_en = title_en;
			about.description_uz = description_uz;
			about.description_ru = description_ru;
			about.description_en = description_en;
			about.photo_url = photo_url;
		} else {
			// Create new document
			about = new About({
				title_uz,
				title_ru,
				title_en,
				description_uz,
				description_ru,
				description_en,
				photo_url,
			});
		}

		await about.save();

		return res.json({
			status: true,
			message: "About updated successfully",
			data: about,
		});
	} catch (error) {
		console.error("Error updating about:", error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};

exports.createSektor = async (req, res) => {
	try {
		const sektor = await Sektors.create(req.body);
		return res.json({
			status: true,
			message: "sektor created",
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
exports.getSektors = async (req, res) => {
	try {
		let {page = 1, limit = 10, lang} = req.query;
		page = parseInt(page);
		limit = parseInt(limit);
		const skip = (page - 1) * limit;
		let sektors = await Sektors.find().skip(skip).limit(limit);
		const total = await Sektors.countDocuments();
		sektors = modifyResponseByLang(sektors, lang, ["name"]);
		const response = paginate(
			page,
			limit,
			total,
			sektors,
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
		let {lang} = req.query;
		let sektor = await Sektors.findById(req.params.id);
		if (!sektor) {
			return res.status(404).json({
				status: false,
				message: "sektor is not found",
				data: null,
			});
		}
		sektor = modifyResponseByLang(sektor, lang, ["name"]);

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
exports.editSektorById = async (req, res) => {
	try {
		let sektor = await Sektors.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});

		if (!sektor) {
			return res.status(404).json({
				status: false,
				message: "sektor is not found",
				data: null,
			});
		}

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
exports.deleteSektorById = async (req, res) => {
	try {
		let sektor = await Sektors.findByIdAndDelete(req.params.id);
		if (!sektor) {
			return res.status(404).json({
				status: false,
				message: "sektor is not found",
				data: null,
			});
		}

		return res.json({
			status: true,
			message: "Success deleted",
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
exports.createSection = async (req, res) => {
	try {
		const section = await Sections.create(req.body);
		return res.json({
			status: true,
			message: "sektor created",
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
exports.getSections = async (req, res) => {
	try {
		let {page = 1, limit = 10, lang, filter = {}} = req.query;
		page = parseInt(page);
		limit = parseInt(limit);
		const skip = (page - 1) * limit;
		let sections = await Sections.find({...filter})
			.skip(skip)
			.limit(limit)
			.populate("sektor");
		const total = await Sections.countDocuments({...filter});
		sections = modifyResponseByLang(sections, lang, ["name", "sektor.name"]);
		const response = paginate(
			page,
			limit,
			total,
			sections,
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
		let {lang} = req.query;
		let section = await Sections.findById(req.params.id).populate("sektor");
		if (!section) {
			return res.status(404).json({
				status: false,
				message: "section is not found",
				data: null,
			});
		}
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
exports.editSectionById = async (req, res) => {
	try {
		let section = await Sections.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});

		if (!section) {
			return res.status(404).json({
				status: false,
				message: "section is not found",
				data: null,
			});
		}

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
exports.deleteSectionById = async (req, res) => {
	try {
		let section = await Sections.findByIdAndDelete(req.params.id);
		if (!section) {
			return res.status(404).json({
				status: false,
				message: "section is not found",
				data: null,
			});
		}

		return res.json({
			status: true,
			message: "Success deleted",
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
exports.createStandart = async (req, res) => {
	try {
		const standart = await Standarts.create(req.body);
		return res.json({
			status: true,
			message: "standart created",
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
			"sektor.name",
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
exports.editStandartById = async (req, res) => {
	try {
		let standart = await Standarts.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});

		if (!standart) {
			return res.status(404).json({
				status: false,
				message: "standart is not found",
				data: null,
			});
		}

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
exports.deleteStandartById = async (req, res) => {
	try {
		let standart = await Standarts.findByIdAndDelete(req.params.id);
		if (!standart) {
			return res.status(404).json({
				status: false,
				message: "standart is not found",
				data: null,
			});
		}

		return res.json({
			status: true,
			message: "Success deleted",
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
exports.getApplications = async (req, res) => {
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
exports.getApplicationById = async (req, res) => {
	try {
		let {lang} = req.query;
		let application = await Applications.findById(req.params.id)
			.populate("experts.main.id")
			.populate("experts.secondary.id")
			.populate("sektor")
			.populate("standart")
			.populate("user");

		application = modifyResponseByLang(application, lang, [
			"sektor.name",
			"standart.short_description",
			"standart.description",
			"standart.questions.title",
			"standart.questions.description",
		]);

		return res.json({
			status: true,
			message: "success",
			data: application,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.cancelApplication = async (req, res) => {
	try {
		let application = await Applications.findById(req.params.id);
		if (!application) {
			return res.status(404).json({
				status: false,
				message: "application is not found",
				data: null,
			});
		}
		application.status = -1;
		await application.save();
		return res.json({
			status: true,
			message: "Success cancelled",
			data: application,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.submitApplication = async (req, res) => {
	try {
		let application = await Applications.findById(req.params.id);
		if (!application) {
			return res.status(404).json({
				status: false,
				message: "application is not found",
				data: null,
			});
		}
		application.status = 1;
		await application.save();
		return res.json({
			status: true,
			message: "Success",
			data: application,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.doneApplication = async (req, res) => {
	try {
		let application = await Applications.findById(req.params.id);
		if (!application) {
			return res.status(404).json({
				status: false,
				message: "application is not found",
				data: null,
			});
		}
		application.status = 3;
		application.sertificate_url = req.body.sertificate_url;
		await application.save();
		return res.json({
			status: true,
			message: "Success",
			data: application,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
