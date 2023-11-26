const mongoose = require('mongoose');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// JWT Secret
const jwtSecret = "86945287102225517068ygasiudiuelknpdjfwo1124w@@1";

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minLength: 1,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: 8
    },
    sessions: [{
        token:{
            type: String,
            required: true
        },
        expiresAt: {
            type: Number,
            required: true
        }
    }]
});

// Instance Methods!

UserSchema.methods.toJSON = function(){
    const user = this;
    const userObject = user.toObject();

    // returning the document without the email nor the session (these are meant to stay hidden)
    // Using lodash for this return (npm install loadash --save)
    // Inside this method (omit()) we put an array of the fields we want to omit
    return _.omit(userObject, ['password', 'sessions']);
}

UserSchema.methods.generateAccessAuthToken = function(){
    const user = this;
    return new Promise((resolve, reject) =>{
        // Inside of here I'll be generating my JWT
        // Obviously first you have to install it via npm install jsonwebtoken --save
        jwt.sign({_id: user._id.toHexString() }, jwtSecret, {expiresIn: "10m" }, (err, token) =>{
            if(!err){
                resolve(token);
            } else {
                // there is an error
                reject();
                console.log("GenerateAuthToken Error");
            }
        })
    })
}

UserSchema.methods.generateRefreshAuthToken = function(){
    // This method simply generates a random 64byte hex string that doesn't save inside the database
    return new Promise((resolve, reject) =>{
        crypto.randomBytes(64, (err, buf)=>{
            if(!err){
                // no error
                let token = buf.toString('hex');

                return resolve(token);
            }
        })
    })
}

UserSchema.methods.createSession = function(){
    let user = this;
    return user.generateAccessAuthToken().then((refreshToken) => {
        return saveSessionToDatabase(user, refreshToken);
    }).then((refreshToken) => {
        return refreshToken;
    }).catch((e) => {
        return Promise.reject('Failed to save the session to the database.\n' + e);
    })
}

// Model Methods (static methods), this methods can be called on the model and not an instance of a model.
// AKA Not on a userObject, rather the user.model class itself

UserSchema.statics.getJWTSecret =  () => {
    return jwtSecret;
}

UserSchema.statics.findByIdAndToken = function(_id, token) {
    // find a specific user by their id and token, 
    // this is used in the auth middleware(verifySession)
    const User = this;

    return User.findOne({
        _id,
        'sessions.token': token
    });
}

UserSchema.statics.findByCredentials = function(email, password) {
    let User = this;
    return User.findOne({email}).then((user) => {
        if (!user) return Promise.reject();

            return new Promise((resolve, reject) => {
                bcrypt.compare(password, user.password,(err, res) =>{
                    if(res) resolve(user);
                    else {
                        console.log('Password fail!');
                        reject();
                    }
                })
            })
    })
}

UserSchema.statics.hasRefreshTokenExpired = (expiresAt) =>{
    
    let secondsSinceEpoch = Date.now() / 1000;
    if(expiresAt > secondsSinceEpoch){
        // has not expired yet
        return false;
    }
    else
    {
        // it expired
        return true;
    }
}

// Middleware
// Before a user document is saved, this code runs
UserSchema.pre('save', function(next) {
    let user = this;
    // now using a hash for the password, via npm install bcryptjs --save
    let costFactor = 10;

    if(user.isModified('password')){
        // if the password field has been edited/changed, then run this code.
        // Generating Salt and Hashing the password
        bcrypt.genSalt(costFactor, (err, salt) => {
            bcrypt.hash(user.password, salt,(err, hash) => {
                user.password = hash;
                next();
            });
        });
    }
    else {
        next();
    }
});


// Helper Methods

let saveSessionToDatabase = (user, refreshToken) => {
    // Saves the session to the database
    return new Promise((resolve, reject) => {
        let expiresAt = generateRefreshTokenExpiryTime();

        user.sessions.push({'token': refreshToken, expiresAt});

        user.save().then(() => {
            return resolve(refreshToken);
        }).catch((e) => {
            console.log('Failed to save session to database');
            reject(e);
        });
    })
}

let generateRefreshTokenExpiryTime = () => {
    let daysUntilExpire = "10";
    let secondsUntilExpire = ((daysUntilExpire * 24) * 60) * 60;
    return ((Date.now() / 1000 ) + secondsUntilExpire);
}

const User = mongoose.model('User', UserSchema);

module.exports = { User }