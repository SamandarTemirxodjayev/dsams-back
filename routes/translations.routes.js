const {Router} = require("express");
const translationController = require("../controllers/translations.controller.js");
const middleware = require("../middlewares/admin.middleware.js");
const router = Router();

router.get("/:lang", translationController.findByLang);
router.delete("/:lang/:name", middleware, translationController.deleteObj);
router.post("/:lang", middleware, translationController.createLang);

module.exports = router;
