const {Router} = require("express");
const controller = require("./controller.js");
const middleware = require("./middleware.js");

const router = Router();

router.get("/", controller.index);
router.post("/upload",middleware, controller.upload);

module.exports = router;
