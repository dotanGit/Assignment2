import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../models/user_model";
import postModel from "../models/post_model";
import jwt from "jsonwebtoken";

let app: Express;

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();
  await postModel.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

type UserInfo = {
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
  _id?: string;
};
const userInfo: UserInfo = {
  email: "emily@gmail.com",
  password: "123456",
  _id: "123123abcabc"
};

describe("Auth Tests", () => {
  test("Auth Registration", async () => {
    const response = await request(app).post("/users/register").send(userInfo);
    expect(response.statusCode).toBe(201);
  });

  test("Auth Registration fail", async () => {
    await request(app).post("/users/register").send(userInfo);

    const response = await request(app).post("/users/register").send(userInfo);
    expect(response.statusCode).not.toBe(200);
    console.log("ressssss::::::", response.statusCode);
  });

  test("Auth Registration fail with exists email", async () => {
    const response = await request(app).post("/users/register").send(userInfo);
    expect(response.statusCode).not.toBe(200);
  });
  test("Auth Registration fail without password", async () => {
    const response = await request(app).post("/users/register").send({ email: "test@test.com" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email and password are required");
  });

  test("Auth Registration fail without email", async () => {
    const response = await request(app).post("/users/register").send({ password: "123456" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email and password are required");
  });

  test("Auth Registration fail without email and password", async () => {
    const response = await request(app).post("/users/register").send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email and password are required");
  });

  test("Auth Registration database error", async () => {
    const response = await request(app).post("/users/register").send({ email: "test50@test.com", password: "123456" });
    expect(response.statusCode).toBe(201);
  });

  test("Auth Login", async () => {
    const response = await request(app).post("/users/login").send(userInfo);
    console.log(response.body);
    expect(response.statusCode).toBe(200);
    const accessToken = response.body.token;
    const refreshToken = response.body.refreshToken;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    userInfo.accessToken = accessToken;
    userInfo.refreshToken = refreshToken;
  });

  test("Auth Login fail with correct password and false email", async () => {
    const response = await request(app)
      .post("/users/login")
      .send({ email: userInfo.email + "1", password: userInfo.password });
    expect(response.statusCode).not.toBe(200);
  });
  test("Auth Login fail with correct email and false password", async () => {
    const response = await request(app)
      .post("/users/login")
      .send({ email: userInfo.email, password: userInfo.password + "1" });
    expect(response.statusCode).not.toBe(200);
  });

  test("Auth Login fail without email", async () => {
    const response = await request(app).post("/users/login").send({ password: "123456" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email and password are required");
  });

  test("Auth Login fail without password", async () => {
    const response = await request(app).post("/users/login").send({ email: "test@test.com" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email and password are required");
  });

  test("Auth Login fail without email and password", async () => {
    const response = await request(app).post("/users/login").send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email and password are required");
  });


  test("Make sure two access tokens are notr the same", async () => {
    const response = await request(app).post("/users/login").send({
      email: userInfo.email,
      password: userInfo.password,
    });
    expect(response.body.accessToken).not.toEqual(userInfo.accessToken);
  });

  test("Get protected API", async () => {
    const response = await request(app).post("/posts").send({
      sender: "invalid owner",
      message: "My First post",
    });
    expect(response.statusCode).not.toBe(201);
    const response2 = await request(app)
      .post("/posts")
      .set({
        authorization: "Bearer " + userInfo.accessToken,
      })
      .send({
        sender: "invalid owner",
        message: "My First post",
      });
    expect(response2.statusCode).toBe(201);
  });

  test("Get protected API invalid token", async () => {
    const response = await request(app)
      .post("/users/posts")
      .set({
        authorization: "jwt " + userInfo.accessToken + "1",
      })
      .send({
        sender: userInfo._id,
        message: "This is my first post",
      });
    expect(response.statusCode).not.toBe(201);
  });

  test("Get protected API with Bearer but no token", async () => {
    const response = await request(app)
      .post("/posts")
      .set("authorization", "Bearer  ")
      .send({
        sender: "test",
        message: "Test post",
      });
    expect(response.statusCode).toBe(401);
  });

  test("Refresh Token", async () => {
    const response = await request(app).post("/users/refresh-token").send({
      refreshToken: userInfo.refreshToken,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    userInfo.accessToken = response.body.token;
    userInfo.refreshToken = response.body.refreshToken;
  });

  test("Logout - invalidate refresh token", async () => {
    // First login to get a fresh token
    const loginResponse = await request(app).post("/users/login").send({
      email: userInfo.email,
      password: userInfo.password,
    });
    const logoutToken = loginResponse.body.refreshToken;

    const response = await request(app).post("/users/logout").send({
      refreshToken: logoutToken,
    });
    expect(response.statusCode).toBe(200);

    const response2 = await request(app).post("/users/refresh-token").send({
      refreshToken: logoutToken,
    });
    expect(response2.statusCode).not.toBe(200);
  });

  test("Logout fail without refresh token", async () => {
    const response = await request(app).post("/users/logout").send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Refresh token is required");
  });

  test("Logout fail with empty refresh token", async () => {
    const response = await request(app).post("/users/logout").send({ refreshToken: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Refresh token is required");
  });

  test("Logout fail with non-existent user", async () => {
    // Create a valid token for a user that doesn't exist in the database
    const fakeUserId = new mongoose.Types.ObjectId().toString();
    const fakeToken = jwt.sign(
      { _id: fakeUserId },
      process.env.TOKEN_SECRET || "default_secret",
      { expiresIn: "7d" }
    );

    const response = await request(app).post("/users/logout").send({ refreshToken: fakeToken });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("User not found");
  });

  test("Logout fail with token not in user's refreshTokens", async () => {
    const newUser = { email: "logouttest@test.com", password: "123456" };
    await request(app).post("/users/register").send(newUser);
    
    const loginResponse = await request(app).post("/users/login").send(newUser);
    const validToken = loginResponse.body.refreshToken;

    await request(app).post("/users/logout").send({ refreshToken: validToken });

    const response = await request(app).post("/users/logout").send({ refreshToken: validToken });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid refresh token");
  });

  test("Missing TOKEN_SECRET in logout", async () => {
    const originalSecret = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;
    const response = await request(app).post("/users/logout").send(userInfo);
    expect(response.statusCode).not.toBe(200);
    process.env.TOKEN_SECRET = originalSecret;
  });
  test("Invalid refresh token", async () => {
    const response = await request(app)
      .post("/users/refresh-token")
      .send({ refreshToken: "invalidToken" });
    expect(response.statusCode).not.toBe(200);
  });
  test("Refresh: Missing refresh token", async () => {
    const response = await request(app).post("/users/refresh-token").send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Refresh token is required");
  });

  test("Refresh: Empty refresh token", async () => {
    const response = await request(app).post("/users/refresh-token").send({ refreshToken: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Refresh token is required");
  });

  test("Refresh token with non-existent user", async () => {
    // Create a valid token for a user that doesn't exist in the database
    const fakeUserId = new mongoose.Types.ObjectId().toString();
    const fakeToken = jwt.sign(
      { _id: fakeUserId },
      process.env.TOKEN_SECRET || "default_secret",
      { expiresIn: "7d" }
    );

    const response = await request(app).post("/users/refresh-token").send({ refreshToken: fakeToken });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid refresh token");
  });
  test("Missing TOKEN_SECRET in refresh", async () => {
    const originalSecret = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;
    const response = await request(app)
      .post("/users/refresh-token")
      .send({ refreshToken: userInfo.refreshToken });
    expect(response.statusCode).not.toBe(200);
    process.env.TOKEN_SECRET = originalSecret;
  });

  jest.setTimeout(10000);
  test("timeout on refresh access token", async () => {
    const response = await request(app).post("/users/login").send({
      email: userInfo.email,
      password: userInfo.password,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    userInfo.accessToken = response.body.token;
    userInfo.refreshToken = response.body.refreshToken;

    await new Promise((resolve) => setTimeout(resolve, 6000));

    const response2 = await request(app)
      .post("/posts")
      .set({
        authorization: "Bearer " + userInfo.accessToken,
      })
      .send({
        sender: "Emily",
        message: "My First post",
      });
    expect(response2.statusCode).not.toBe(201);

    const response3 = await request(app).post("/users/refresh-token").send({
      refreshToken: userInfo.refreshToken,
    });
    expect(response3.statusCode).toBe(200);
    userInfo.accessToken = response3.body.token;
    userInfo.refreshToken = response3.body.refreshToken;

    const response4 = await request(app)
      .post("/posts")
      .set({
        authorization: "Bearer " + userInfo.accessToken,
      })
      .send({
        sender: "Dotan",
        message: "My First post",
      });
    expect(response4.statusCode).toBe(201);
  });
});