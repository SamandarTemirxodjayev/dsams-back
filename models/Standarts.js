const {Schema, model} = require("mongoose");
const {AutoIncrement} = require("../utils/helpers");

const schema = new Schema(
	{
		_id: {
			type: Number,
		},
		name: {
			type: String,
			required: true,
		},
		photo_url: {
			type: String,
			required: true,
		},
		short_description_uz: {
			type: String,
			required: true,
		},
		short_description_ru: {
			type: String,
			required: true,
		},
		short_description_en: {
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
		creation_date: {
			type: Number,
			required: true,
		},
		questions: [
			{
				title_uz: {
					type: String,
				},
				title_ru: {
					type: String,
				},
				title_en: {
					type: String,
				},
				description_uz: {
					type: String,
				},
				description_ru: {
					type: String,
				},
				description_en: {
					type: String,
				},
			},
		],
		createdAt: {
			type: Number,
			default: Date.now(),
		},
	},
	{
		versionKey: false,
	},
);

schema.plugin(AutoIncrement, {modelName: "standarts", fieldName: "_id"});

const Standarts = model("standarts", schema);

module.exports = Standarts;
