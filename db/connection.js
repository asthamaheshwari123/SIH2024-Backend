const mongoose = require("mongoose");
const connectedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("connected");
        
    } catch (err) { 
    console.log("MONGODB connection error");
        
    }
}

module.exports =connectedDB;