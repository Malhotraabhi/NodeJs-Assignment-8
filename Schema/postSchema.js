const { default: mongoose, Schema } = require("mongoose");
const User = require("./userSchema");

const postSchema=mongoose.Schema({
    title:{type:String},
    body:{type:String},
    image:{type:String},
    user:{type:Schema.Types.ObjectId,ref:User},
})
const Posts=mongoose.model('Post',postSchema)
module.exports=Posts;