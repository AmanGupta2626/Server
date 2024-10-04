const mongoose = require("mongoose");
require("dotenv").config();
exports.connect = () => {
  mongoose
    .connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("db connected succesfully");
    })
    .catch((error) => {
      console.log("db connection failed");
      console.log(error);
      process.exit(1);
    });
};
