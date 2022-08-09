import { Request, Response, NextFunction } from "express";

function errorHandle(
  err: TypeError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  res.status(500).json({ error: err.name, message: err.message });
}

export default errorHandle;
