const express = require('express');
const router = express.Router();
const Money = require('../models/Money');
const Transfers = require('../models/Transfers');
const validate = require('../middleware/validate');

router.post('/', validate(),async (req, res) => {

    const userData = req.userdata;

    const findMoney = await Money.findOne({userID:userData.userName});
    if (findMoney) {
        res.send({
            success: false,
            message: "Jums jau ir izveidots viens konts!"
        });
    }else {

        const newMoney = new Money({
            userID:userData.userName,
            balance:0,
            moneyID: userData.firstName[0].toUpperCase() + userData.lastName[0].toUpperCase() + Math.floor(Math.pow(10, 10-1) + Math.random() * 9 * Math.pow(10, 10-1))

        });
        newMoney.save( function (err, doc) {
            if (err){
                res.send({
                    success: false,
                    message: "Kļūda izveidojot kontu!"
                });
                console.log(err);
                return
            }

            if (doc){
                res.send({
                    success: true,
                    message: "Konts izveidots!"
                })
            }
        });

    }



});

router.post('/addmoney', validate(), async function(req, res){
    const {moneyTop} = req.body;
    const userData = req.userdata;
    let balToUpdate;
    const findMoney = await Money.findOne({userID:userData.userName});
    if (!findMoney) {
        res.send({
            success: false,
            message: "Tev nav pievienota kartes informācija!"
        });
        return;
    }else {
        balToUpdate = (parseFloat(findMoney.balance)+parseFloat(moneyTop)).toFixed(2);
    }

    Money.findOneAndUpdate({userID:userData.userName},{balance: balToUpdate}, [],function (err) {
        if (err){
            console.log(err);
            res.send({
                success:false,
                message:"Kļūda pievienojot naudu!"
            });
            return
        }
        res.send({
            success: true,
            message: "Nauda pievienota!"
        })
    });

    const findMoneyOwner = await Money.findOne({userID:userData.userName});
    if (!findMoneyOwner) {
        res.send({
            success: false,
            message: "Jums nav pievienots konts!"
        });
        return;
    }
    let value = parseFloat(moneyTop).toFixed(2);
    const transfer = new Transfers({
        senderID:"WE BANK RESOURCES",
        receiverID:findMoneyOwner.moneyID,
        balance:value,
        comment:"Inside payment",

    });
    transfer.save( function (err, doc) {
        if (err){
            console.log("ERROR SAVING TRANSACTION!");
            console.log(err);
            return
        }

        if (doc){

            console.log("Transaction saved!");
            console.log(transfer);
        }
    })


});


router.post('/transfer', validate(), async function(req, res){
    const {bankID, value, comment} = req.body;
    const userData = req.userdata;
    let balToUpdateOwner;
    let balToUpdateReceiver;
    const findMoneyOwner = await Money.findOne({userID:userData.userName});
    const findMoneyReceiver = await Money.findOne({moneyID:bankID});
    if (!findMoneyOwner) {
        res.send({
            success: false,
            message: "Jums nav pievienots konts!"
        });
        return;
    }

    if(isNaN(value)){
        res.send({
            success: false,
            message: "Saņemts nederīgs naudas daudzums!"
        });
        return;
    }

    if(parseFloat(findMoneyOwner.balance)<value){
        res.send({
            success: false,
            message: "Jums Kontā nepietiek naudas!"
        });
        return;
    }

    if (!findMoneyReceiver) {
        res.send({
            success: false,
            message: "Šāds konta numurs nav atrasts!"
        });
        return;
    }


    //sender update

    balToUpdateOwner = (parseFloat(findMoneyOwner.balance)-parseFloat(value)).toFixed(2);

    Money.findOneAndUpdate({userID:userData.userName},{balance: balToUpdateOwner}, [],function (err) {
        if (err){
            console.log(err);
            res.send({
                success:false,
                message:"Kļūda veicot maksājumu! Pārskaitījums nav veikts!"
            });
            return
        }

    });

    //receiver update

    balToUpdateReceiver = (parseFloat(findMoneyReceiver.balance)+parseFloat(value)).toFixed(2);

    Money.findOneAndUpdate({moneyID:bankID},{balance: balToUpdateReceiver}, [],function (err) {
        if (err){
            console.log(err);
            res.send({
                success:false,
                message:"Kļūda pārsūtot naudu!"
            });
            return
        }
        res.send({
            success: true,
            message: "Veiksmīgi pārsūtīti " + parseFloat(value).toFixed(2) + " EUR uz kontu: " + bankID,
        })
    });

    const transfer = new Transfers({
        senderID:findMoneyOwner.moneyID,
        receiverID:bankID,
        balance:value,
        comment:comment,
        date_created:Date.now()+7200000

    });
    transfer.save( function (err, doc) {
        if (err){
            console.log("ERROR SAVING TRANSACTION!");
            console.log(err);
            return
        }

        if (doc){

            console.log("Transaction saved!");
            console.log(transfer);
        }
    })




});


router.get('/getmoneydata', validate(), async function(req, res){

    const userData = req.userdata;

    const findMoney = await Money.findOne({userID:userData.userName});
    if (!findMoney) {
        res.send({
            success: false,
            message: "Nav izveidots konts!",
            balance:0,
        });
        return;
    }

    Money.findOne({userID:userData.userName}, [],function (err, docs) {
        if (err){
            res.send({
                success:false,
                message:"Kļūda iegūstot konta atlikumu!"
            });
            return
        }
        res.send({
            docs
        })
    })
});


module.exports = router;

