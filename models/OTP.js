const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");
const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 5 * 60,
  },
});
// a function to send a email
async function sendVerificaitonEmail(email, otp) {
  try {
    const mailResponse = await mailSender(
      email,
      "verification email from StudyNotion",
      emailTemplate(otp)
    );
    console.log("email send sucessfully", mailResponse);
  } catch (error) {
    console.error("error occured during sending mail: ", error);
  }
}
OTPSchema.pre("save", async function (next) {
  await sendVerificaitonEmail(this.email, this.otp);
  next();
});
module.exports = mongoose.model("OTP", OTPSchema);
