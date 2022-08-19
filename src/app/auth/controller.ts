import { Request, Response, NextFunction } from "express";
import db from "../../data/users.json";
import argon from "argon2";
import jwt from "jsonwebtoken";
import config from "../config";
import { createFile } from "../../utils/createFile";

interface payloadType {
  email: string;
  password: string;
}

class Auth {
  async register(req: Request, res: Response, next: NextFunction) {
    const payload = req.body as payloadType;

    if (payload.email.length < 1 || payload.password.length < 1) {
      return res.status(400).json({ message: "email or password required" });
    }

    const user = db.filter((item) => item.email === payload.email);
    if (user.length)
      return res.status(409).json({ message: "email already exist" });

    try {
      const encrypt = await argon.hash(payload.password);
      const newUser = { ...payload, password: encrypt, refreshToken: [] };
      const setUser = [...db, newUser];

      await createFile(setUser);

      return res.status(200).json({ message: "register success" });
    } catch (error) {
      return next(error);
    }
  }
  async login(req: Request, res: Response, next: NextFunction) {
    const cookie = req.cookies as { jwt: string };
    console.log(`cookie is ${cookie.jwt}`);
    const payload = req.body as payloadType;

    if (payload.email.length < 1 || payload.password.length < 1) {
      return res.status(400).json({ message: "email or password required" });
    }

    const user = db.filter((item) => item.email === payload.email);
    if (user.length < 1)
      return res.status(404).json({ message: "email or password wrong" });

    try {
      const pwdMacth = await argon.verify(user[0].password, payload.password);
      if (!pwdMacth)
        return res.status(404).json({ message: "email or password wrong" });

      const accessToken = jwt.sign(
        { email: payload.email },
        config.accessKey as string,
        { expiresIn: "30s" }
      );
      const refreshToken = jwt.sign(
        { email: payload.email },
        config.refreshKey as string,
        { expiresIn: "1d" }
      );

      let otherRefreshToken = cookie?.jwt
        ? user[0].refreshToken.filter((item) => item !== cookie.jwt)
        : user[0].refreshToken;

      if (cookie.jwt) {
        res.clearCookie("jwt", { httpOnly: true });
      }

      const otherUser = db.filter((item) => item.email !== payload.email);
      const currentUser = {
        ...user[0],
        refreshToken: [...otherRefreshToken, refreshToken],
      };
      console.log(currentUser);
      const setUser = [...otherUser, currentUser];

      const oneDay = 24 * 60 * 60 * 1000;

      await createFile(setUser);
      res.cookie("jwt", refreshToken, { httpOnly: true, maxAge: oneDay });

      return res.status(200).json({ token: accessToken });
    } catch (error) {
      return next(error);
    }
  }
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    const cookie = req.cookies as { jwt: string };

    if (!cookie?.jwt) return res.sendStatus(401);

    const refreshToken = cookie.jwt;
    res.clearCookie("jwt", { httpOnly: true });

    const user = db.filter((item) => item.refreshToken.includes(refreshToken));
    // detect reuse refresh token

    if (user.length < 1) {
      jwt.verify(
        refreshToken,
        config.refreshKey as string,
        async (err, decoded) => {
          if (err) return res.sendStatus(403);
          console.log("reuse refresh token");
          const payload = decoded as { email: string };
          const userHacked = db.filter((item) => item.email === payload.email);
          userHacked[0].refreshToken = [];
          console.log(userHacked);
          // save
          const otherUser = db.filter((item) => item.email !== payload.email);
          const setUser = [...otherUser, userHacked[0]];

          await createFile(setUser);
          return;
        }
      );
      return res.sendStatus(401);
    }

    const otherRefreshToken = user[0].refreshToken.filter(
      (item) => item !== refreshToken
    );
    const otherUser = db.filter((item) => item.email !== user[0].email);

    try {
      const decode = jwt.verify(refreshToken, config.refreshKey as string) as {
        email: string;
      };
      const accessToken = jwt.sign(
        { email: decode.email },
        config.accessKey as string,
        { expiresIn: "30s" }
      );
      const newRefreshToken = jwt.sign(
        { email: decode.email },
        config.refreshKey as string,
        { expiresIn: "1d" }
      );

      user[0].refreshToken = [...otherRefreshToken, newRefreshToken];
      const setUser = [...otherUser, user[0]];

      await createFile(setUser);
      const oneDay = 24 * 60 * 60 * 1000;

      res.cookie("jwt", newRefreshToken, { httpOnly: true, maxAge: oneDay });
      return res.status(200).json({ accessToken });
    } catch (error) {
      // delete refresh token
      console.log("refresh token have problem");
      user[0].refreshToken = otherRefreshToken;
      console.log(user);
      const setUser = [...otherUser, user[0]];

      await createFile(setUser);
      return next(error);
    }
  }
  async logout(req: Request, res: Response, next: NextFunction) {
    const cookie = req.cookies as { jwt: string };

    if (!cookie?.jwt) return res.sendStatus(204);

    const refreshToken = cookie.jwt;
    const user = db.filter((item) => item.refreshToken.includes(refreshToken));

    if (user.length < 1) {
      res.clearCookie("jwt", { httpOnly: true });
      return res.sendStatus(204);
    }

    const otherUser = db.filter(
      (item) => !item.refreshToken.includes(refreshToken)
    );
    const otherRefreshToken = user[0].refreshToken.filter(
      (item) => item !== refreshToken
    );
    const currentUser = { ...user[0], refreshToken: otherRefreshToken };
    console.log(currentUser);
    const setUser = [...otherUser, currentUser];

    try {
      await createFile(setUser);

      res.clearCookie("jwt", { httpOnly: true });
      return res.sendStatus(204);
    } catch (error) {
      return next(error);
    }
  }
}

export default Auth;
