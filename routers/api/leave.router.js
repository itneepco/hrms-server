
const router = require('express').Router()
const ledgerModel = require('../../model/leaveLedger.model')
const leaveTypeModel = require('../../model/leaveType.model')
const Sequelize = require('sequelize');

router.get('/type', (req, res) => {
    leaveTypeModel.findAll()
        .then(result => {
            console.log(result)
            res.status(200).json(result)
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({ message: 'Opps! Some error happened!!' })
        })
})

router.route('/ledger')
    .post((req, res) => {

        ledgerModel.build(
            {
                emp_code: req.body.emp_code,
                cal_year: req.body.cal_year,
                db_cr_flag: req.body.db_cr_flag,
                no_of_days: req.body.no_of_days,
                leave_type_id: req.body.leave_type_id,
                remarks: req.body.remarks
            })
            .save()
            .then(result => {
                console.log(result)
                //res.redirect('/ledger/:'+result.id)
                //res.status(200).send(result)
                findLedger(result.id, res)
            })
            .catch(err => {
                console.log(err)
                res.status(500).json({ message: 'Opps! Some error occured!!' })
            })
    })
router.route('/ledger/:id')
    .get((req, res) => {

        ledgerModel.findOne(
            {
                where: { id: req.params.id },
                include: [{ model: leaveTypeModel }]
            })
            .then(result => {
                res.status(200).json(result)
            })
            .catch(err => {
                console.log(err)
                res.status(500).json({ message: 'Oops! Some error happend' })
            })
    })



    .delete((req, res) => {

        ledgerModel.destroy({
            where: { id: req.params.id }
        })
            .then(result => res.status(200).json(result))
            .catch(err => {
                console.log(err)
                res.status(500).json({ message: 'Opps! Some error happened!!' })
            }
            )
    })

    .put((req, res) => {
        ledgerModel.update(
            {
                emp_code: req.params.emp_code,
                cal_year: req.body.cal_year,
                db_cr_flag: req.body.db_cr_flag,
                no_of_days: req.body.no_of_days,
                leave_type_id: req.body.leave_type_id,
                remarks: req.body.remarks
            },
            { where: { id: req.params.id } })
            .then(() => {
                findLedger(req.params.id, res)
            })
            .catch(err => {
                console.log(err)
                res.status(500).json({ message: 'Opps! Some error happened!!' })
            }
            )
    })

router.route('/status/:emp_code/:year_param')
    .get((req, res) => {


        // let ledg = Object.assign({},
        //     totalCredit(req.params.emp_code, req.params.year_param),
        //     totalDebit(req.params.emp_code, req.params.year_param)
        //    )

        getTotalDebitCredit(req.params.emp_code, req.params.year_param)
            .then(
                val => {
                    console.log("Total", JSON.stringify(val[0]), JSON.stringify(val[1]))
                    res.status(200).json({})
                }
            )
            .catch(error => {
                console.log(error)
            })


    })

router.route('/ledger/employee/:emp_code')
    .get((req, res) => {
        let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
        let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 30
        let offset = pageIndex * limit

        ledgerModel.findAndCountAll({
            where: { emp_code: req.params.emp_code },
            include: [{ model: leaveTypeModel }],
            order: [['updated_at', 'DESC']],
            limit: parseInt(req.query.pageSize),
            offset: offset
        })
            .then(result => {
                res.status(200).json(result)
            })
            .catch(err => {
                console.log(err)
                res.status(500).json({ message: 'Oops! Some error happend' })
            })

    })

function findLedger(lid, res) {
    ledgerModel.findOne(
        {
            where: { id: lid },
            include: [{ model: leaveTypeModel }]
        })
        .then(result => {
            res.status(200).json(result)
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({ message: 'Oops! Some error happend' })
        })
}

module.exports = router


function totalCredit(emp_code, cal_year) {

    return ledgerModel.findAll({
        attributes: [[Sequelize.fn('SUM', Sequelize.col('no_of_days')), 'total_credit']],
        where: {
            emp_code: emp_code,
            cal_year: cal_year,
            db_cr_flag: 'C',
            leave_type_id: 1
        }

    })
        .then(result => {
            // console.log(result)
            return result
        })
        .catch(err => {
            console.log(err)
            return 0
        })
}

function totalDebit(emp_code, cal_year) {
    return ledgerModel.findAll({
        attributes: [[Sequelize.fn('SUM', Sequelize.col('no_of_days')), 'total_debit']],
        where: {
            emp_code: emp_code,
            cal_year: cal_year,
            db_cr_flag: 'D',
            leave_type_id: 1
        }

    })
        .then(result => {
            // console.log(result)
            return result
        })
        .catch(err => {
            console.log(err)
            return 0
        })
}

function getTotalDebitCredit(emp_codee, cal_year) {
    let total_credit = totalCredit(emp_codee, cal_year)
    let total_debit = totalDebit(emp_codee, cal_year)

    return Promise.all([total_credit, total_debit])
    // console.log("Total credit", total_credit,"Total debit", total_debit)
}