const router = require("express").Router({ mergeParams: true });

router.route("/").get(async (req, res) => {
  try {
    res.status(200).json({status: 'OK'});
  } catch (error) {
    console.error("Error : " + error);
    res
      .status(500)
      .json({ message: `Error:: ${error}`, error: true, data: null });
  }
});

module.exports = router;