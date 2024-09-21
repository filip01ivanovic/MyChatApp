import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        username: String,
        password: String,
        email: String,
        profilePhoto: String
    }, {
      versionKey: false  
    }
);

export default mongoose.model('UserModel', userSchema, 'users');