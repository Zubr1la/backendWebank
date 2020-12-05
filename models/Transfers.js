const mongoose = require('mongoose');

const TransferSchema = new mongoose.Schema({
    senderID: {type: String, required: true, unique: false},
    receiverID: {type: String, required: true, unique:false},
    balance:{type: Number, required:true, unique: false},
    comment: {type: String, required: true, unique:false},
    date_created: {type: Date, default: Date.now()},

});

const Transfers = new mongoose.model("Transfers", TransferSchema);

module.exports = Transfers;