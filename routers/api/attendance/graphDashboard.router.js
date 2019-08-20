const router = require("express").Router({ mergeParams: true });
const dashBoard = require("./functions/dashBoardData");

router.route("/status").get(async (req, res) => {
  try {
    let projects = await dashBoard.getProjects();
    
    //const projects = await dashBoard.getShiftTimings(projects);
    res
      .status(200)
      .json(projects);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: `Error:: ${error.name}`, error: true, data: null });
  }
});

module.exports = router;