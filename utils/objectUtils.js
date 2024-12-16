const {ACCEPTED_LANGS} = require("./constants");

const getNestedValue = (obj, path) => {
	if (!obj || !path) return undefined;
	return path.split(".").reduce((current, key) => {
		if (Array.isArray(current)) {
			return current.map((item) => item?.[key]).filter(Boolean);
		}
		return current?.[key];
	}, obj);
};

const setNestedValue = (obj, path, value) => {
	if (!obj || !path) return;
	const keys = path.split(".");
	const lastKey = keys.pop();

	let target = obj;
	for (const key of keys) {
		if (Array.isArray(target)) {
			target.forEach((item) => {
				item[key] =
					item[key] || (keys.indexOf(key) === keys.length - 1 ? [] : {});
			});
			target = target.map((item) => item[key]).flat();
		} else {
			target[key] =
				target[key] || (keys.indexOf(key) === keys.length - 1 ? [] : {});
			target = target[key];
		}
	}

	if (Array.isArray(target)) {
		target.forEach((item) => {
			item[lastKey] = value;
		});
	} else if (target) {
		target[lastKey] = value;
	}
};

const cleanupLangFields = (obj, baseKey) => {
	if (!obj || !baseKey) return;

	ACCEPTED_LANGS.forEach((lang) => {
		const langKey = `${baseKey}_${lang}`;
		if (obj[langKey] !== undefined) {
			delete obj[langKey];
		}
	});
};

exports.getNestedValue = getNestedValue;
exports.setNestedValue = setNestedValue;
exports.cleanupLangFields = cleanupLangFields;
