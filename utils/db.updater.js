let fs = require("node:fs/promises");
const path = require("node:path");
const lockfile = require("lockfile");

const lockPath = path.join(__dirname, "file.lock");

const acquireLock = async () => {
	return new Promise((resolve, reject) => {
		lockfile.lock(lockPath, {retries: 10, retryWait: 100}, (err) => {
			if (err) reject(err);
			else resolve();
		});
	});
};

const releaseLock = async () => {
	return new Promise((resolve, reject) => {
		lockfile.unlock(lockPath, (err) => {
			if (err) reject(err);
			else resolve();
		});
	});
};

exports.updateOrAddObject = async (filePath, newObj) => {
	try {
		await acquireLock();

		let jsonArray = [];
		try {
			const data = await fs.readFile(filePath, "utf8");
			if (data) {
				jsonArray = JSON.parse(data);
				if (!Array.isArray(jsonArray)) {
					throw new Error("JSON file does not contain an array.");
				}
			}
		} catch (err) {
			if (err.code === "ENOENT") {
				jsonArray = []; // Initialize if file does not exist
			} else {
				throw err;
			}
		}

		let index = jsonArray.findIndex((obj) => obj.phone === newObj.phone);

		if (index !== -1) {
			jsonArray[index] = {...jsonArray[index], ...newObj};
			console.log(`Updated object at index ${index}`);
		} else {
			jsonArray.push(newObj);
			console.log("Added new object");
		}

		await fs.writeFile(filePath, JSON.stringify(jsonArray, null, 2), "utf8");
		console.log("File updated successfully!");
	} catch (err) {
		console.error("Error handling file:", err);
	} finally {
		await releaseLock();
	}
};
fs = require("fs").promises;

exports.deleteObject = async (filePath, keyToDelete) => {
	try {
		// Read the file content
		let data = await fs.readFile(filePath, "utf8");
		let jsonArray = [];

		// Parse the file content into an array if it exists
		if (data) {
			jsonArray = JSON.parse(data);

			if (!Array.isArray(jsonArray)) {
				throw new Error("JSON file does not contain an array.");
			}
		}

		// Delete the key from each object in the array
		const filteredArray = jsonArray.map((obj) => {
			if (obj.hasOwnProperty(keyToDelete)) {
				delete obj[keyToDelete];
			}
			return obj;
		});

		// Write the updated array back to the file
		await fs.writeFile(
			filePath,
			JSON.stringify(filteredArray, null, 2),
			"utf8",
		);
		console.log("File updated after deletion successfully!");
	} catch (err) {
		if (err.code === "ENOENT") {
			console.log("File not found.");
		} else {
			console.error("Error:", err);
		}
	}
};
