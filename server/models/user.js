const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile_picture: {type:String,required:true},
    dateOfBirth: { type: Date ,required:true}, 
    gender: { type: String, enum: ['male', 'female', 'other'] ,required:true} 

});

module.exports = mongoose.model('User', userSchema);
