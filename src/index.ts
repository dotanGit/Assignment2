import express, { Express } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";
import commentsRoute from "./routes/comments_route";
import postsRoute from "./routes/posts_route";
import userRoute from "./routes/user_route";
dotenv.config({ path: ".env.dev" });

const app = express();
app.use(express.json());

// Swagger UI setup
app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerSpec, { swaggerOptions: { persistAuthorization: true } }));

// Routes
app.use("/posts", postsRoute);
app.use("/comments", commentsRoute);
app.use("/users", userRoute);

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