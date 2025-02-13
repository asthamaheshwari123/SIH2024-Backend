const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    ageGroup: String,
    gender: String,
    date: {
        type: Date, // Use the Date type
        default: Date.now // Optional: Set the default value to the current date and time
    }
});

module.exports = mongoose.model("User", userSchema);
