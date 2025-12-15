import Comment from "../models/comment_model";
import BaseController from "./baseContorller";

const commentsController = new BaseController(Comment);

export default commentsController;