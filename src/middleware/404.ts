import { RequestHandler } from "express";

const notFound: RequestHandler = (_req, res, _next) => {
  res.status(404).json({ message: "Resource Not Found" });
};

export default notFound;
