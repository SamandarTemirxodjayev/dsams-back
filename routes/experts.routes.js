const {Router} = require("express");
const controller = require("../controllers/experts.controller.js");
const middleware = require("../middlewares/experts.middleware.js");

const router = Router();

router.post("/login", controller.loginOrRegsiter);
router.post("/login/:uuid", controller.submitloginOrRegsiter);
router.get("/me", middleware, controller.getMe);
router.put("/profile", middleware, controller.editProfile);

router.get("/applications", middleware, controller.getApplications);
router.get("/applications/:id", middleware, controller.getApplicationById);
router.put(
	"/applications/rating/:id",
	middleware,
	controller.addRatingForApplication,
);

module.exports = router;
