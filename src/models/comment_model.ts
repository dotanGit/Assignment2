import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post", // reference to the Post model from the post_model.js file
        required: true
    },
    sender: {
        type: String,
        required: true,
        trim: true // remove whitespace from the beginning and end of the string for example "   Dotan   " -> "Dotan"
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
    }
    }, 
    {
        timestamps: true
    });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;