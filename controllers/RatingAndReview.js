const ratingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");
// create rating
exports.createRating = async (req, res) => {
  try {
    // get userid
    const userid = req.user.id;
    // fetch data from req ki body
    const { rating, review, courseId } = req.body;
    //check if user is enrolled or not
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $elemMatch: { $eq: userid } },
    });
    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Student is not enrolled in this course",
      });
    }
    //check is user already  reviewed the course
    const alreadyReviwed = await ratingAndReview.findOne({
      user: userid,
      course: courseId,
    });
    if (alreadyReviwed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this course",
      });
    }
    //create rating and review
    const ratingReview = await ratingAndReview.create({
      rating,
      review,
      course: courseId,
      user: userid,
    });
    //update the  course with rating and review
    const updatedCouseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: { ratingAndReview: ratingReview._id },
      },
      { new: true }
    );
    console.log(updatedCouseDetails);
    // return response
    return res.status(200).json({
      success: true,
      message: "Review and rating created   successfully",
      ratingReview,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//getAverage rating
exports.getAverageRating = async (req, res) => {
  try {
    //   get courseId//
    const courseId = req.body.courseId;
    // calculate averageRating
    const result = await ratingAndReview.aggregate([
      {
        $match: { course: new mongoose.Types.ObjectId(courseId) },
      },
      {
        $group: {
          _id: null,
          averageRaring: { $avg: "rating " },
        },
      },
    ]);
    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: result[0].averageRating,
      });
    }
    //if no rating review exist
    return res.status(200).json({
      success: true,
      message: "No rating found",
      averageRating: result[0].averageRating,
    });

    //return rating
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// getAllRatingAndReviews
exports.getAllRaing = async (req, res) => {
  try {
    const allReview = await ratingAndReview
      .find({})
      .sort({ raring: "desc" })
      .populate({
        path: "user",
        select: "firstName lastName email image",
      })
      .populate({
        path: "course",
        select: "courseName",
      })
      .exec();
    return res.status(200).json({
      success: true,
      message: "All Reviews fetched successfully",
    });
  } catch (error) {}
};
