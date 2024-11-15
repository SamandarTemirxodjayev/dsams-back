const {Schema, model} = require("mongoose");
const {AutoIncrement} = require("../utils/helpers");

const adminsSchema = new Schema(
	{
		_id: {
			type: Number,
		},
		name: {
			type: String,
			required: true,
		},
		surname: {
			type: String,
			required: true,
		},
		login: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
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

adminsSchema.plugin(AutoIncrement, {modelName: "admin", fieldName: "_id"});

const Admins = model("admins", adminsSchema);

module.exports = Admins;
