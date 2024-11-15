const path = require("path");
const multer = require("multer");
const Files = require("./models/Files");
const {default: mongoose} = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

exports.index = async (req, res) => {
	res.json({message: "Storage", version: "1.0.0"});
};
exports.upload = async (req, res) => {
	try {
		const publicFolderPath = `./cdn/public/`;

		const storage = multer.diskStorage({
			destination: publicFolderPath,
			filename: (req, file, cb) => {
				const fileId = new mongoose.Types.ObjectId();
				const fileExtension = path.extname(file.originalname);
				const fileName = `${fileId}${fileExtension}`;
				cb(null, fileName);
			},
		});

		const upload = multer({storage}).single("file");
		upload(req, res, async (err) => {
			if (err) {
				console.error("Error handling file upload:", err);
				return res.status(500).json({message: "Error uploading the file"});
			}

			if (!req.file) {
				return res.status(400).json({message: "No file provided"});
			}

			const file_name = req.file.filename;
			const file_id = path.basename(
				req.file.filename,
				path.extname(req.file.filename),
			); // Get the newly generated filename

			const file_url = `${process.env.SITE_URL}${file_name}`;

			const files = await Files.create({
				file_name,
				file_id,
				file_url,
				admin_id: req.admin._id,
			});
			await files.save();

			return res.status(200).json({
				message: "File uploaded",
				status: 200,
				data: files,
			});
		});
	} catch (error) {
		return res.status(500).json({message: error.message});
	}
};
