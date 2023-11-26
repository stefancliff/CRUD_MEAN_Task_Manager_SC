// This is the MongoDB connection handler

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('Leaving this blank, for safety reasons', {useNewUrlParser: true}).then(() => {
    console.log("Connected to MongoDB! :D ");
}).catch((e)=>{
    console.log("Connection failed! D: ");
    console.log(e);
});


module.exports = {
    mongoose
};