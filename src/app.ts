import express from "express";
import cors from "cors";
import routes from "./routes";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { email } from "better-auth";

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

// better auth router
app.all("/api/v1/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use(cors());

app.use("/api/v1", routes);
app.get("/", (req, res) => {
  res.send({ message: "server running" });
});

export default app;
