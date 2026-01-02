import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import postModel from "../models/post_model";
import userModel from "../models/user_model";
import { Express } from "express";

let app: Express;
let accessToken: string;
let secondUserAccessToken: string;
let postId = "";

const testUser = {
  email: "test@user.com",
  password: "123456",
};

const secondUser = {
  email: "second@user.com",
  password: "123456",
};

const testPost = {
  sender: "123123abcabc",
  message: "Test content",
};

const invalidPost = {
  content: ""
};

beforeAll(async () => {
  app = await initApp();
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

  accessToken = loginResponse.body.token;

  // Register and login second user
  const registerSecondResponse = await request(app)
    .post("/users/register")
    .send(secondUser);
  expect(registerSecondResponse.statusCode).toBe(201);

  const loginSecondResponse = await request(app)
    .post("/users/login")
    .send({ email: secondUser.email, password: secondUser.password });
  expect(loginSecondResponse.statusCode).toBe(200);

  secondUserAccessToken = loginSecondResponse.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Posts API Test Suite", () => {
  describe("GET /posts", () => {
    test("Should return an empty list of posts initially", async () => {
      const response = await request(app).get("/posts");
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    test("Should return 500 and an error message if PostModel.find throws an error", async () => {
      jest
        .spyOn(postModel, "find")
        .mockRejectedValueOnce(new Error("Database query error"));

      const response = await request(app).get("/posts");

      expect(response.statusCode).toBe(500);
      expect(response.text).toBe("Error retrieving data");
    });

    test("Should return 400 and an error message if PostModel.find (with sender filter) throws an error", async () => {
      jest
        .spyOn(postModel, "find")
        .mockRejectedValueOnce(new Error("Database query error"));

      const response = await request(app)
        .get("/posts")
        .query({ sender: "testSender" });

      expect(response.statusCode).toBe(500);
      expect(response.text).toBe("Error retrieving data");
    });
  });

  describe("POST /posts", () => {
    test("Should add a new post successfully", async () => {
      const response = await request(app)
        .post("/posts")
        .set("authorization", `Bearer ${accessToken}`)
        .send(testPost);

      expect(response.statusCode).toBe(201);
      expect(response.body.sender).toBe(testPost.sender);
      expect(response.body.message).toBe(testPost.message);

      postId = response.body._id;
    });

    test("Should fail to add an invalid post", async () => {
      const response = await request(app)
        .post("/posts")
        .set("authorization", `Bearer ${accessToken}`)
        .send(invalidPost);

      expect(response.statusCode).toBe(400);
      expect(response.text).toBe("Message is required");
    });
  });

  describe("GET /posts after adding a post", () => {
    test("Should return a list with one post", async () => {
      const response = await request(app).get("/posts");
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    test("Should get post by sender", async () => {
      const response = await request(app).get(
        `/posts?sender=${testPost.sender}`
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].sender).toBe(testPost.sender);
    });

    test("Should get post by ID", async () => {
      const response = await request(app).get(`/posts/${postId}`);
      expect(response.statusCode).toBe(200);
      expect(response.body._id).toBe(postId);
    });

    test("Should return 400 and an error message if PostModel.findById throws an error", async () => {
      jest
        .spyOn(postModel, "findById")
        .mockRejectedValueOnce(new Error("Database query error"));

      const response = await request(app).get("/posts/invalid-id");

      expect(response.statusCode).toBe(500);
      expect(response.text).toBe("Error retrieving data by ID");
    });

    test("Should fail to get a non-existent post by ID", async () => {
      const response = await request(app).get(
        "/posts/67447b032ce3164be7c4412d"
      );
      expect(response.statusCode).toBe(404);
      expect(response.text).toBe("Data not found");
    });
  });

  test("Should update a post by ID", async () => {
    const updatedPost = {
      sender: "Emily",
      message: "This is an updated test post",
    };

    const response = await request(app)
      .put(`/posts/${postId}`)
      .set("authorization", `Bearer ${accessToken}`)
      .send(updatedPost);

    expect(response.statusCode).toBe(200);
    expect(response.body.sender).toBe(updatedPost.sender);
    expect(response.body.message).toBe(updatedPost.message);
  });

  test("Should fail to update a post with invalid ID", async () => {
    const updatedPost = {
      sender: "Emily",
      message: "This is an updated test post",
    };
    const invalidPostId = "6777b39a4c79d92f497af3ebasdasdasdsa";

    const response = await request(app)
      .put(`/posts/${invalidPostId}`)
      .set("authorization", `Bearer ${accessToken}`)
      .send(updatedPost);

    expect(response.statusCode).not.toBe(200);
  });

  test("Should fail to update a post created by another user", async () => {
    // Create a post with the first user
    const createResponse = await request(app)
      .post("/posts")
      .set("authorization", `Bearer ${accessToken}`)
      .send({ sender: "FirstUser", message: "Post by first user" });
    
    expect(createResponse.statusCode).toBe(201);
    const createdPostId = createResponse.body._id;

    // Try to update it with the second user's token
    const updatedPost = {
      sender: "SecondUser",
      message: "Trying to update",
    };

    const updateResponse = await request(app)
      .put(`/posts/${createdPostId}`)
      .set("authorization", `Bearer ${secondUserAccessToken}`)
      .send(updatedPost);

    expect(updateResponse.statusCode).toBe(403);
    expect(updateResponse.text).toBe("Forbidden: You are not the creator of this post");
  });

  test("Should fail to update a non-existent post", async () => {
    const nonExistentId = "67447b032ce3164be7c4412d";
    const response = await request(app)
      .put(`/posts/${nonExistentId}`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({ sender: "Test", message: "Trying to update" });

    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("Post not found");
  });

  test("Should fail to change the creator of a post", async () => {
    // Create a post first
    const createResponse = await request(app)
      .post("/posts")
      .set("authorization", `Bearer ${accessToken}`)
      .send({ sender: "TestUser", message: "Test post" });
    
    expect(createResponse.statusCode).toBe(201);
    const createdPostId = createResponse.body._id;

    // Try to update it with a different createdBy
    const updateResponse = await request(app)
      .put(`/posts/${createdPostId}`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({ message: "Updated", createdBy: "differentUserId" });

    expect(updateResponse.statusCode).toBe(400);
    expect(updateResponse.text).toBe("Cannot change creator of the post");
  });

  describe("DELETE /posts/:id", () => {
    test("Should delete a post successfully", async () => {
      const deleteResponse = await request(app)
        .delete(`/posts/${postId}`)
        .set("authorization", `Bearer ${accessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      const getResponse = await request(app).get(`/posts/${postId}`);
      expect(getResponse.statusCode).toBe(404);
    });

    test("Should fail to delete a post with invalid ID", async () => {
      const invalidPostId = "invalidPostId";

      const deleteResponse = await request(app)
        .delete(`/posts/${invalidPostId}`)
        .set("authorization", `Bearer ${accessToken}`);
      expect(deleteResponse.statusCode).toBe(500);
      expect(deleteResponse.text).toBe("Error deleting post");
    });

    test("Should fail to delete a post created by another user", async () => {
      // Create a post with the first user
      const createResponse = await request(app)
        .post("/posts")
        .set("authorization", `Bearer ${accessToken}`)
        .send({ sender: "FirstUser", message: "Post by first user" });
      
      expect(createResponse.statusCode).toBe(201);
      const createdPostId = createResponse.body._id;

      // Try to delete it with the second user's token
      const deleteResponse = await request(app)
        .delete(`/posts/${createdPostId}`)
        .set("authorization", `Bearer ${secondUserAccessToken}`);

      expect(deleteResponse.statusCode).toBe(403);
      expect(deleteResponse.text).toBe("Forbidden: You are not the creator of this post");
    });

    test("Should fail to delete a non-existent post", async () => {
      const nonExistentId = "67447b032ce3164be7c4412d";

      const deleteResponse = await request(app)
        .delete(`/posts/${nonExistentId}`)
        .set("authorization", `Bearer ${accessToken}`);

      expect(deleteResponse.statusCode).toBe(404);
      expect(deleteResponse.text).toBe("Post not found");
    });
  });
});