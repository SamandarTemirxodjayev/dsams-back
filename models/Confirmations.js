const {Schema, model} = require("mongoose");

const schema = new Schema({
	type: {
		type: String,
		required: true,
	},
	uuid: {
		type: String,
		required: true,
	},
	code: {
		type: String,
		required: true,
	},
	oldData: {
		type: String,
		default: null,
	},
	data: {
		type: String,
		required: true,
	},
	expiredAt: {
		type: Date,
		required: true,
	},
});

schema.set("timestamps", true);

schema.statics.checkAndDeleteExpired = async function (uuid) {
	const confirmation = await this.findOne({uuid});

	if (!confirmation) {
		return {expired: true};
	}

	if (confirmation.expiredAt < new Date()) {
		await this.findByIdAndDelete(confirmation._id);
		return {expired: true};
	}

	return {expired: false, confirmation: confirmation};
};

const Confirmations = model("confirmations", schema);

module.exports = Confirmations;
