import express from "express";
const router = express.Router();
import commentsController from "../controllers/comment_controller";

router.post("/:id", commentsController.create);

router.get("/", commentsController.getAll);

router.get("/:id", commentsController.getById);

router.put("/:id", commentsController.update);

router.delete("/:id", commentsController.del);

export default router;