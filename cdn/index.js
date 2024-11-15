const express = require("express");
const cors = require("cors");
const router = require("./router.js");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.static("cdn/public"));
app.use(cors());

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.error("Could not connect to MongoDB:", err));

app.use("/api", router);

app.listen(process.env.CDNPORT || 3006, () => {
	console.log(`Server is running on port ${process.env.CDNPORT || 3006}`);
});
