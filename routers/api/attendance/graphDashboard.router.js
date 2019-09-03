const router = require("express").Router({ mergeParams: true });
const Op = require("sequelize").Op;
const sequelize = require("sequelize");
const shiftModel = require("../../../model/attendance/shift.model");
const empRosterModel = require("../../../model/attendance/employeeWiseRoster.model")

router.route("/status").get(async (req, res) => {
  try {
    const shifts = await shiftModel.findAll({
      order: [['is_general', 'desc'], ['name', 'asc']],
      where: {
        project_id: req.params.projectId,
        working_hours: { [Op.gt]: 0 }
      }
    });

    // find the latest attendance date available
    const empRosterMaxDate = await empRosterModel.findAll({
      attributes: [
        [sequelize.fn('MAX', sequelize.col('day')), "day"]
      ],
      where: {
        project_id: req.params.projectId,
        attendance_status: { [Op.ne]: null }
      }
    });

    const maxAttendDate = empRosterMaxDate.length > 0 ? empRosterMaxDate[0].day : null
    let processingDay = maxAttendDate
    
    // Check if day is sent from front end
    if(req.query.day && req.query.day.length > 0) {
      processingDay = req.query.day
    }

    if (!processingDay) {
      res.status(200).json({ message: `Data currently not available`, error: false, data: null });
      return;
    }

    const promise_arr = []
    shifts.forEach(shift => {
      promise_arr.push(getAttendanceStatus(shift, processingDay, req.params.projectId))
    })

    const result = await Promise.all(promise_arr)
    const data = {
      day: processingDay,
      stats: result
    }

    res.status(200).json({ message: `Success`, error: false, data: data });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: `Error:: ${error.name}`, error: true, data: null });
  }
});

async function getAttendanceStatus(shift, processingDay, projectId) {
  // Calculate in time stats
  const in_right = await empRosterModel.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('in_time')), "in_time"]
    ],
    where: {
      project_id: projectId,
      day: { [Op.eq]: processingDay },
      shift_id: shift.id,
      in_time: { [Op.between]: [shift.in_time_start, shift.in_time_end] }
    }
  })

  const in_grace = await empRosterModel.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('in_time')), "in_time"]
    ],
    where: {
      project_id: projectId,
      day: { [Op.eq]: processingDay },
      shift_id: shift.id,
      in_time: { [Op.between]: [shift.in_time_end, shift.late_time] }
    }
  })

  const in_late = await empRosterModel.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('in_time')), "in_time"]
    ],
    where: {
      project_id: projectId,
      day: { [Op.eq]: processingDay },
      shift_id: shift.id,
      in_time: { [Op.gt]: [shift.late_time] }
    }
  })

  // Calculate Out time stats
  const out_early = await empRosterModel.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('out_time')), "out_time"]
    ],
    where: {
      project_id: projectId,
      day: { [Op.eq]: processingDay },
      shift_id: shift.id,
      out_time: { [Op.lt]: [shift.out_time] }
    }
  })

  const out_right = await empRosterModel.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('out_time')), "out_time"]
    ],
    where: {
      project_id: projectId,
      day: { [Op.eq]: processingDay },
      shift_id: shift.id,
      out_time: { [Op.between]: [shift.out_time_start, shift.out_time_end] }
    }
  })

  const out_late = await empRosterModel.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('out_time')), "out_time"]
    ],
    where: {
      project_id: projectId,
      day: { [Op.eq]: processingDay },
      shift_id: shift.id,
      out_time: { [Op.gt]: [shift.out_time_end] }
    }
  })

  const result = {
    in_time_labels: [
      `${shift.in_time_start}-${shift.in_time_end}`,
      `${shift.in_time_end}-${shift.late_time}`,
      `After ${shift.late_time}`,
    ],
    in_time_data: [
      in_right[0].in_time,
      in_grace[0].in_time,
      in_late[0].in_time,
    ],
    out_time_labels: [
     `Before ${shift.out_time_start}`,
     `${shift.out_time_start}-${shift.out_time_end}`,
     `After ${shift.out_time_end}`,
    ],
    out_time_data: [
      out_early[0].out_time,
      out_right[0].out_time,
      out_late[0].out_time,
    ],
    shift: shift.name,
  }

  return result
}

module.exports = router;