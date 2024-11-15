const nodemailer = require("nodemailer");

exports.sendEmail = async (to, code) => {
	const transporter = nodemailer.createTransport({
		service: "Gmail",
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user: "uchunabu@gmail.com",
			pass: "wzyt wxhy ickj bacy",
		},
	});

	await transporter.sendMail({
		from: "HyperNova",
		to: to,
		subject: "Tasdiqlash kodi",
		text: `Shu kodni hech kimga aytmang! Uni faqat firibgarlar so'raydi! Nikomu ne soobshayte etot kod! Ego Sprashivayut tol'ko moshenniki!\n\n Tasdiqash uchun kod: ${code}`,
		html: `<b>Shu kodni hech kimga aytmang! Uni faqat firibgarlar so'raydi! Nikomu ne soobshayte etot kod! Ego Sprashivayut tol'ko moshenniki!<br /><br/> Tasdiqash uchun kod: ${code}</b>`,
	});
};
