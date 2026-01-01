import Comment from "../models/comment_model";
import BaseController from "./baseContorller";
import { AuthRequest } from "../middleware/auth_middleware";
import { Response } from "express";


class commentsController extends BaseController {
    constructor() {
        super(Comment);
    }

    // Override create method 
    async create(req: AuthRequest, res: Response) {
        if (req.user) {
            req.body.createdBy = req.user._id; 
        }
        return super.create(req, res);
    };

    //OVERRIDE DELETE to ensure only creator can delete
    async del(req: AuthRequest, res: Response) {
        const id = req.params.id;
        try {
            const comment = await this.model.findById(id);
            if (!comment) {
                res.status(404).send("Comment not found");
                return;
            }
            // Check if the authenticated user is the creator of the post
            if (req.user && comment.createdBy.toString() === req.user._id) {
                super.del(req, res);
                return
            } else {
                res.status(403).send("Forbidden: You are not the creator of this comment");
                return;
            }
        } catch (err) {
            console.error(err);
            res.status(500).send("Error deleting comment");
        }
    };


     //override put to prevent changing createdBy and ensure only creator can update
     async update(req: AuthRequest, res: Response) {
        const id = req.params.id;
        try {
            const comment = await this.model.findById(id);
            if (!comment) {
                return res.status(404).send("Comment not found");
            }
            // Check if the authenticated user is the creator of the comment
            if (req.user && comment.createdBy.toString() !== req.user._id) {
                return res.status(403).send("Forbidden: You are not the creator of this comment");
            }
            // Prevent changing createdBy field
            if (req.body.createdBy && req.body.createdBy !== comment.createdBy.toString()) {
                return res.status(400).send("Cannot change creator of the comment");
            }
            return super.update(req, res);
        }
        catch (err) {
            console.error(err);
            return res.status(500).send("Error updating comment");
        }
    };
    
};

const commentsControllerInstance = new commentsController();
export default commentsControllerInstance;