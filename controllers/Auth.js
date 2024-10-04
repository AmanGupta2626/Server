const User = require("../models/user");
const Profile = require("../models/profile");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
require("dotenv").config();
// send otp
exports.sendOTP = async (req, res) => {
  // fetch email from emails body
  try {
    const { email } = req.body;
    //check if user already exists
    const checkUserPresent = await User.findOne({ email });
    // if user already exist then return a response
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already exists",
      });
    }
    //   generate otp
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false, //
      specialChars: false,
    });
    console.log("otp generated", otp);
    //   check unique otp or not
    let result = await OTP.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false, //
        specialChars: false,
      });
      const result = await OTP.findOne({ otp: otp });
      console.log("Result is Generate OTP Func");
      console.log("OTP", otp);
      console.log("Result", result);
      while (result) {
        otp = otpGenerator.generate(6, {
          upperCaseAlphabets: false,
        });
      }
    }
    const otpPayload = { email, otp };
    //   create an entry in db
    const otpBody = await OTP.create({ email, otp });
    console.log("otp created", otpBody);
    //   return response success
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
      // message: "otp not send server error",
    });
  }
};
// signup
exports.signUp = async (req, res) => {
  try {
    // data fetcf from  req body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      otp,
    } = req.body;
    //validate data
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "Please enter all fields",
      });
    }
    //2 password match kar lo
    if (password !== confirmPassword) {
      return res.status(403).json({
        success: false,
        message: "Passwords do not match",
      });
    }
    //check user already exist ot not
    const exestingUser = await User.findOne({ email });
    if (exestingUser) {
      return res.status(403).json({
        success: false,
        message: "User already exists",
      });
    }
    // find the most recent otp for the user
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log(recentOtp);
    if (recentOtp.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    } else if (otp !== recentOtp[0].otp) {
      //   invalid otp
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // validate otp
    //hash password
    const hashPassword = await bcrypt.hash(password, 10);
    // Create the user
    let approved = "";
    approved === "Instructor" ? (approved = false) : (approved = true);
    //create entry in db
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
      approved: approved,
      accountType: accountType,
      additionalDetails: profileDetails._id,
      image: `http://api.dicebear.com/5.x/initials/svg?seed=${firstName}${lastName}`,
    });
    //return response
    return res.status(200).json({
      success: true,
      message: "user is resistered  Successfully",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
      // message: "user cannot be resistered please try again",
    });
  }
};
//login
exports.login = async (req, res) => {
  try {
    //   get data from req ki body
    const { email, password } = req.body;
    //   validation of data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    //use check exist or not
    const user = await User.findOne({ email }).populate("additionalDetails");
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    //   generate jwt , after password matches
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      user.token = token;
      user.password = undefined;

      // create cookie and send response
      const options = {
        expiresIn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "logged in successfully",
      });
    } else
      return res.status(403).json({
        success: false,
        message: "Password is incorrect",
      });
  } catch (error) {
    console.log(error);
    return res.status(403).json({
      success: false,
      message: error.message,
      // message: "login failure please try again",
    });
  }
};
//change password
exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id);

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body;

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" });
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    );

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      );
      console.log("Email sent successfully:", emailResponse.response);
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    });
  }
};
