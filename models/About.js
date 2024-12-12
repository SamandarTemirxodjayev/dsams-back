const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema(
	{
		title_uz: {type: String, required: true},
		title_ru: {type: String, required: true},
		title_en: {type: String, required: true},
		description_uz: {type: String, required: true},
		description_ru: {type: String, required: true},
		description_en: {type: String, required: true},
		photo_url: {type: String, required: true},
		updatedAt: {type: Date, default: Date.now},
	},
	{timestamps: true},
);

// Ensure only one document exists
aboutSchema.pre("save", async function (next) {
	if (this.isNew) {
		const count = await this.constructor.countDocuments();
		if (count > 0) {
			const error = new Error("Only one About document can exist");
			next(error);
		}
	}
	next();
});

module.exports = mongoose.model("About", aboutSchema);
