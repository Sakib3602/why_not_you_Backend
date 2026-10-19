import express from "express";
import cors from "cors";
import instrumentRoutes from "./routes/Instrument.routes";
import authRoutes from "./routes/auth.routes";
import cookieParser from "cookie-parser";
import amBatteryRoutes from "./routes/Ambattery.routes";
import imageQuizRoutes from "./routes/imageQuiz.routes";
import adminDashboardRoutes from "./routes/AdminDashboard.routes";
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://whynotyoupsy.com"], 
    credentials: true, 
  })
);

app.use(express.json());
app.use(cookieParser());


app.get("/", (req, res) => {
  res.json({
    message: "API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/instruments", instrumentRoutes);
app.use("/api/am-battery", amBatteryRoutes);
app.use("/api/image-quiz", imageQuizRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);

export default app;