import express from "express";
import cors from "cors";
import instrumentRoutes from "./routes/Instrument.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/instruments", instrumentRoutes);

export default app;