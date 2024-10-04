const express = require("express");
const app = express();
const userRoute = require("./routes/User");
const profileRoute = require("./routes/Profile");
// const paymentRoute = require("./routes/Payment");
const courseRoute = require("./routes/Course");

const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const { connections } = require("mongoose");
dotenv.config();
const Port = process.env.PORT || 4000;
//database connect
database.connect();
//use middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp",
  })
);
// cloudinary connections
cloudinaryConnect();
//routes
app.use("/api/v1/auth", userRoute);
app.use("/api/v1/profile", profileRoute);
// app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/course", courseRoute);
// def route
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Your server is running successfully",
  });
});
app.listen(Port, () => {
  console.log(`App is running on ${Port}`);
});
