const Tag = require("../models/Tags");
// create tag ka handler function//
exports.createTag = async (req, res) => {
  try {
    //   fetch data//
    const { name, description } = req.body;
    // validation//
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }
    //   create entry in db//
    const tagDeatils = await Tag.create({
      name: name,
      description: description,
    });
    console.log(tagDeatils);
    // return response//
    return res.status(200).json({
      success: true,
      message: "tag created successfully",
      tagDeatils,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// get all tags//
exports.getAllTags = async (req, res) => {
  try {
    const allTags = await Tag.find({}, { name: true, description: true });
    return res.status(200).json({
      success: true,
      menubar: "all details are fetchde successfully",
      allTags,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
