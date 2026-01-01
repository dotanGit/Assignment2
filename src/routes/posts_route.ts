import express from "express";
const router = express.Router();
import postsController from "../controllers/posts_controller";
import { authenticate } from "../middleware/auth_middleware";

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostRequest'
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of all posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
router.post("/", authenticate, postsController.create);
router.get("/", postsController.getAll);

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Post found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostRequest'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.get("/:id", postsController.getById);
router.put("/:id", authenticate, postsController.update);
router.delete("/:id",authenticate, postsController.del);

export default router;
