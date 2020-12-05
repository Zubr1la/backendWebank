const mongoose = require('mongoose');

const MoneySchema = new mongoose.Schema({
    userID: {type: String, required: true, unique: true},
    balance: {type: Number, required: true, default:0},
    moneyID:{type: String, required:true, unique: true},

});

const Money = new mongoose.model("Money", MoneySchema);

module.exports = Money;