import express from "express";
const router = express.Router();
import postsController from "../controllers/posts_controller";
import { authenticate } from "../middleware/auth_middleware";

// create new post
router.post("/", authenticate, postsController.create);

// get all posts
router.get("/", postsController.getAll);

// get post by id
router.get("/:id", postsController.getById);

// update post
router.put("/:id", authenticate, postsController.update);

// delete post
router.delete("/:id",authenticate, postsController.del);

export default router;
