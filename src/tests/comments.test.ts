import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import CommentModel from "../models/comment_model";
import userModel from "../models/user_model";
import postModel from "../models/post_model";
import { Express } from "express";

let app: Express;
let commentId = "";

const testUser = {
  email: "test@user.com",
  password: "123456",
  token: "",
  _id: "123123abcabc",
};

const testPost = {
  sender: "Tom",
  message: "Test content",
};

const testComment = {
  sender: "Tom",
  message: "Test comment",
  postId: "",
  commentId: "",
};

const invalidComment = {
  comment: "Missing postId",
};

beforeAll(async () => {
  app = await initApp();

  await CommentModel.deleteMany();
  await postModel.deleteMany();
  await userModel.deleteMany();

  const registerResponse = await request(app)
    .post("/users/register")
    .send(testUser);
  expect(registerResponse.statusCode).toBe(201);

  const loginResponse = await request(app)
    .post("/users/login")
    .send({ email: testUser.email, password: testUser.password });
  expect(loginResponse.statusCode).toBe(200);

  testUser.token = loginResponse.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Comments Test Suite", () => {
  test("Should add a new post successfully", async () => {
    const response = await request(app)
      .post("/posts")
      .set("authorization", `Bearer ${testUser.token}`)
      .send(testPost);

    expect(response.statusCode).toBe(201);
    expect(response.body.sender).toBe(testPost.sender);
    expect(response.body.message).toBe(testPost.message);

    testComment.postId = response.body._id;
  });

  test("Should get all comments (none exist initially)", async () => {
    const response = await request(app).get("/comments");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Should add a new comment successfully", async () => {
    const response = await request(app)
      .post(`/comments/${testComment.postId}`)
      .set("authorization", `Bearer ${testUser.token}`)
      .send(testComment);

    expect(response.statusCode).toBe(201);
    expect(response.body.sender).toBe(testComment.sender);
    expect(response.body.message).toBe(testComment.message);

    commentId = response.body._id;
  });

  test("Should handle errors when creating a comment", async () => {
    // Mock CommentModel.create to throw an error
    jest.spyOn(CommentModel, "create").mockImplementationOnce(() => {
      throw new Error("Database connection error");
    });
  
    const response = await request(app)
      .post(`/comments/${testComment.postId}`)  
      .set("authorization", `Bearer ${testUser.token}`)
      .send(testComment);
  
    expect(response.statusCode).toBe(500);  
    jest.restoreAllMocks();
  });

  test("Should fail to add an invalid comment", async () => {
    const response = await request(app)
      .post(`/comments/${testComment.postId}`)
      .set("authorization", `Bearer ${testUser.token}`)
      .send(invalidComment);

    expect(response.statusCode).toBe(400);;
  });

  test("Should get all comments after adding one", async () => {
    const response = await request(app).get("/comments");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test("Should get comments by sender", async () => {
    const response = await request(app).get(
      `/comments?sender=${testComment.sender}`
    );
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].sender).toBe(testComment.sender);
  });

  test("Should get a comment by ID", async () => {
    const response = await request(app).get(`/comments/${commentId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(commentId);
  });

  test("Should return comments filtered by sender", async () => {
    const response = await request(app)
      .get("/comments")
      .query({ sender: testComment.sender })
      .set("authorization", `Bearer ${testUser.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].sender).toBe("Tom");
    expect(response.body[0].message).toBe("Test comment");
  });

  test("Should return 400 if there is a database error during query", async () => {
    jest
      .spyOn(CommentModel, "find")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .get("/comments")
      .query({ sender: testComment.sender })
      .set("authorization", `Bearer ${testUser.token}`);

    expect(response.statusCode).toBe(500);
    expect(response.text).toBe("Error retrieving data");
  });

  test("Should handle errors when querying comments with a sender filter", async () => {
    const invalidSender = "nonexistentSender";

    jest
      .spyOn(CommentModel, "find")
      .mockRejectedValueOnce(new Error("Database connection error"));

    const response = await request(app)
      .get(`/comments?sender=${invalidSender}`)
      .set("authorization", `Bearer ${testUser.token}`);

    expect(response.statusCode).toBe(500);
    expect(response.text).toBe("Error retrieving data");

    jest.restoreAllMocks();
  });

  test("Should fail to get a comment by invalid ID", async () => {
    const invalidIdResponse = await request(app).get(`/comments/${commentId}5`);
    expect(invalidIdResponse.statusCode).toBe(500);

    const nonExistentIdResponse = await request(app).get(
      `/comments/${testComment.postId}`
    );
    expect(nonExistentIdResponse.statusCode).toBe(404);
  });

  test("Should return error for missing comment content", async () => {
    const response = await request(app)
      .put(`/comments/${commentId}`)
      .set("authorization", `Bearer ${testUser.token}`)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Message is required");
  });

  test("Should update the comment successfully", async () => {
    const updatedComment = "Updated comment content";

    const response = await request(app)
      .put(`/comments/${commentId}`)
      .set("authorization", `Bearer ${testUser.token}`)
      .send({ message: updatedComment });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(updatedComment);
    expect(response.body._id).toBe(commentId);
  });

  test("Should return error when update fails due to DB issue", async () => {
    jest
      .spyOn(CommentModel, "findByIdAndUpdate")
      .mockRejectedValueOnce(new Error("Database update error"));

    const response = await request(app)
      .put(`/comments/${commentId}`)
      .set("authorization", `Bearer ${testUser.token}`)
      .send({ message: "Updated comment content" });

    expect(response.statusCode).toBe(500);
    expect(response.text).toBe("Error updating data");

    jest.restoreAllMocks();
  });

  test("Should handle database error when deleting comment", async () => {
    const invalidId = "invalid-id-format";

    const response = await request(app)
      .delete(`/comments/${invalidId}`)
      .set("authorization", `Bearer ${testUser.token}`);

    expect(response.statusCode).toBe(500);
    expect(response.text).toBe("Error deleting data");
  });
});