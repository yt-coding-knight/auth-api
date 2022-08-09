import { CorsOptions } from "cors";

const config = {
  port: process.env.PORT,
  accessKey: process.env.ACCESS_KEY,
  refreshKey: process.env.REFRESH_KEY,
};

const whitelist = ["http://yourdomain.com", "http://localhost:5000"];
export const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (whitelist.indexOf(origin as string) !== -1 || !origin) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by cors"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
};

export default config;
