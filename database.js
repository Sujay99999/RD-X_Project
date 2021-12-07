// THIS database.JS IS MAINLY USED FOR IMPLEMENTING THE FUNCTIONS RELATED TO database functions
const mongoose = require("mongoose");

const DBString = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DBString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log("the DB is connected successfully");
  })
  .catch((err) => {
    console.log(err);
    console.log("error in DB connection");
  });
