const { Mongoose } = require("mongoose");
const category = require("../models/Category");
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const CategorysDetails = await category.create({
      name: name,
      description: description,
    });
    console.log(CategorysDetails);
    return res.status(200).json({
      success: true,
      message: "Categorys Created Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.showAllCategory = async (req, res) => {
  try {
    const allCategorys = await category.find({});
    res.status(200).json({
      success: true,
      data: allCategorys,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// categoryPageDetails
exports.categoryPageDetails = async (req, res) => {
  try {
    //get categoryId
    const { categoryId } = req.body;
    //get courses for specified categoryId
    const selectedCategory = await category
      .findById(categoryId)
      .populate("courses")
      .exec();
    //validation
    if (!selectedCategory) {
      return res.status(400).json({
        success: false,
        message: "category not found",
      });
    }
    //get course for diffrent category
    const differentCategories = await category
      .find({
        _id: { $ne: categoryId },
      })
      .populate("courses")
      .exec();
    //   get top selling courses
    //HW

    //return response
    return res.status(200).json({
      success: true,
      message: "category page details fetched successfully",
      data: {
        selectedCategory,
        differentCategories,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
