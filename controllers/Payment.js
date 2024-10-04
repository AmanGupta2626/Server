import * as res from "express/lib/response";
import Razorpay from "razorpay";
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/user");
const mailSender = require("../utils/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
// capture the payment and initiate the razorpay order
exports.capturePayment = async (req, res) => {
  // get courseId and UserId
  const { courseId } = req.body;

  const userId = req.User.id;
  // validation
  //valid courseId
  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: "courseId is required",
    });
  }
  //valid Coursedetails
  let course;
  try {
    course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "course not found",
      });
    }
    //user already  pay for the same course
    const uid = new mongoose.Types.ObjectId(userId);
    if (course.studentEntolled.includes(uid)) {
      return res.status(400).json({
        success: false,
        message: "student already enrolled",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  //ordercreate
  const amount = course.price;
  const currency = "INR";
  const options = {
    amount: amount * 100,
    currency,
    reciept: math.random(Date.now()).toString(),
    notes: {
      courseId: course_id,
      userId,
    },
  };
  try {
    //initiate the payment using RazorPay
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);
    //return response
    return res.status(200).json({
      success: true,
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      orderId: paymentResponse.id,
      currency: paymentResponse.currency,
      amount: paymentResponse.amount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
      message: "could not intiate order",
    });
  }
};
// verify Signature  of Razorpay server
exports.verifySignature = async (req, res) => {
  const webhookSecret = "12345678";
  const signature = req.headers["x-razorpay-signature"];
  const shasum = crypto.createHmac("sha256", webhookSecret);
  shasum.update(JSON.stringify(req.body));
  const disest = shasum.digest("hex");
  if (signature === disest) {
    console.log("Payment is verified");
    const { courseId, userId } = req.body.payload.payment.entity.notes;
    try {
      // fullfill the action
      //find the course and enroll the student in it

      const enrolledCourse = await Course.findOneAndUpdate(
        {
          _id: courseId,
        },
        {
          $push: { studentEnrolled: userId },
        },
        {
          new: true,
        }
      );
      if (!enrolledCourse) {
        return res.status(400).json({
          success: false,
          message: "course not found",
        });
        console.log(enrolledCourse);
      }
      // find the student and add the courses to their list enrolledcourse me
      const enrolledStudent = await User.findOneAndUpdate(
        { _id: userId },
        {
          $push: { courses: courseId },
        },
        { new: true }
      );
      console.log(enrolledStudent);
      //mail send kar do confirmation wala
      const emailResponse = await mailSender(
        enrolledStudent.email,
        "Congratulation from code help",
        "Congratulation, you are onboard to new codehelp course"
      );
      console.log(emailResponse);
      return res.status(200).json({
        success: true,
        message: "signature verified  and course added",
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  } else {
    return res.status(500).json({
      success: false,
      message: "signature not verified",
    });
  }
};
