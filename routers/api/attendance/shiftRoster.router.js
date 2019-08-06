const router = require("express").Router({ mergeParams: true });
const Op = require("sequelize").Op;
const formatDate = require("../shared/functions/formatDate");
const shiftRoster = require("../../../model/attendance/shiftRoster.model");
const groupModel = require("../../../model/attendance/group.model");

router
  .route("/")
  .get((req, res) => {
    fromDate = req.query.from_date;
    toDate = req.query.to_date;
    shiftRoster
      .findAll({
        include: [
          {
            model: groupModel,
            as: "group",
            where: { project_id: req.params.projectId }
          }
        ],
        where: { day: { [Op.between]: [fromDate, toDate] } },
        order: [["day", "ASC"]]
      })
      .then(results => {
        const data = results.map(result => {
          return Object.assign(
            {},
            {
              day: result.day,
              group_id: result.group_id,
              shift_id: result.shift_id
            }
          );
        });
        res.status(200).json(formatAttendanceData(data));
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Opps! Some error happened!!" });
      });
  })

  .post(async (req, res) => {
    let groupDutyRoster = await req.body
      .map(val =>
        val.group_shifts.map(data =>
          Object.assign(
            {
              day: val.day,
              created_by: req.user.emp_code,
              updated_by: req.user.emp_code
            },
            data
          )
        )
      )
      .reduce((l, n) => l.concat(n), []);

    shiftRoster
      .bulkCreate(groupDutyRoster, { updateOnDuplicate: true })
      .then(result => res.status(200).json(formatAttendanceData(result)))
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Opps! Some error occured!!" });
      });
  });

function formatAttendanceData(data) {
  return Object.values(
    data.reduce((a, { day, group_id, shift_id }) => {
      if (!a[day]) a[day] = { day, group_shifts: [] };
      const aw = Object.assign({}, { group_id, shift_id });
      a[day].group_shifts.push(aw);
      return a;
    }, {})
  );
}

module.exports = router;
