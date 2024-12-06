const {Router} = require("express");
const controller = require("../controllers/users.controller.js");
const middleware = require("../middlewares/users.middleware.js");

const router = Router();

router.post("/login", controller.loginOrRegsiter);
router.post("/login/:uuid", controller.submitloginOrRegsiter);
router.get("/me", middleware, controller.getMe);
router.put("/profile", middleware, controller.editProfile);

router.get("/blogs", controller.getBlogs);
router.get("/blogs/:id", controller.getBlogById);

router.get("/about", controller.getAbout);

router.get("/standarts", controller.getStandarts);
router.get("/standarts/search", controller.searchStandarts);
router.get("/standarts/:id", controller.getStandartById);

router.get("/sektors", controller.getSektors);
router.get("/sektors/search", controller.searchSektors);
router.get("/sektors/:id", controller.getSektorById);

router.get("/sections", controller.getSections);
router.get("/sections/:id", controller.getSectionById);

router.post("/application", middleware, controller.createApplication);

module.exports = router;
