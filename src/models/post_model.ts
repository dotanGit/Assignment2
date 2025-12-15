import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
