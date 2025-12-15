import Post from "../models/post_model";
import BaseController from "./baseContorller";

const postsController = new BaseController(Post);

export default postsController;