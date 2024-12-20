const {Router} = require("express");
const middleware = require("../middlewares/admin.middleware.js");
const controller = require("../controllers/admin.controller.js");

const router = Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/me", middleware, controller.getMe);
router.put("/profile", middleware, controller.editProfile);

router.post("/blogs", middleware, controller.createBlog);
router.get("/blogs", middleware, controller.getBlogs);
router.get("/blogs/:id", middleware, controller.getBlogById);
router.put("/blogs/:id", middleware, controller.editBlogById);
router.delete("/blogs/:id", middleware, controller.deleteBlogById);

router.post("/about", middleware, controller.updateAbout);
router.get("/about", middleware, controller.getAbout);

router.post("/sektors", middleware, controller.createSektor);
router.get("/sektors", middleware, controller.getSektors);
router.get("/sektors/:id", middleware, controller.getSektorById);
router.put("/sektors/:id", middleware, controller.editSektorById);
router.delete("/sektors/:id", middleware, controller.deleteSektorById);

router.post("/sections", middleware, controller.createSection);
router.get("/sections", middleware, controller.getSections);
router.get("/sections/:id", middleware, controller.getSectionById);
router.put("/sections/:id", middleware, controller.editSectionById);
router.delete("/sections/:id", middleware, controller.deleteSectionById);

router.post("/standarts", middleware, controller.createStandart);
router.get("/standarts", middleware, controller.getStandarts);
router.get("/standarts/:id", middleware, controller.getStandartById);
router.put("/standarts/:id", middleware, controller.editStandartById);
router.delete("/standarts/:id", middleware, controller.deleteStandartById);

router.get("/applications", middleware, controller.getApplications);
router.get("/applications/:id", middleware, controller.getApplicationById);
router.patch(
	"/applications/cancel/:id",
	middleware,
	controller.cancelApplication,
);
router.patch(
	"/applications/submit/:id",
	middleware,
	controller.submitApplication,
);
router.patch("/applications/done/:id", middleware, controller.doneApplication);

module.exports = router;
