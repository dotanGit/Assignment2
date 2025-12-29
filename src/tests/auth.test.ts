import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../models/user_model";
import postModel from "../models/post_model";

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
    const response = await request(app).post("/users/register").send(userInfo);
    expect(response.statusCode).not.toBe(200);
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
    const response = await request(app).post("/users/logout").send({
      refreshToken: userInfo.refreshToken,
    });
    expect(response.statusCode).toBe(200);

    const response2 = await request(app).post("/users/refresh-token").send({
      refreshToken: userInfo.refreshToken,
    });
    expect(response2.statusCode).not.toBe(200);
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
    const response = await request(app).post("/users/refresh-token");
    expect(response.statusCode).not.toBe(200);
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