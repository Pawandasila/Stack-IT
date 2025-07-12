import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/connectDB.js";

import userRoutes from "./routes/user.route.js";
import questionRoutes from "./routes/question.route.js";
import answerRoutes from "./routes/answer.route.js";
import commentRoutes from "./routes/comment.route.js";
import tagRoutes from "./routes/tag.route.js";
import voteRoutes from "./routes/vote.route.js";
import notificationRoutes from "./routes/notification.route.js";
// import productRoute from "./routes/product.route.js";
// import cartRoute from "./routes/cart.route.js";
// import orderRoute from "./routes/order.route.js";

import adminRoutes from './routes/admin.routes.js';
// import userRoutes from './routes/user.routes.js';



dotenv.config();

const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
  })
);




app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/notifications", notificationRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.get("/api", (req, res) => {
  res.json({ message: "API is working!" });
});

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.json({
    message: "server is running",
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
  });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("🚀Server listening on port🚀", PORT);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
