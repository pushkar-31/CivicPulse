import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to CivicPulse API",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CivicPulse API is healthy",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`CivicPulse API running at http://localhost:${PORT}`);
  });
};

startServer();