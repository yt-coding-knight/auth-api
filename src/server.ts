import express from "express";
import config, { corsOptions } from "./app/config";
import authRouter from "./app/auth/router";
import commentRouter from "./app/comment/router";
import cookieParser from "cookie-parser";
import notFound from "./middleware/404";
import errorHandle from "./middleware/errorHandler";
import cors from "cors";

const app = express();
const port = config.port || 3000;

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", authRouter);
app.use("/api/v1", commentRouter);

app.use(notFound);

app.use(errorHandle);

app.listen(port, () => console.log(`server is running on port ${port}`));
