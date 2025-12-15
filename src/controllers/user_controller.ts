import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/user_model";
import jwt from "jsonwebtoken";

const sendError = (code: number, message: string, res: Response) => {
    res.status(code).json({ message });
}

const generateToken = (userId: string): string => {
    const secret = process.env.JWT_SECRET || "default_secret";
    //TODO: check if no secret close the server
    const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || "3600");
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
        res.status(201).json({ "token": token });
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
        res.status(200).json({ "token": token });

    } catch (err) {
        return sendError(500, "Internal server error" + err, res);
    }
}

export default {
    register,
    login
};