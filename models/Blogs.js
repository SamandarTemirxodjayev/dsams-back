const {Schema, model} = require("mongoose");
const {AutoIncrement} = require("../utils/helpers");

const schema = new Schema(
	{
		_id: {
			type: Number,
		},
		photo_url: {
			type: String,
			required: true,
		},
		title_uz: {
			type: String,
			required: true,
		},
		title_ru: {
			type: String,
			required: true,
		},
		title_en: {
			type: String,
			required: true,
		},
		description_uz: {
			type: String,
			required: true,
		},
		description_ru: {
			type: String,
			required: true,
		},
		description_en: {
			type: String,
			required: true,
		},
		createdAt: {
			type: Number,
			default: Date.now(),
		},
	},
	{
		versionKey: false,
	},
);

schema.plugin(AutoIncrement, {modelName: "blog", fieldName: "_id"});

const Blogs = model("blogs", schema);

module.exports = Blogs;
