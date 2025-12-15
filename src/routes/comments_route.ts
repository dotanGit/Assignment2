import express from "express";
const router = express.Router();
import commentsController from "../controllers/comment_controller";
import { authenticate } from "../middleware/auth_middleware";


router.get("/", commentsController.getAll);

router.get("/:id", commentsController.getById);

router.post("/:id",authenticate, commentsController.create);

router.put("/:id",authenticate, commentsController.update);

router.delete("/:id",authenticate, commentsController.del);

export default router;