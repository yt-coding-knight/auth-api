import { Router } from "express";
import controller from "./controller";
import verifyToken from "../../middleware/verifyToken";

const router = Router();
const commentController = new controller();

router.get("/comment", verifyToken, commentController.get);

export default router;
