const Counter = require("../models/Counter");
exports.AutoIncrement = function (schema, options) {
	const {modelName, fieldName, startAt = 1} = options; // Added startAt with a default value

	schema.pre("save", async function (next) {
		if (this.isNew) {
			try {
				const counter = await Counter.findOneAndUpdate(
					{model: modelName, field: fieldName},
					{$inc: {count: 1}},
					{new: true, upsert: true, setDefaultsOnInsert: true},
				);

				if (counter.count === 1 && startAt > 1) {
					// Initialize counter with startAt if it’s the first document and startAt is greater than 1
					await Counter.updateOne(
						{model: modelName, field: fieldName},
						{$set: {count: startAt}},
					);
					this[fieldName] = startAt;
				} else {
					this[fieldName] = counter.count;
				}

				next();
			} catch (err) {
				next(err);
			}
		} else {
			next();
		}
	});
};
exports.modifyResponseByLang = (data, lang, keys = []) => {
	const acceptedLangs = ["uz", "ru", "en"];

	const mapObjectByLang = (obj) => {
		// Convert the document into a plain object if it's a Mongoose document
		const modifiedObj = JSON.parse(JSON.stringify(obj));

		// If lang is valid, map fields to specific language, else return all languages
		if (acceptedLangs.includes(lang)) {
			keys.forEach((key) => {
				// Handle nested fields for populated data, like 'category.name'
				const keyParts = key.split(".");
				if (keyParts.length > 1) {
					const [parentKey, childKey] = keyParts;
					if (modifiedObj[parentKey]) {
						if (Array.isArray(modifiedObj[parentKey])) {
							// If it's an array, iterate over each item
							modifiedObj[parentKey].forEach((item) => {
								if (item && item[`${childKey}_${lang}`]) {
									item[childKey] = item[`${childKey}_${lang}`];
									// Delete other language-specific fields
									delete item[`${childKey}_uz`];
									delete item[`${childKey}_ru`];
									delete item[`${childKey}_en`];
								}
							});
						} else if (modifiedObj[parentKey][`${childKey}_${lang}`]) {
							// If it's not an array, handle it as before
							modifiedObj[parentKey][childKey] =
								modifiedObj[parentKey][`${childKey}_${lang}`];
							// Delete language-specific fields
							delete modifiedObj[parentKey][`${childKey}_uz`];
							delete modifiedObj[parentKey][`${childKey}_ru`];
							delete modifiedObj[parentKey][`${childKey}_en`];
						}
					}
				} else {
					if (modifiedObj[`${key}_${lang}`]) {
						// Assign the language-specific field
						modifiedObj[key] = modifiedObj[`${key}_${lang}`];

						// Delete other language-specific fields
						delete modifiedObj[`${key}_uz`];
						delete modifiedObj[`${key}_ru`];
						delete modifiedObj[`${key}_en`];
					}
				}
			});
		}
		return modifiedObj;
	};

	// Handle arrays of objects or single objects
	if (Array.isArray(data)) {
		return data.map((item) => mapObjectByLang(item));
	} else {
		return mapObjectByLang(data);
	}
};
exports.paginate = (
	page,
	limit,
	totalItems,
	data,
	baseUrl,
	path,
	additionalParams = "",
) => {
	const totalPages = Math.ceil(totalItems / limit);

	return {
		status: true,
		message: "success",
		data,
		_meta: {
			totalItems,
			currentPage: page,
			itemsPerPage: limit,
			totalPages,
		},
		_links: {
			self: `${baseUrl}${path}?page=${page}&limit=${limit}${additionalParams}`,
			next:
				page < totalPages
					? `${baseUrl}${path}?page=${
							page + 1
					  }&limit=${limit}${additionalParams}`
					: null,
			prev:
				page > 1
					? `${baseUrl}${path}?page=${
							page - 1
					  }&limit=${limit}${additionalParams}`
					: null,
		},
	};
};
