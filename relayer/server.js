const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mainRouter = require("./routes");
// const ethers = require("ethers");
require("buffer");
require("dotenv").config();

const app = express();

// Using middlewares
app.use(bodyParser.json());
app.use(cors());

app.use("/api/v1", mainRouter);

const port = process.env.PORT || 5000;

// app.post("/buy-with-ton", async (req, res) => {
//   try {
//     const { transactionHash, user, timestamp, nonce } = req.body;
//     const secretKey = process.env.SECRET_KEY;
//     const encodedTxHash = encodeTransactionHash(
//       transactionHash,
//       user,
//       timestamp,
//       secretKey
//     );
//   } catch (err) {
//     console.log("buy-with-ton: ", err);
//   }
// });

// const encodeTransactionHash = (transactionHash, user, timestamp, secretKey) => {
//   return ethers.utils.keccak256(
//     ethers.utils.solidityPack(
//       ["bytes32", "address", "uint256", "uint256", "bytes32"],
//       [transactionHash, user, timestamp, nonce, secretKey]
//     )
//   );
// };

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
