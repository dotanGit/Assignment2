import express, { Express } from "express";
import mongoose from "mongoose";
import commentsRoute from "./routes/comments_route";
import postsRoute from "./routes/posts_route";
import dotenv from "dotenv";
dotenv.config({ path: ".env.dev" });

const app = express();
app.use(express.json());
app.use("/posts", postsRoute);
app.use("/comments", commentsRoute);

const initApp = () => {
  const pr = new Promise<Express>((resolve, reject) => {
    const dbUrl = process.env.DB_CONNECT;
    if (!dbUrl) {
      reject("DATABASE_URL is not defined");
      return;
    }
    mongoose
      .connect(dbUrl, {})
      .then(() => {
        resolve(app);
      });
    const db = mongoose.connection;
    db.on("error", (error) => console.error(error));
    db.once("open", () => console.log("Connected to Database"));
  });
  return pr;
};

export default initApp;