const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();
const routes = require("./routes/router.js");
const path = require("path");
const fs = require("fs");
app.use(cors());

app.use(express.json());

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.error("Could not connect to MongoDB:", err));
const logFolder = path.join(__dirname, "log");
const logFileName = () => {
	const now = new Date();
	const formattedDate = `${String(now.getDate()).padStart(2, "0")}-${String(
		now.getMonth() + 1,
	).padStart(2, "0")}-${now.getFullYear()}`;
	return path.join(logFolder, `${formattedDate}.mongodb.log`);
};
fs.mkdirSync(logFolder, {recursive: true});
let logStream = fs.createWriteStream(logFileName(), {flags: "a"});
mongoose.set("debug", (collectionName, method, query, doc) => {
	const logMessage = `[${new Date().toISOString()}] ${collectionName}.${method} ${JSON.stringify(
		query,
	)} ${JSON.stringify(doc)}\n`;

	if (logStream.path !== logFileName()) {
		logStream.end();
		logStream = fs.createWriteStream(logFileName(), {flags: "a"});
	}

	logStream.write(logMessage);
});

app.listen(process.env.PORT || 3005, () => {
	console.log(`Server listening on port ${process.env.PORT || 3005}`);
});

app.use("/api", routes);
