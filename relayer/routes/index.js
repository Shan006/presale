const express = require("express");
const router = express.Router();
const axios = require("axios");
const ethers = require("ethers");
const { PRESALE_ABI } = require("../contracts");

router.get("/current-ton-price", async (req, res) => {
  try {
    const response = await axios.get(process.env.TON_PRICE_ENDPOINT, {
      headers: {
        Accepts: "application/json",
        "x-cg-pro-api-key": process.env.TON_PRICE_API_KEY,
      },
      params: {
        x_cg_pro_api_key: process.env.TON_PRICE_API_KEY,
        ids: "toncoin",
        vs_currencies: "usd",
      },
    });
    console.log(response);
    return res.status(200).json({ ok: true, data: response.data.data });
  } catch (err) {
    console.log("fetch ton price error: ", err);
  }
});

router.post("/buy-with-ton", async (req, res) => {
  try {
    const { data, recipient } = req.body;
    const abiCoder = new ethers.AbiCoder();
    const secretKeyBytes = ethers.toUtf8Bytes(process.env.SECRET_KEY);
    const secretKeyHash = ethers.keccak256(secretKeyBytes);
    console.log(secretKeyHash);
    const encodedData = abiCoder.encode(
      ["string", "string"],
      [data, secretKeyHash]
    );

    const encodedHash = ethers.keccak256(encodedData);
    console.log("Encoded Hash:", encodedHash);
    const contract = new ethers.Contract(
      process.env.PRESALE_ADDRESS,
      PRESALE_ABI
    );
    const tx = await contract.getPresaleClaimed(recipient);
    await tx.wait();
    console.log(tx);
  } catch (err) {
    console.log("buy with ton error: ", err);
  }
});

module.exports = router;
