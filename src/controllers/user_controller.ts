import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/user_model";
import jwt from "jsonwebtoken";

const sendError = (code: number, message: string, res: Response) => {
    res.status(code).json({ message });
}

const generateToken = (userId: string): string => {
    const secret = process.env.TOKEN_SECRET || "default_secret";
    //TODO: check if no secret close the server
    const expiresIn = parseInt(process.env.TOKEN_EXPIRATION || "3600");
    const token = jwt.sign(
        { _id: userId },
        secret,
        { expiresIn: expiresIn }
    );
    return token;
}

const generateRefreshToken = (userId: string): string => {
    const secret = process.env.TOKEN_SECRET || "default_secret";
    const expiresIn = parseInt(process.env.REFRESH_TOKEN_EXPIRATION || "604800"); // 7 days
    const token = jwt.sign(
        { _id: userId },
        secret,
        { expiresIn: expiresIn }
    );
    return token;
}

const register = async (req: Request, res: Response) => {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
        return sendError(400, "Email and password are required", res);
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({ "email": email, "password": hashedPassword });

        const token = generateToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());
        user.refreshTokens = [refreshToken];
        await user.save();
        res.status(201).json({ "token": token, "refreshToken": refreshToken });
    } catch (err) {
        return sendError(500, "Internal server error" + err, res);
    }
}

const login = async (req: Request, res: Response) => {
    // Login logic here
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
        return sendError(400, "Email and password are required", res);
    }
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return sendError(401, "Invalid email or password 1", res);
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendError(401, "Invalid email or password 2", res);
        }

        const token = generateToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());
        user.refreshTokens.push(refreshToken);
        await user.save();
        res.status(200).json({ "token": token, "refreshToken": refreshToken });

    } catch (err) {
        return sendError(500, "Internal server error" + err, res);
    }
}

const refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return sendError(400, "Refresh token is required", res);
    }
    try {
        const secret = process.env.TOKEN_SECRET || "default_secret";
        const decoded = jwt.verify(refreshToken, secret) as { _id: string };
        const user = await User.findById({ _id: decoded._id });

        if(!user) {
            return sendError(401, "Invalid refresh token", res);
        }
        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
            return sendError(401, "Invalid refresh token", res);
        }
        const newAccessToken = generateToken(user._id.toString());
        const newRefreshToken = generateRefreshToken(user._id.toString());

        // Remove the old refresh token (the one that was just used)
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);

        // Add the new refresh token
        user.refreshTokens.push(newRefreshToken);

        // Save to database
        await user.save();
        res.status(200).json({ "token": newAccessToken, "refreshToken": newRefreshToken });
    } catch (err) {
        return sendError(500, "Internal server error" + err, res);
    }
}

export default {
    register,
    login,
    refreshToken
};