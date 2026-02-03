import express from "express"; // redeploy-trigger-3
import cors from "cors";
import routes from "./routes/index.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { email } from "better-auth";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
