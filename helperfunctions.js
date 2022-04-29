import { client } from "./index.js";
import bcrypt from "bcrypt";

async function CreateUser(data) {
  return await client.db("pizzadelivery").collection("users").insertOne(data);
}

async function Getuser(data) {
  return await client.db("pizzadelivery").collection("users").findOne(data);
}

async function genpassword(password) {
  const NO_OF_ROUNDS = 10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedpassword = await bcrypt.hash(password, salt);
  console.log(hashedpassword);
  return hashedpassword;
}
async function updateUser({ username, token }) {
  await client
    .db("pizzadelivery")
    .collection("users")
    .updateOne({ username: username }, { $set: { token: token } });
}
async function updatePass({ email: email, password: hashedpassword }) {
  await client
    .db("pizzadelivery")
    .collection("users")
    .updateOne({ email: email }, { $set: { password: hashedpassword } });
}
export { CreateUser, Getuser, genpassword, updateUser, updatePass };
