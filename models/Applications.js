const {Schema, model, Types} = require("mongoose");
const {AutoIncrement} = require("../utils/helpers");

const schema = new Schema(
	{
		_id: {
			type: Number,
		},
		user: {
			type: Number,
			ref: "users",
		},
		experts: {
			main: {
				id: {
					type: Number,
					ref: "experts",
				},
				rating: [
					{
						ball: {
							type: Number,
							required: true,
						},
						answer_id: {
							type: Types.ObjectId,
							required: true,
						},
					},
				],
			},
			secondary: [
				{
					id: {
						type: Number,
						ref: "experts",
					},
					rating: [
						{
							ball: {
								type: Number,
								required: true,
							},
							answer_id: {
								type: Types.ObjectId,
								required: true,
							},
						},
					],
				},
			],
		},
		company: {
			name: {
				type: String,
				required: true,
			},
			yur_address: {
				type: String,
				required: true,
			},
			real_address: {
				type: String,
				required: true,
			},
			phone_number: {
				type: Number,
				required: true,
			},
			inn: {
				type: String,
				required: true,
			},
			email: {
				type: String,
				required: true,
			},
			website: {
				type: String,
				required: true,
			},
			mfo: {
				type: Number,
				required: true,
			},
			bank_account: {
				type: Number,
				required: true,
			},
			director: {
				type: String,
				required: true,
			},
			second_director: {
				type: String,
				required: true,
			},
			workers: {
				type: String,
				required: true,
			},
			t_workers: {
				type: String,
				required: true,
			},
			s_workers: {
				type: String,
				required: true,
			},
			work_time: {
				type: String,
				required: true,
			},
			date: {
				type: Number,
			},
		},
		sektor: {
			type: Number,
			ref: "sektors",
			required: true,
		},
		standart: {
			type: Number,
			ref: "standarts",
			required: true,
		},
		answers: [
			{
				question_id: {
					type: Types.ObjectId,
					required: true,
				},
				answer_url: {
					type: String,
					required: true,
				},
			},
		],
		sertificate_url: {
			type: String,
		},
		createdAt: {
			type: Number,
			default: Date.now(),
		},
		status: {
			type: Number,
			default: 0, // 0 - created, 1 - admin was checked, 2 - experts was checked, 3 - done, -1 - cancelled
		},
	},
	{
		versionKey: false,
	},
);

schema.plugin(AutoIncrement, {modelName: "applications", fieldName: "_id"});

const Applications = model("applications", schema);

module.exports = Applications;
