import express from "express"; // redeploy-trigger-3
import cors from "cors";
import routes from "./routes/index.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { email } from "better-auth";

const app = express();

app.set("trust proxy", true);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://skill-bridge-client-five.vercel.app",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

// better auth router
app.all("/api/v1/auth/*splat", toNodeHandler(auth));

app.use("/api/v1", routes);

app.get("/", (req, res) => {
  res.send({ message: "server running" });
});

export default app;
