import express from "express";
const router = express.Router();
import postsController from "../controllers/posts_controller";

// create new post
router.post("/", postsController.create);

// get all posts
router.get("/", postsController.getAll);

// get post by id
router.get("/:id", postsController.getById);

// update post
router.put("/:id", postsController.update);

export default router;
