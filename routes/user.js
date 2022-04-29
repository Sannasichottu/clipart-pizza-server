import express from "express";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { auth } from "../middleware/auth.js";
import { client } from "../index.js";
import bcrypt from "bcrypt";
import {
  CreateUser,
  Getuser,
  genpassword,
  updateUser,
  updatePass,
} from "../helperfunctions.js";
const router = express.Router();

router.route("/signup").post(async (req, res) => {
  const data = req.body;
  const username = data.username;
  const password = data.password;
  const firstname = data.firstname;
  const lastname = data.lastname;
  const phoneno = data.phoneno;
  const email = data.email;

  const userfromDB = await Getuser(
    username ? { username: username } : { email: email }
  );
  console.log(userfromDB);
  if (userfromDB) {
    return res.status(401).send({ message: "credentials already exists" });
  }

  const hashedpassword = await genpassword(password);
  const result = await CreateUser({
    firstname: firstname,
    username: username,
    lastname: lastname,
    phoneno: phoneno,
    email: email,
    password: hashedpassword,
  });
  const userdata = await Getuser({ username: username });
  const token = jwt.sign({ id: userdata._id }, process.env.secret_key);
  // console.log(token);
  const user1 = await updateUser({
    username: userdata.username,
    token: token,
  });

  res.status(200).send({ Msg: "Signup successfully" });
});

router.route("/login").post(async (req, res) => {
  const { username, password } = req.body;
  const userfromDB = await Getuser({ username: username });

  if (!userfromDB) {
    res.status(400).send({ message: "Invalid Credential" });
    return;
  }
  const storedpassword = userfromDB.password;
  // console.log(storedpassword);

  const ispasswordmatch = await bcrypt.compare(password, storedpassword);
  if (ispasswordmatch) {
    res.status(200).send(userfromDB);
  } else {
    res.status(401).send({ message: "Invalid Credentials" });
  }
});

router.route("/forgotpassword").post(async (req, res) => {
  const { email } = req.body;

  const userfromDB = await Getuser({ email: email });
  // console.log(userfromDB);
  if (!userfromDB) {
    // console.error("Mail not registered");
    res.status(403).send({ Msg: "Mail is not registered" });
    return;
  }
  const token = userfromDB.token;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: `${process.env.my_gmail}`,
      pass: `${process.env.my_pass}`,
    },
  });

  const link = `https://mega-pizza-delivery.netlify.app/forgotpassword/verify/${token}`;
  // const link = `http://localhost:3000/forgotpassword/verify/${token}`;
  const mailoptions = {
    from: "userbase@gmail.com",
    to: email,
    subject: "Link to reset password",
    html: `<h1>Hello ${userfromDB.username}</h1>
        <p>You are requested to change password</p>
        <p>Please click on the following link or paste this in your browser to complete the process of reset password</p>
          <a href=${link} target=_parent>Click to reset password</a>
          <p>Automatically it redirected you to resetpassword page</p>`,
  };

  transporter.sendMail(mailoptions, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Email sent: " + res.response);
    }
  });
  res.status(200).send({ Msg: "recovery mail sent" });
});

router.route("/forgotpassword/verify").get(auth, async (req, res) => {
  return res.status(200).send({ Message: "token matched" });
});

router.route("/resetpassword").post(async (req, res) => {
  const { password, token } = req.body;
  // console.log(token);
  const data = await Getuser({ token: token });
  // console.log(data);
  // the data is not there in the DB return an error msg
  if (!data) {
    return res.status(401).send({ Message: "Invalid credentials" });
  }
  const { email } = data;
  // console.log(email);

  const hashedpassword = await genpassword(password);
  const user = await updatePass({
    email: email,
    password: hashedpassword,
  });
  const result = await Getuser({ email });
  res.send(user);
});

router.route("/edit/:id").put(async (req, res) => {
  const data = req.body;
  console.log(data);
  const user = await client
    .db("pizzadelivery")
    .collection("users")
    .updateOne({ username: data.username }, { $set: data });
  const userdetail = await Getuser({ username: data.username });
  console.log(userdetail);
  res.send(userdetail);
});

router.route("/getuser").get(async (req, res) => {
  const token = req.header("x-auth-token");
  const user = await Getuser({ token: token });
  res.send(user);
});
export const userRouter = router;
