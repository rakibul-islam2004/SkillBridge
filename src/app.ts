import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

const app = express();

app.set("trust proxy", true);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://skill-bridge-client-five.vercel.app",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.all("/api/v1/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", routes);

app.get("/", (req, res) => {
  res.send({ message: "Server running" });
});

export default app;
