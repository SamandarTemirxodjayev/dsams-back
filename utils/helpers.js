const Counter = require("../models/Counter");
const {ACCEPTED_LANGS} = require("./constants");
const {
	getNestedValue,
	setNestedValue,
	cleanupLangFields,
} = require("./objectUtils");
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
const processNestedObject = (obj, lang, baseKey) => {
	if (!obj) return;

	// Handle direct language fields
	const langValue = obj[`${baseKey}_${lang}`];
	if (langValue !== undefined) {
		obj[baseKey] = langValue;
		cleanupLangFields(obj, baseKey);
	}

	// Process nested arrays
	Object.keys(obj).forEach((key) => {
		if (Array.isArray(obj[key])) {
			obj[key].forEach((item) => {
				if (item && typeof item === "object") {
					processNestedObject(item, lang, baseKey);
				}
			});
		} else if (obj[key] && typeof obj[key] === "object") {
			processNestedObject(obj[key], lang, baseKey);
		}
	});
};

const processField = (obj, key, lang) => {
	if (!obj || !key || !lang) return;

	const keyParts = key.split(".");
	const baseKey = keyParts[keyParts.length - 1];
	const parentPath = keyParts.slice(0, -1).join(".");

	const processValue = (target) => {
		if (!target) return;

		if (Array.isArray(target)) {
			target.forEach((item) => processValue(item));
			return;
		}

		// Process the current level
		const langValue = target[`${baseKey}_${lang}`];
		if (langValue !== undefined) {
			target[baseKey] = langValue;
			cleanupLangFields(target, baseKey);
		}

		// Process all nested objects and arrays
		Object.keys(target).forEach((targetKey) => {
			const value = target[targetKey];
			if (Array.isArray(value)) {
				value.forEach((item) => {
					if (item && typeof item === "object") {
						processNestedObject(item, lang, baseKey);
					}
				});
			} else if (value && typeof value === "object") {
				processNestedObject(value, lang, baseKey);
			}
		});
	};

	if (parentPath) {
		const parents = getNestedValue(obj, parentPath);
		if (Array.isArray(parents)) {
			parents.forEach((parent) => processValue(parent));
		} else if (parents) {
			processValue(parents);
		}
	} else {
		processValue(obj);
	}
};

const mapObjectByLang = (obj, lang, keys = []) => {
	if (!obj || !lang || !Array.isArray(keys)) return obj;

	const modifiedObj = JSON.parse(JSON.stringify(obj));

	if (ACCEPTED_LANGS.includes(lang)) {
		keys.forEach((key) => {
			processField(modifiedObj, key, lang);
		});
	}

	return modifiedObj;
};

exports.modifyResponseByLang = (data, lang, keys = []) => {
	if (!data || !lang || !Array.isArray(keys)) return data;

	if (Array.isArray(data)) {
		return data.map((item) => mapObjectByLang(item, lang, keys));
	}
	return mapObjectByLang(data, lang, keys);
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
