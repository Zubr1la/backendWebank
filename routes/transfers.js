const express = require('express');
const router = express.Router();
const Transfers = require('../models/Transfers');
const Money = require('../models/Money');
const validate = require('../middleware/validate');


router.get('/rectransactions',validate(), async (req,res) => {

    const userData = req.userdata;

    const findMoney = await Money.findOne({userID:userData.userName});

    if (!findMoney) {
        res.send({
            success: false,
        });
        return;
    }

    Transfers.find({receiverID:findMoney.moneyID}, function (err, docs) {
        if(!err){
            res.send(docs)
        } else {
            console.log(err);
        }
    })
});


router.get('/senttransactions',validate(), async (req,res) => {

    const userData = req.userdata;

    const findMoney = await Money.findOne({userID:userData.userName});

    if (!findMoney) {
        res.send({
            success: false,
        });
        return;
    }


    Transfers.find({senderID:findMoney.moneyID}, function (err, docs) {
        if(!err){
            res.send(docs)
        } else {
            console.log(err);
        }
    })
});

module.exports = router;

