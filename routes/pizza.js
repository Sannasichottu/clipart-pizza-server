import express from "express";
// import { auth } from "../middleware/auth.js";
import { client } from "../index.js";
import { Getuser } from "../helperfunctions.js";
import { ObjectId } from "mongodb";
const router = express.Router();
import Razorpay from "razorpay";
import shortid from "shortid";
const razorpay = new Razorpay({
  key_id: "rzp_test_wt6S48PF3wQ702",
  key_secret: "JO8zCupfZZMyhnTdo8ErPF9Z",
});

router.route("/").get(async (req, res) => {
  const result = await client
    .db("pizzadelivery")
    .collection("pizzas")
    .find({})
    .toArray();
  res.send(result);
});
router.route("/").post(async (req, res) => {
  const data = req.body;
  //   console.log(data);
  const result = await client
    .db("pizzadelivery")
    .collection("pizzas")
    .insertMany(data);
  res.send(result);
});

router.route("/add-to-cart").post(async (req, res) => {
  const data = req.body;
  // console.log(data);
  const result = await client
    .db("pizzadelivery")
    .collection("cart")
    .insertOne(data);
  res.send(result);
});
router.route("/add-to-cart").get(async (req, res) => {
  const id = req.header("x-auth-token");
  const user = await Getuser({ _id: ObjectId(id) });
  // console.log(user);
  const cart = await client
    .db("pizzadelivery")
    .collection("cart")
    .find({ username: user.username })
    .toArray();
  // console.log(cart);
  res.send(cart);
});
router.route("/product/:id").delete(async (req, res) => {
  const id = req.params;
  const cart = await client
    .db("pizzadelivery")
    .collection("cart")
    .deleteOne({ _id: ObjectId(id) });
  res.send(cart);
});
router.route("/payment").post(async (req, res) => {
  var options = {
    amount: req.body.amountPaid * 100,
    currency: "INR",
    receipt: shortid.generate(),
  };
  try {
    const response = await razorpay.orders.create(options);
    console.log(response);

    if (response) {
      // req.body.transactionId = response.razorpay_payment_id;
      const data = req.body;
      const payment = await client
        .db("pizzadelivery")
        .collection("orders")
        .insertOne(data);
      // res.send(payment);
      const orders = await client
        .db("pizzadelivery")
        .collection("cart")
        .deleteMany();
      res.send({
        id: response.id,
        currency: response.currency,
        amount: response.amount,
      });
    } else {
      return res.status(400).json(error);
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
});
router.route("/orderhistory").get(async (req, res) => {
  const id = req.header("x-auth-token");
  // console.log(id);
  const user = await Getuser({ token: id });
  // console.log(user);
  const orders = await client
    .db("pizzadelivery")
    .collection("orders")
    .find({ username: user.username })
    .toArray();
  // console.log(orders);
  res.send(orders);
});
router.route("/order/:id").delete(async (req, res) => {
  const id = req.params;
  const order = await client
    .db("pizzadelivery")
    .collection("orders")
    .deleteMany({ _id: ObjectId(id) });
  res.send(order);
});

export const pizzaRouter = router;
