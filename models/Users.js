const {Schema, model} = require("mongoose");
const {AutoIncrement} = require("../utils/helpers");

const schema = new Schema(
	{
		_id: {
			type: Number,
		},
		email: {
			type: String,
			required: true,
		},
		photo_url: {
			type: String,
		},
		name: {
			type: String,
		},
		surname: {
			type: String,
		},
		father_name: {
			type: String,
		},
		phone_number: {
			type: Number,
		},
		position: {
			type: String,
		},
		sex: {
			type: String,
			enum: ["male", "female"],
		},
		birth_date: {
			type: Number,
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

schema.plugin(AutoIncrement, {modelName: "users", fieldName: "_id"});

const Users = model("users", schema);

module.exports = Users;
