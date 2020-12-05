const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const passwordValidator = require('password-validator');
require('dotenv').config();
const validate = require("./middleware/validate");

const User = require('./models/User');


const transferRoute = require('./routes/transfers');
const moneyRoute = require('./routes/money');

const app = express();
const port = 4200;
const cookieAge = 3600000;
const saltRounds = 15;

app.use(helmet());

app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({extended:true, limit:'50mb'}));

const options = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
};

mongoose.connect(process.env.DB, options, (err, success) => {
    if (success){
        console.log('Izveidots savienojums ar datubazi!');
    } else if (err){
        console.log("Savienojums ar datubazi nav izdevies!");
        console.error(err);
    }
});

app.set('trust proxy', 1);

app.use(session({
    secret: process.env.COOKIE_SECRET,
    saveUninitialized: false,
    name: 'session',
    resave: false,
    rolling: true,
    cookie:{
        expires: new Date(Date.now() + cookieAge),
        maxAge: cookieAge,
        secure: false
    }
}));

app.use('/api/money', moneyRoute);
app.use('/api/transfers', transferRoute);

app.listen(port, () => console.log(`weBank-backend PORT: ${port}`));

app.get('/api/validation', validate(), async (req,res)=>{
    const user = req.userdata;

    if(user===null){
        await res.json({
            success:false,
            message:"Jūs neesat pieslēdzies!"
        })
    }else {
        await res.json({
            success: true,
            message: user.userName,
            userID:user._id
        })
    }


});

app.get('/api/logout', validate(), (req) => {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
    });
});


app.post('/api/login', async (req, res) => {
    const {username, password} = req.body;

    const resp = await User.findOne({userName: username});
    if(!resp) {
        await res.json({
            success: false,
            message: "Šāds lietotājs nav atrasts!"
        });
        return;
    }

    const match = await bcrypt.compare(password, resp.password);
    if(match){
        req.session.userName = resp.userName;
        req.session.name = resp.name;
        req.session.password = resp.password;
        req.session.save();

        console.log("Pieslēdzies lietotājs: "+resp.userName);

        await res.json({
            success: true
        });
        return;
    }
    await res.json({
        success: false,
        message: "Nepareizs lietotājvārds un/vai parole!"
    });
});


app.post('/api/register', async (req, res) => {
    const {username, password, firstname, lastname} = req.body;

    const exists = await User.findOne({userName: username});
    if (exists){
        await res.json({
            success: false,
            message: "Lietotājs ar šādu lietotājvārdu jau eksistē!"
        });
        return;
    }

    if (!validateStringLength(password, 6)){
        await res.json({
            success: false,
            message: "Parolei jābūt vismaz 6 simbolus garai!"
        });
        return
    }

    const salt = await bcrypt.genSaltSync(saltRounds);
    let hash = await bcrypt.hashSync(password, salt);
    const user = new User({
        userName: username,
        password: await hash,
        firstName: firstname,
        lastName: lastname
    });
    await user.save();

    await res.json({
        success: true,
        message: "Reģistrācija veiksmīga! Variet pieslēgties sistēmai!"
    });

});

app.post('/api/getuser', validate(),async (req,res) => {
    const {_id} = req.body;
    User.findOne({_id: _id},{password:0, userLevel:0, userName:0}, function (err, docs) {
        if(!err){
            res.send(docs)
        } else {
            console.log(err);
        }
    })
});




app.post('/api/updateuser', validate(),async (req,res) => {
    const {firstName, lastName} = req.body;
    const userData = req.userdata;

    const user = await User.findOne({_id: userData.id});
    if (!user){
        res.send({
            success:false,
            message:"Kļūda atrodot Jūsu profila datus!"
        });
        return
    }

    if (!validateStringLength(firstName, 3)){
        await res.json({
            success: false,
            message: "Vārdam jābūt vismaz 3 simbolus garam!"
        });
        return
    }
    if (!validateStringLength(lastName, 3)){
        await res.json({
            success: false,
            message: "Uzvārdam jābūt vismaz 3 simbolus garam!"
        });
        return
    }


    User.findOneAndUpdate({_id:userData.id},{firstName: firstName, lastName:lastName}, [],function (err) {
        if (err){
            console.log(err);
            res.send({
                success:false,
                message:"Kļūda labojot personas datus!"
            });
            return
        }
        res.send({
            success: true,
            message: "Dati laboti!"
        })
    })

});


app.post('/api/updatepassword', validate(),async (req,res) => {
    const {password, newPassword} = req.body;
    const userData = req.userdata;

    const userE = await User.findOne({_id: userData.id});
    if (!userE){
        res.send({
            success:false,
            message:"Kļūda atrodot Jūsu profila datus!"
        });
        return
    }


    if (!validateStringLength(newPassword, 6)){
        await res.json({
            success: false,
            message: "Parolei jābūt vismaz 6 simbolus garai!"
        });
        return
    }

    const matchPassword = await bcrypt.compare(password, userE.password);
    if(matchPassword){

        const salt = await bcrypt.genSaltSync(saltRounds);
        let hash = await bcrypt.hashSync(newPassword, salt);

        User.findOneAndUpdate({_id:userData.id},{password: await hash}, [],function (err) {
            if (err){
                res.send({
                    success:false,
                    message:"Kļūda mainot paroli!"
                });
            }else {
                res.send({
                    success: true,
                    message: "Parole nomainīta!"
                })
            }
        })
    }else {
        await res.json({
            success: false,
            message: "Nepareiza pašreizējā parole!"
        });
    }

});

function validateStringLength(string, length){
    const schema = new passwordValidator();
    schema.is().min(length);
    return schema.validate(string)
}
