/** @format */

const mongoose = require("mongoose");

const contactsSchema = new mongoose.Schema({
  name: String,
  phoneNo: Number,
  email: String,
  company: String,
  userId: String,
});

module.exports = mongoose.model("contacts", contactsSchema);
