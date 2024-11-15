const Confirmations = require("../models/Confirmations.js");
const bcrypt = require("bcrypt");
const Experts = require("../models/Experts.js");
const {v4: uuidv4} = require("uuid");
const {sendEmail} = require("../utils/mail.js");
const {createToken} = require("../utils/token.js");
const Applications = require("../models/Applications.js");
const {modifyResponseByLang, paginate} = require("../utils/helpers.js");

exports.loginOrRegsiter = async (req, res) => {
	try {
		const {email} = req.body;
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
		let user = await Experts.findOne({email: confirmation.data});
		if (!user) {
			user = await Experts.create({
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
			data: req.expert,
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
		const expert = await Experts.findByIdAndUpdate(req.expert._id, req.body, {
			new: true,
		});
		return res.json({
			status: true,
			message: "Get Me",
			data: expert,
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
		const response = paginate(1, 1, 1, application, req.baseUrl, req.path);

		return res.json(response);
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
exports.addRatingForApplication = async (req, res) => {
	try {
		// Find the application by ID
		const application = await Applications.findById(req.params.id);
		if (!application) {
			return res.status(404).json({
				status: false,
				message: "Application not found",
			});
		}

		// Extract the rating ball and answer_id from the request body
		const {ball, answer_id} = req.body;
		let expertFound = false;

		// Check if the expert is the main expert
		if (application.experts.main.id === req.expert._id) {
			// Add the rating to the main expert's ratings
			application.experts.main.rating.push({ball, answer_id});
			expertFound = true;
		} else {
			// Check if the expert is a secondary expert
			const secondaryExpert = application.experts.secondary.find(
				(sec) => sec.id === req.expert._id,
			);

			if (secondaryExpert) {
				// Add the rating to the secondary expert's ratings
				secondaryExpert.rating.push({ball, answer_id});
				expertFound = true;
			}
		}

		// If the expert was not found in either main or secondary, return an error
		if (!expertFound) {
			return res.status(400).json({
				status: false,
				message: "Expert not found in application",
			});
		}

		// Check if all experts have submitted ratings
		const allExpertsRated = [
			// Check if the main expert has submitted at least one rating
			application.experts.main.rating.length > 0,
			// Check if each secondary expert has submitted at least one rating
			...application.experts.secondary.map((sec) => sec.rating.length > 0),
		].every(Boolean); // `every` ensures all conditions are `true`

		// If all experts have rated, update the status to 2
		if (allExpertsRated) {
			application.status = 2;
		}

		// Save the updated application
		await application.save();

		return res.status(200).json({
			status: true,
			message: "Rating added successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: false,
			message: error.message,
		});
	}
};
