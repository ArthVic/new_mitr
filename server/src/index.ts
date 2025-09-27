import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { authRouter } from "./routes/auth";
import { conversationRouter } from "./routes/conversations";
import { settingsRouter } from "./routes/settings";
import { checkoutRouter } from "./routes/checkout";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));


app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api", settingsRouter);
app.use("/api/checkout", checkoutRouter);



app.use(cors({ origin: "http://localhost:8080" }));


const port = Number(process.env.PORT || 4000);
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});



