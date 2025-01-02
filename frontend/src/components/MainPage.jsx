import React, { useEffect, useState } from "react";
import CountdownTimer from "./CountDown";
import { toast } from "react-toastify";
import { PER_USDT_TO_BNB } from "../contracts/contracts";
import useContract from "../hooks/useContract";
import { FaAngleDown } from "react-icons/fa";
import CopyToClipboardButton from "./CoppyBtn";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { PRESALE_CONTRACT_ADDRESS, PRESALE_ABI } from "../contracts/contracts";
import { ethers } from "ethers";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useCustomTonWallet } from "../context/TonWalletContext";
import { buyWithTon } from "../lib/api";
import { base } from "@reown/appkit/networks";
import { Link } from "react-router-dom";
import AccordianGroup from "./AccordianGroup";
import ProgressBar from "./ProgressBar";
import CircularChat from "./CircularChat";
import CustomCarousal from "./CustomCarousal";
import "../responsive.css";
import Spinner from "./Spinner";

const MainPage = () => {
  const [paymenType, setPaymentType] = useState("ETH");
  const [paymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const [amount, setAmount] = useState();
  const [receiveable, setReceiveable] = useState();
  const [totalTokensSold, setTotalTokensSold] = useState(null);
  const [balance, setBalance] = useState(0);
  const [maxBalance, setMaxBalance] = useState(null);
  const [price, setPrice] = useState(0);
  const [totalUsers, setTotalUsers] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalUsdRaised, setTotalUsdRaised] = useState(null);
  const [unclaimedTokens, setUnclaimedTokens] = useState(null);
  const [buyDisabled, setBuyDisabled] = useState(true);
  const [claimDisabled, setClaimDisabled] = useState(true);

  const {
    buy,
    myTokenBalance,
    maxBalances,
    getPrice,
    claimTokens,
    getPresaleAllocation,
  } = useContract();
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork, chainId } = useAppKitNetwork();
  const [tonConnectUI] = useTonConnectUI();
  const { isTonWalletConnected, friendlyAddress, tonBalance } =
    useCustomTonWallet();

  // Handle change or other events
  const handlePaymentTypechange = async (type) => {
    setPaymentType(type);
    setAmount(0);
    setReceiveable(0);
  };

  const handleTonConnect = () => {
    if (!isTonWalletConnected) {
      tonConnectUI.openModal();
    } else {
      tonConnectUI.disconnect();
    }
  };

  const downloadWhitepaper = () => {
    // Replace 'path-to-whitepaper.pdf' with your actual file path or URL
    const link = document.createElement("a");
    link.href = "/CharlieWhitepaper.pdf"; // Adjust path as needed
    link.download = "whitepaper.pdf"; // Name of the downloaded file
    link.click();
  };

  const redirectToMainSite = () => {
    // Replace '/CharlieWhitepaper.pdf' with your actual URL
    window.location.href = "https://charlieunicornai.com/";
  };

  const handlePaymentChange = async (e) => {
    if (paymenType === "TON" && e.target.name === "amount") {
      setAmount(e.target.value);
      return;
    }
    if (!price) {
      return;
    }
    const precision = 15; // Precision for calculations
    const formatValue = (value) => {
      if (Math.abs(value) < 1e-6) {
        // For very small values, use fixed-point notation with high precision
        return value.toFixed(precision);
      }
      return parseFloat(value.toFixed(precision)); // Trim trailing zeros for normal values
    };

    const inputName = e.target.name;
    const inputValue = e.target.value;

    if (inputName === "amount") {
      setAmount(inputValue); // Store raw input as string
      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue)) {
        if (paymenType === "ETH") {
          const value = numericValue * price * PER_USDT_TO_BNB;
          setReceiveable(formatValue(value).toString());
        } else if (paymenType === "USDT") {
          const value = numericValue * price;
          setReceiveable(formatValue(value).toString());
        } else if (paymenType === "USDC") {
          const value = numericValue * price;
          setReceiveable(formatValue(value).toString());
        }
      }
    } else if (inputName === "receiveable") {
      setReceiveable(inputValue); // Store raw input as string
      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue)) {
        if (paymenType === "ETH") {
          const value = numericValue / price / PER_USDT_TO_BNB;
          setAmount(formatValue(value).toString());
        } else if (paymenType === "USDT") {
          const value = numericValue / price;
          setAmount(formatValue(value).toString());
        } else if (paymenType === "USDC") {
          const value = numericValue / price;
          setAmount(formatValue(value).toString());
        }
      }
    }
  };

  // Main functions
  const handleBuy = async () => {
    setLoading(true);
    if (paymenType === "ETH") {
      if (amount > maxBalance.eth) {
        toast.error("Not enough eth balance");
        setLoading(false);
        return;
      }
    } else if (paymenType === "USDT") {
      if (amount > maxBalance.usdt) {
        toast.error("Not enough USDT balance");
        setLoading(false);
        return;
      }
    } else if (paymenType === "USDC") {
      if (amount > maxBalance.busd) {
        toast.error("Not enough BUSD balance");
        setLoading(false);
        return;
      }
    } 
    // else if (paymenType === "TON") {
    //   if (Number(amount) > Number(tonBalance)) {
    //     toast.error("Not enough TON balance");
    //     setLoading(false);
    //     return;
    //   }
    //   if (!isConnected || chainId !== base.id) {
    //     toast.info("Please connect your ETH wallet");
    //     setLoading(false);
    //     return;
    //   }
    //   const toNano = amount * 1_000_000_000;
    //   const transaction = {
    //     messages: [
    //       {
    //         address: "0QCEqTqtwAvKNy0AvTO5mCVopy1ssN_L87RZX8Eb6mA2i2rV",
    //         amount: toNano,
    //       },
    //     ],
    //   };
    //   debugger;
    //   try {
    //     const result = await tonConnectUI.sendTransaction(transaction);
    //     if (result.boc) {
    //       const decodedBoc = Buffer.from(result.boc, "base64");
    //       const hexString = decodedBoc.toString("hex");
    //       const response = await buyWithTon({
    //         data: hexString,
    //         recipient: address,
    //       });
    //       if (response.ok) {
    //       }
    //     }
    //   } catch (err) {
    //     console.log("buy with ton error: ", err);
    //   } finally {
    //     setLoading(false);
    //     return;
    //   }
    // }
    try {
      await buy(paymenType, amount);
      toast.success("Buy Sucessful");
      window.location.reload();
    } catch (err) {
      console.log(err);
      toast.error("Error is Buying");
      setLoading(false);
    }
  };

  const handleClaimTokens = async () => {
    try {
      await claimTokens();
      toast.success("Claim Sucessful");
      window.location.reload();
    } catch (err) {
      console.log(err);
      toast.error("Error Claiming");
      setLoading(false);
    }
  };

  // Hooks
  useEffect(() => {
    const _getPrice = async () => {
      const _price = await getPrice();
      setPrice(_price);
    };
    if (isConnected) _getPrice();
  }, [isConnected]);

  useEffect(() => {
    if (isTonWalletConnected) {
    }
  }, [isTonWalletConnected]);

  useEffect(() => {
    const _balance = async () => {
      const _myBalance = await myTokenBalance();
      setBalance(_myBalance);
      const _maxBalance = await maxBalances();
      setMaxBalance(_maxBalance);
    };
    if (address) _balance();
  }, [address]);

  useEffect(() => {
    if (isConnected && chainId !== base.id) {
      switchNetwork(base);
    }
  }, [isConnected, chainId]);

  useEffect(() => {
    const fetchUnclaimedTokens = async () => {
      try {
        const allocation = await getPresaleAllocation();
        setUnclaimedTokens(allocation);
      } catch (error) {
        console.error(
          "Error fetching unclaimed tokens:",
          error.message || error
        );
        setError(error.message || "Failed to fetch unclaimed tokens.");
      }
    };

    fetchUnclaimedTokens();
  }, [getPresaleAllocation]);

  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        // Connect to the Ethereum network using a public RPC provider
        const provider = new ethers.JsonRpcProvider(
          "https://rpc.ankr.com/base"
        );

        // Create a contract instance
        const contract = new ethers.Contract(
          PRESALE_CONTRACT_ADDRESS,
          PRESALE_ABI,
          provider
        );

        // Call the `totalUsers` function
        const users = await contract.totalUsers();
        setTotalUsers(users.toString()); // Convert BigNumber to string
      } catch (error) {
        console.error("Error fetching total users:", error.message);
        setError("Failed to fetch total users. Please try again later.");
      }
    };

    fetchTotalUsers();
  }, []);

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        // Connect to the Ethereum network using a public RPC provider
        const provider = new ethers.JsonRpcProvider(
          "https://rpc.ankr.com/base"
        );

        // Create a contract instance
        const contract = new ethers.Contract(
          PRESALE_CONTRACT_ADDRESS,
          PRESALE_ABI,
          provider
        );

        // Fetch `totalUsers` from the contract
        const users = await contract.totalUsers();
        setTotalUsers(users.toString()); // Convert BigNumber to string

        // Fetch `totalTokensSold` from the contract
        const tokensSold = await contract.totalTokensSold();
        const formattedTokensSold = parseFloat(
          ethers.formatUnits(tokensSold, 18)
        ).toFixed(2); // Format to two decimals
        setTotalTokensSold(formattedTokensSold);
      } catch (error) {
        console.error("Error fetching contract data:", error.message);
        setError("Failed to fetch data. Please try again later.");
      }
    };

    fetchContractData();
  }, []);

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        // Connect to the Ethereum network using a public RPC provider
        const provider = new ethers.JsonRpcProvider(
          "https://rpc.ankr.com/base"
        );

        // Create a contract instance
        const contract = new ethers.Contract(
          PRESALE_CONTRACT_ADDRESS,
          PRESALE_ABI,
          provider
        );

        // Fetch `totalUsers` from the contract
        const users = await contract.totalUsers();
        setTotalUsers(users.toString()); // Convert BigNumber to string

        // Fetch `totalTokensSold` from the contract
        const tokensSold = await contract.totalTokensSold();
        const formattedTokensSold = parseFloat(
          ethers.formatUnits(tokensSold, 18)
        ).toFixed(2); // Format to two decimals
        setTotalTokensSold(formattedTokensSold);

        // Calculate total USD raised
        const usdRaised = (formattedTokensSold * tokenPriceInUsd).toFixed(2); // Multiply tokens sold by price
        setTotalUsdRaised(usdRaised);
      } catch (error) {
        console.error("Error fetching contract data:", error.message);
        setError("Failed to fetch data. Please try again later.");
      }
    };

    fetchContractData();
  }, []);

  // Constant variables
  const tokenPriceInUsd = 0.00022; // Example price per token in USD (adjust this)

  const members = [
    {
      name: "Lukasz Szymborski",
      role: "CEO",
      photo: "ceo.jpg",
      flag: "poland_flag.svg",
      linkedin:
        "https://pl.linkedin.com/in/%C5%82ukasz-szymborski-8bab38205?utm_source=share&utm_medium=member_mweb&utm_campaign=share_via&utm_content=profile",
    },
  ];

  const developers = [
    {
      name: "Arek",
    },
    {
      name: "Mati",
    },
    {
      name: "Pah",
    },
    {
      name: "Vlad",
    },
    {
      name: "Juri",
    },
  ];

  const AccordianGroupItems = [
    {
      title: "Phase 1",
      info: "10 billion tokens sold * $0.00020/token = $2,000,000",
      activedHeight: 100,
    },
    {
      title: "Phase 2",
      info: "10 billion tokens sold * $0.00024/token = $2,400,000 (20% price increase)",
      activedHeight: 120,
    },
    {
      title: "Phase 3",
      info: "10 billion tokens sold * $0.00028/token = $2,880,000 (16% price increase)",
      activedHeight: 120,
    },
    {
      title: "Phase 4",
      info: "10 billion tokens sold * $0.000345/token = $3,450,000 (23% price increase)",
      activedHeight: 120,
    },
    {
      title: "Phase 5",
      info: "10 billion tokens sold * $0.000414/token = $4,140,000 (20% price increase)",
      activedHeight: 120,
    },
    {
      title: "Phase 6",
      info: "10 billion tokens sold * $0.000496/token = $4,960,000 (10% price increase) Total of 6 phases raised : $19 830 000",
      activedHeight: 130,
    },
  ];

  const RoadMapSlides = [
    <div className="relative clip w-full roadmap h-[350px] bg-gradient">
      <div className="absolute clip inset-[1px] bg-[#181818] opacity-90 overflow-y-auto">
        <div className="py-4 px-4 md:px-10">
          <span className="gradient-text font-semibold text-sm md:text-xl">
            Phase 1
          </span>
          <p className="text-white text-xs md:text-base">
            <br /> - Create Whitepaper.
            <br /> - Start development.
            <br /> - Create landing website.
            <br /> - Build NFT Minting Website
            <br /> - Build Token Presale Website.
            <br /> - Create social media accounts.
            <br />
            <br />
            <h2 className="md:text-xl text-sm font-semibold mb-2 bg-gradient-to-r from-custom-1 via-custom-2 to-custom-4 bg-clip-text text-white">
              Create Token-nomics.
            </h2>
            <br /> - Create token smart contract.
            <br /> - Undergo a KYC and AUDIT.
            <br /> - Build the Charlie AI Chatbot.
            <br /> - Design & craft the official 10K NFT collection.
            <br />
            <br />
            <h2 className="md:text-xl text-sm font-bold mb-2 bg-gradient-to-r from-custom-1 via-custom-2 to-custom-4 bg-clip-text text-white">
              Build Minigame
            </h2>
            <br /> - Build our NFT marketplace.
            <br /> - Design & craft the official 10K NFT collection.
            <br /> - Build a P2E application for telegram and App Store.
            <br /> <br />
          </p>
        </div>
      </div>
    </div>,
    <div className="relative clip w-full roadmap h-[350px] bg-gradient">
      <div className="absolute clip inset-[1px] bg-[#181818] opacity-90 overflow-y-auto">
        <div className="py-4 px-4 md:px-10">
          <span className="gradient-text font-semibold text-sm md:text-xl">
            Phase 2
          </span>
          <p className="text-white text-xs md:text-base">
            <br /> - Build our official Website.
            <br /> - Launch our NFT Collection.
            <br /> - Start Token Presale.
            <br /> - Launch P2E Game on Telegram.
            <br /> - Actively search for partnerships and collaborations.
            <br /> - Start Marketing.
            <br /> - Build Community Engagement.
            <br /> - Write and animate Charlie’s Animation Series.
            <br /> - Charlie Band Music Album on YT.
            <br /> - Develop Cross chain Bridge.
          </p>
        </div>
      </div>
    </div>,
    <div className="relative clip w-full roadmap h-[350px] bg-gradient">
      <div className="absolute clip inset-[1px] bg-[#181818] opacity-90 overflow-y-auto">
        <div className="py-4 px-4 md:px-10">
          <span className="gradient-text font-semibold text-sm md:text-xl">
            Phase 3
          </span>
          <p className="text-xs text-white md:text-base">
            <br /> - Develop DEX.
            <br /> - Develop staking and farms.
            <br /> - End season one on P2E Game.
            <br /> - Develop NFT games for PC and Mobile devices.
            <br /> - Develop our own blockchain.
            <br /> - Develop launchpad.
            <br /> - Start building blockchain.
            <br /> - Start building launchpad.
            <br /> - Create online store.
            <br /> - Improvements and upgrades to our Artificial intelligence.
          </p>
        </div>
      </div>
    </div>,
    <div className="relative clip w-full roadmap h-[350px] bg-gradient">
      <div className="absolute clip inset-[1px] bg-[#181818] opacity-90 overflow-y-auto">
        <div className="py-4 px-4 md:px-10">
          <span className="gradient-text font-semibold text-sm md:text-xl">
            Phase 4
          </span>
          <p className="text-white text-xs md:text-base">
            <br /> - Develop Charlie’s Dating Application.
            <br /> - Start Season two on the P2E Game.
            <br /> - Develop Charlie Wallet.
          </p>
        </div>
      </div>
    </div>,
  ];

  return (
    <>
      <div className="font-[Montserrat] mt-8">
        {/* Header */}
        {/* Main Image Section */}
        <div className="flex justify-center gap-2 md:gap-4 py-6">
          <img src="nft2.png" alt="" className="w-36 md:w-60" />
          <img src="nft.png" alt="" className="absolute w-28 md:w-48" />
          <img src="nft1.png" alt="" className="w-36 md:w-60" />
        </div>
        <div className="pt-6 pb-6 text-center w-[83%] mx-auto">
          <h1 className="text-white text-xl md:text-2xl font-semibold">
            TOKEN PRESALE IS OFFICIALLY LIVE! YOU CAN PURCHASE YOUR CHARLIE
            TOKENS BELOW!
          </h1>{" "}
          <br />
          <p className="text-white/80 font-normal text-sm md:text-base">
            What is Charlie Unicorn AI? Is it a meme? A DAO? A DEX? An AI
            project? DeFi? An NFT collection? An animated series?{" "}
            <br className="hidden md:inline" />
            Well, yes—it's all of that and so much more! Charlie Unicorn AI is
            an innovative blend of meme magic, artificial intelligence, DeFi,
            gaming, NFTs, animated mayhem, and too many more to list here!
            <br className="hidden md:inline" />
          </p>
        </div>
        {/* Cards */}
        <div className="relative card-bar w-[83%] mx-auto bg-gradient [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] mt-8 mb-1 h-[740px] 2xl:h-[380px] xl:h-[380px] lg:h-[220px] md:h-[170px] sm:h-[600px]">
          <div className="[clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] absolute inset-[1px] bg-[#1C1C1C] flex flex-col md:flex-row gap-4 p-5">
            <div className="p-2">
              <img
                src="cs.png"
                alt="CyberScope logo"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="p-2">
              <img
                src="audit.jpeg"
                alt="Audit Certificate"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="p-2">
              <img
                src="kyc.png"
                alt="KYC Certificate"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>

        <div
          className="relative w-[83%] mx-auto bg-gradient border-0 [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] mt-8 mb-1 h-[80px]"
          style={{
            textAlign: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <div className="[clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] absolute inset-[1px] flex items-center justify-center bg-[#1C1C1C] pt-6 pb-6 p-5">
            <span className="gradient-text text-sm md:text-lg font-semibold text-center">
              All Tokens will be claimable after the presale has completed
            </span>
          </div>
        </div>
        <div
          className="relative total bg-gradient h-[380px] w-[83%] mx-auto [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] mt-8 mb-1"
          style={{
            textAlign: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <div className="absolute inset-[1px] bg-[#1C1C1C] [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] p-5 pt-6 pb-6 ">
            <div className="flex flex-col w-full 2xl:w-[25%] xl:w-[25%] lg:w-[40%] md:w-[50%] sm:w-full mx-auto px-4 md:p-0">
              {error ? (
                <p style={{ color: "red" }}>{error}</p>
              ) : (
                <>
                  {/* {totalUsers !== null ? (
                    <div className="w-full flex items-center justify-between">
                      <span className="text-[#747474] font-semibold text-sm md:text-lg">
                        Total Unique Users :{" "}
                      </span>
                      <span className="gradient-text font-semibold text-sm md:text-xl">
                        {totalUsers}
                      </span>
                    </div>
                  ) : (
                    <span>...</span>
                  )}
                  <div className="h-[1px] w-full bg-gradient mt-1"></div> */}
                  {totalTokensSold !== null ? (
                    <div className="mt-4">
                      <div className="w-full flex items-center justify-between">
                        <span className="text-[#747474] font-semibold text-sm lg:text-md">
                          Total Tokens Sold :
                        </span>
                        <span className="gradient-text font-semibold text-sm lg:text-base">
                          100 billion
                        </span>
                      </div>
                      <ProgressBar
                        current={totalTokensSold}
                        limit={100_000_000_000}
                      />
                    </div>
                  ) : (
                    <span>...</span>
                  )}
                  {totalUsdRaised !== null ? (
                    <div className="mt-8">
                      <div className="flex items-center justify-between">
                        <span className="text-[#747474] font-semibold text-sm lg:text-md">
                          Total USD Raised Goal :
                        </span>
                        <span className="gradient-text font-semibold text-sm lg:text-base">
                          $19,830,000
                        </span>
                      </div>
                      <ProgressBar current={totalUsdRaised} limit={19830000} />
                    </div>
                  ) : (
                    <span>...</span>
                  )}
                </>
              )}
              <div className="mt-5">
                <div className="flex items-center justify-center">
                  <span className="gradient-text font-semibold text-sm md:text-xl">
                    Supporting Multichains
                  </span>
                </div>
                <div className="flex flex-row gap-8 items-start justify-center mt-2 support-multichain">
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src="base.svg"
                      alt="BASE"
                      className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                    />
                    <p className="font-normal gradient-text text-sm md:text-lg">
                      BASE
                    </p>
                  </div>
                  <img
                    src="ton.png"
                    alt="TON"
                    className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                  />
                  <img
                    src="bnb.png"
                    alt="BNB"
                    className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                  />
                  <img
                    src="solana.png"
                    alt="SOL"
                    className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row items-start justify-between w-[83%] mx-auto mt-8">
          <div className="bg-gradient [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] relative h-[610px] token-detail w-full lg:w-[50%]">
            <div className="absolute [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] inset-[1px] bg-[#1C1C1C] px-4 md:px-10">
              <div className="mt-8 [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] relative bg-[#444444] token-header h-[90px]">
                <div className="py-2 px-4 absolute inset-[1px] bg-[#1C1C1C] [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)]">
                  <div className="flex flex-col xl:flex-row md:justify-between">
                    <div className="flex flex-align-center">
                      <img src={"./logo.png"} height={60} width={60} alt="" />
                      <h2 className="text-white font-semibold">$CHRLE</h2>
                    </div>
                    <div className="flex flex-row gap-8 items-center mt-2 md:mt-0">
                      <div
                        style={{}}
                        className="transition-all ease-in-out duration-300 hover:scale-105 [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] relative bg-gradient h-[40px] w-[100px] xl:w-[80px]"
                      >
                        <div className="absolute inset-[3px] bg-white [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)]">
                          <button
                            className="absolute inset-[1px] [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-gradient 
                          text-white font-normal text-xs md:text-base
                        "
                          >
                            LIVE
                          </button>
                        </div>
                      </div>
                      <div className="transition-all ease-in-out duration-300 hover:scale-105 [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] relative bg-gradient h-[40px] w-[100px] xl:w-[80px]">
                        <div className="absolute inset-[3px] bg-white [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)]">
                          <button
                            className="absolute inset-[1px] [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-gradient 
                          text-white font-normal text-xs md:text-base
                        "
                          >
                            KYC
                          </button>
                        </div>
                      </div>
                      <div
                        style={{}}
                        className="transition-all ease-in-out duration-300 hover:scale-105 [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] relative bg-gradient h-[40px] w-[100px] xl:w-[80px]"
                      >
                        <div className="absolute inset-[3px] bg-white [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)]">
                          <a
                            href="https://www.cyberscope.io/audits/chrle"
                            className="absolute inset-[1px] flex items-center justify-center [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-gradient 
                          text-white font-normal text-xs md:text-base
                        "
                          >
                            AUDIT
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="relative [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] h-[40px] bg-gradient transition-all ease-in-out duration-300 hover:scale-105">
                  <div className="absolute [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-white inset-[3px]">
                    <button
                      className="absolute [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-gradient inset-[1px] font-normal text-base text-white"
                      onClick={downloadWhitepaper}
                    >
                      WHITEPAPER
                    </button>
                  </div>
                </div>
                <div className="relative [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] h-[40px] bg-gradient mt-4 transition-all ease-in-out duration-300 hover:scale-105">
                  <div className="absolute [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-white inset-[3px]">
                    <button
                      className="absolute [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-gradient inset-[1px] font-normal text-base text-white"
                      onClick={redirectToMainSite}
                    >
                      MAIN SITE
                    </button>
                  </div>
                </div>
                <div className="mt-6 relative bg-[#444444] token-address h-[100px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] ">
                  <div className="absolute inset-[1px] bg-[#1C1C1C] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] flex flex-col justify-center px-1 md:px-4">
                    <div className="flex flex-col xl:flex-row items-center justify-between">
                      <a
                        href="https://basescan.org/address/0xBde71bB4593C4964dad1A685CbE9Cf6a2cDBDca7"
                        className=" text-white hover:text-[#989898] transition-all ease-in-out duration-300 uppercase text-xs"
                      >
                        Token Address
                      </a>
                      <div className="flex items-center justify-between px-1 md:px-0 gap-0 xl:gap-1">
                        <div className="gradient-text font-normal text-[8px] md:text-xs">
                          <span>
                            0xBde71bB4593C4964dad1A685CbE9Cf6a2cDBDca7
                          </span>
                        </div>
                        <CopyToClipboardButton
                          textToCopy={
                            "0xBde71bB4593C4964dad1A685CbE9Cf6a2cDBDca7"
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-col xl:flex-row items-center justify-between mt-2 xl:mt-0">
                      <a
                        href="https://basescan.org/address/0xdDc631F8197C9bb390B28a7604A2ddC65dC662FC#internaltx"
                        className=" text-white hover:text-[#989898] transition-all ease-in-out duration-300 uppercase text-xs"
                      >
                        PRESALE WALLET ADDRESS
                      </a>
                      <div className="flex items-center justify-between gap-0 xl:gap-1">
                        <div className="gradient-text font-normal text-[8px] md:text-xs">
                          <span>
                            0xdDc631F8197C9bb390B28a7604A2ddC65dC662FC
                          </span>
                        </div>
                        <CopyToClipboardButton
                          textToCopy={
                            "0xdDc631F8197C9bb390B28a7604A2ddC65dC662FC"
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="gradient-text font-semibold text-sm md:text-base">
                    Presale Details
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-normal text-sm md:text-base text-white/80">
                    Current Price:
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    {" "}
                    $0.0002
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-normal text-sm md:text-base text-white/80">
                    Next Price:
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    {" "}
                    $0.00024
                  </span>
                </div>

                <div className="flex justify-between mt-2">
                  <span className="font-normal text-sm md:text-base text-white/80">
                    Token Name:{" "}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    {" "}
                    CHARLIE
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-normal text-sm md:text-base text-white/80">
                    Token Decimals:{" "}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    {" "}
                    18
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font- text-sm md:text-base text-white/80">
                    Token Symbol:{" "}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    {" "}
                    $CHRLE
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-normal text-sm md:text-base text-white/80">
                    Supply:{" "}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    100 Billion
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-normal text-sm md:text-base text-white/80">
                    Network:{" "}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    {" "}
                    Base Network (ETH)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`relative transition-all presale-buy ease-in-out duration-300 ${
              paymenType === "TON" ? "h-[680px]" : "h-[620px]"
            } bg-gradient [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] w-full lg:w-[40%] mt-8 lg:mt-0`}
          >
            <div className="absolute [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] bg-[#1C1C1C] inset-[1px] px-4 md:px-10 py-10">
              {/* <h2 className="text-white text-center mt-4 font-semibold text-sm md:text-lg">
                {" "}
                PRESALE BEGINS IN
              </h2> */}
              <h2 className="text-white text-center mt-2 mb-2 font-semibold text-xs md:text-lg">
                NETWORK:{" "}
                <span className="gradient-text font-semibold text-xs md:text-lg">
                  BASE CHAIN ETH
                </span>
              </h2>
              {/* <CountdownTimer /> */}
              <div className="flex flex-col md:flex-row items-center justify-center mt-2">
                <div className="flex items-center">
                  <span className="text-white/80 text-sm md:text-base">
                    Min :{" "}
                  </span>
                  <span className="gradient-text ml-4 text-sm md:text-base">
                    <span className="font-semibold text-sm md:text-base">
                      1
                    </span>{" "}
                    USDT
                  </span>
                </div>
                <div className="flex items-center justify-center ml-0 md:ml-8">
                  <span className="text-white/80 font-normal text-sm md:text-base">
                    1 USD ={" "}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base ml-1">
                    <span className="font-semibold text-sm md:text-lg">
                      5000
                    </span>{" "}
                    $CHRLE
                  </span>
                </div>
              </div>
              <div className="rounded-lg w-full  mx-auto relative mt-4">
                {/* Payment Options */}
                <div className="flex justify-between h-[40px] space-x-2 sm:space-x-4  mb-4 relative cursor-pointer border-[2px] rounded-lg border-[#444444]">
                  <div
                    className="bg-transparent w-full"
                    onClick={() =>
                      setIsPaymentDropdownOpen(!paymentDropdownOpen)
                    }
                  >
                    <div className="flex justify-between items-center">
                      <button
                        className={`flex items-center sm:space-x-2 font-normal text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md `}
                      >
                        <img
                          src={`./${paymenType.toLowerCase()}.svg`}
                          alt={paymenType}
                          className="w-4 h-4 sm:w-5 sm:h-5"
                        />
                        <span className="ml-2 text-sm md:text-base">
                          {paymenType}
                        </span>
                      </button>
                      <FaAngleDown
                        className={`w-5 h-5 mr-2 text-white/80 transition-transform duration-300 ease-in-out ${
                          paymentDropdownOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </div>
                </div>
                {paymentDropdownOpen && (
                  <div className="payment-dropdown flex flex-col w-full absolute bg-[#212121] h-[165px] mt-[-14px] border-[2px] rounded-lg border-[#444444] z-20">
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        handlePaymentTypechange("ETH");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./eth.svg"
                        alt="ETH"
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <span className="text-sm md:text-base">ETH</span>
                    </button>
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        handlePaymentTypechange("USDT");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./usdt.svg"
                        alt="USDT"
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <span className="text-sm md:text-base">USDT</span>
                    </button>
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        handlePaymentTypechange("USDC");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./usdc.svg"
                        alt="USDT"
                        className=" w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <span className="text-sm md:text-base">USDC</span>
                    </button>
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        setPaymentType("CARD");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./card.svg"
                        alt="CARD"
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <span className="text-sm md:text-base">CARD</span>
                    </button>
                  </div>
                )}
                {paymenType === "TON" && (
                  <div
                    className="mb-2 [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] relative bg-custom-gradient-button 
                h-[50px] hover:scale-105 transition-all ease-in-out duration-300 z-0"
                  >
                    <div className="ton [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] absolute bg-white inset-[3px]">
                      <button
                        className="[clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] absolute bg-current inset-[1px] text-white font-semibold"
                        onClick={handleTonConnect}
                      >
                        {isTonWalletConnected
                          ? `Disconnect | ${friendlyAddress.substring(
                              0,
                              4
                            )}... | ${tonBalance} TON`
                          : "Connect TON Wallet"}
                      </button>
                    </div>
                  </div>
                )}
                {/* Input Fields */}
                <div>
                  <div className="text-white mb-2 flex justify-between">
                    <span>
                      Pay with
                      <span className="gradient-text font-normal text-base">
                        {paymenType === "ETH"
                          ? " ETH"
                          : paymenType === "USDT"
                          ? " USDT"
                          : paymenType === "USDC"
                          ? " USDC"
                          : paymenType === "CARD"
                          ? " CARD"
                          : " TON"}
                      </span>
                    </span>
                    {paymenType !== "TON" && (
                      <span
                        className="gradient-text cursor-pointer"
                        onClick={
                          paymenType === "ETH"
                            ? (e) => {
                                e.target.name = "amount";
                                e.target.value = 10000 / PER_USDT_TO_BNB;
                                handlePaymentChange(e);
                              }
                            : (e) => {
                                e.target.name = "amount";
                                e.target.value = 10000;
                                handlePaymentChange(e);
                              }
                        }
                      >
                        Max
                      </span>
                    )}
                  </div>
                  <div className="flex items-center border-[2px] border-[#444444] p-2 rounded-lg mb-4">
                    <input
                      name="amount"
                      type="number"
                      placeholder="0"
                      className="bg-transparent w-[90%] md:w-full text-white placeholder-gray-300 outline-none px-2"
                      value={amount}
                      onChange={handlePaymentChange}
                    />
                    <img
                      src={
                        paymenType === "ETH"
                          ? "./eth.svg"
                          : paymenType === "USDT"
                          ? "./usdt.svg"
                          : paymenType === "USDC"
                          ? "./usdc.svg"
                          : paymenType === "CARD"
                          ? "./usd.png"
                          : "./ton.svg"
                      }
                      alt="ETH"
                      className="w-6 h-6"
                    />
                  </div>

                  <div className="text-white mb-2">
                    <span>
                      <span className="gradient-text font-normal text-base">
                        $CHRLE
                      </span>{" "}
                      You receive
                    </span>
                  </div>
                  <div className="flex items-center border-[2px] border-[#444444] p-2 rounded-lg ">
                    <input
                      id="amount"
                      type="number"
                      name="receiveable"
                      placeholder="0"
                      value={receiveable}
                      onChange={handlePaymentChange}
                      className="bg-transparent text-white w-[90%] md:w-full placeholder-gray-300 flex-1 outline-none px-2"
                    />
                    <img src="./logo.png" alt="$CHRLE" className="w-7 h-7" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white font-normal text-base">
                  Total Amount:{" "}
                </span>
                <span className="font-semibold gradient-text text-base">
                  {receiveable}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white">Total Purchase: </span>
                <span className="font-semibold text-base gradient-text">
                  {unclaimedTokens}
                </span>
              </div>
              <div
                className={`relative h-[50px] mt-4 [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] transition-all ease-in-out duration-300 ${
                  loading || !isConnected
                    ? "bg-[#1C1C1C]"
                    : "bg-gradient hover:scale-105"
                }`}
              >
                <div
                  className={`absolute ${
                    loading || !isConnected ? "bg-[#444444]" : "bg-white"
                  } inset-[3px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]`}
                >
                  <button
                    className={`${
                      loading || !isConnected
                        ? "bg-[#1C1C1C] text-[#444444] cursor-not-allowed"
                        : "bg-gradient text-white cursor-pointer"
                    } font-normal text-base absolute inset-[1px] flex items-center justify-center [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]
                  }`}
                    onClick={loading ? () => {} : handleBuy}
                    disabled={!isConnected}
                  >
                    BUY
                    {loading ? <Spinner size={20} margin={12} /> : ""}
                  </button>
                </div>
              </div>
              <div
                className={`relative h-[50px] mt-4 [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] transition-all ease-in-out duration-300 ${
                  loading || !isConnected
                    ? "bg-[#1C1C1C]"
                    : "bg-gradient hover:scale-105"
                }`}
              >
                <div
                  className={`absolute ${
                    loading || !isConnected ? "bg-[#444444]" : "bg-white"
                  } inset-[3px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]`}
                >
                  <button
                    className={`${
                      loading || !isConnected
                        ? "bg-[#1C1C1C] text-[#444444] cursor-not-allowed"
                        : "bg-gradient text-white cursor-pointer"
                    } font-normal text-base absolute inset-[1px] flex items-center justify-center [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]
                  }`}
                    onClick={loading ? () => {} : handleClaimTokens}
                    disabled={loading || !isConnected}
                  >
                    Claim Tokens
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div id="about" className="w-[83%] mx-auto mt-14">
          <div className="flex flex-col lg:flex-row lg:gap-28 items-center justify-between">
            <div className="relative w-full about-description lg:w-[50%] h-[400px] bg-gradient [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)]">
              <div className="absolute inset-[1px] bg-[#1C1C1C] [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] p-4 md:p-10 flex flex-col items-center justify-center">
                <div>
                  <div className="text-center">
                    <span className="gradient-text font-semibold text-lg md:text-2xl">
                      NFT Collection
                    </span>
                  </div>
                  <p className="text-white/80 font-normal text-sm md:text-base mt-1">
                    Dive into Charlie's whimsical world with a limited
                    collection of 10,000 NFTs. Rarity levels add a fun dynamic
                    that makes certain NFTs highly coveted by collectors. NFTs
                    will have uses in future games, giving you a head start.
                  </p>
                </div>
                <div className="mt-5">
                  <div className="text-center">
                    <span className="gradient-text font-semibold text-lg md:text-2xl">
                      NFT Marketplace
                    </span>
                  </div>
                  <p className="text-white/80 font-normal text-sm md:text-base mt-1">
                    Trade official Charlie NFTs on our very own NFT Marketplace!
                    NFTs can be traded on all major NFT platforms like OpenSea
                    and Magic Eden.
                  </p>
                </div>
                <div className="mt-5">
                  <div className="text-center">
                    <span className="gradient-text font-semibold text-lg md:text-2xl">
                      AI Video generator
                    </span>
                  </div>
                  <p className="text-white/80 font-normal text-sm md:text-base mt-1">
                    Create your own Charlie video clips with our state of the
                    art AI video generator, specially designed in the style and
                    prompt of Charlie!
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-2 lg:gap-4 py-6 w-full lg:w-[40%]">
              <img src="nft2.png" alt="" className="w-36 md:w-60" />
              <img src="nft.png" alt="" className="absolute w-28 md:w-48" />
              <img src="nft1.png" alt="" className="w-36 md:w-60" />
            </div>
          </div>
        </div>

        <div className="w-[83%] lg:w-[50%] mx-auto mt-8">
          <div className="relative clip w-full h-[50px] bg-gradient">
            <div className="absolute clip inset-[1px] bg-[#1C1C1C] flex items-center justify-center">
              <span className="gradient-text font-semibold text-base">
                Charlie AI
              </span>
            </div>
          </div>
          <br />
          <p className="text-white text-sm md:text-base">
            Engage directly with Charlie himself through our cutting-edge
            Artificial Intelligence chatbot. Crafted to embody the essence of
            Charlie, our chatbot delivers a delightful blend of practical
            assistance and uproarious humor. AI image generator: Unleash the
            full power of your imagination with our revolutionary image
            generator, capable of bringing to life anything your mind can
            conceive.
          </p>
          <br />
          <div className="flex justify-center gap-2 md:gap-4 py-6 ">
            <img src="Pic1.png" alt="" className="w-36 md:w-60" />
          </div>
          <div className="relative clip w-full h-[50px] bg-gradient">
            <div className="absolute clip inset-[1px] bg-[#1C1C1C] flex items-center justify-center px-4 md:px-0">
              <span className="gradient-text font-semibold text-sm md:text-base">
                Stake Your Charlie Tokens once the Presale ends!
              </span>
            </div>
          </div>
          <p className="text-white text-sm md:text-base">
            <br></br>
            Unlock the full potential of your Charlie tokens through staking! A
            simple, effective, and rewarding process! By staking your Charlie
            tokens, you actively contribute to the growth of the Charlie
            ecosystem. Stake your ‘CHRLE’ tokens to earn solid APYs in ‘CHRLE’
            along with an additional governance token.
          </p>
          <div className="relative clip w-full h-[50px] bg-gradient mt-10">
            <div className="absolute clip inset-[1px] bg-[#1C1C1C] flex items-center justify-center">
              <span className="gradient-text font-semibold text-base">
                Charlie P2E
              </span>
            </div>
          </div>
          <br />
          <p className="text-white text-sm md:text-base">
            Charlie P2E: Charlie’s P2E Game allows you to earn additional tokens
            and leverage your official Charlie NFTs to maximize your token
            yield.
          </p>
          <div className="relative clip w-full h-[50px] bg-gradient mt-10">
            <div className="absolute clip inset-[1px] bg-[#1C1C1C] flex items-center justify-center">
              <span className="gradient-text font-semibold text-base">
                Charlie's Animated Series
              </span>
            </div>
          </div>
          <br />
          <p className="text-white text-sm md:text-base">
            Meet Charlie, the face and inspiration of our project and his crew
            of degenerate unicorn misfits on a mind-bending journey through a
            universe where unicorns aren't your average fantasy. Led by Charlie,
            a lovable yet degenerate unicorn set in the year 2101, on a planet
            known as Consensus-Unicorn-69420DD. Here, intelligence mixes with
            degeneracy, fueled by enchanted kush and meme chaos.
          </p>
          <div className="relative clip w-full h-[50px] bg-gradient mt-10">
            <div className="absolute clip inset-[1px] bg-[#1C1C1C] flex items-center justify-center">
              <span className="gradient-text font-semibold text-base">
                Utility and Partnerships
              </span>
            </div>
          </div>
          <br />
          <p className="text-white text-sm md:text-base">
            Exploring partnerships and collaborations with other projects, NFT
            projects, and influencers. We’re here to bring the entire
            cryptocurrency community together and we would love to create
            special NFT collaborations.
          </p>
          <br />
        </div>

        <div className="relative bg-gradient w-[83%] tokenomics h-[700px] mx-auto mt-14 [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)]">
          <div className="absolute bg-[#1C1C1C] [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] inset-[1px]">
            {/* Top Centered Image */}
            <div className="flex relative justify-center mb-20 mt-4">
              <img
                src="logo.png"
                alt="Main Image"
                className="lg:w-40 w-32 tokenomics-logo"
              />
              <h1 className="absolute mt-32 lg:mt-[190px] text-white font-normal text-md md:text-xl tokenomics-title">
                Tokenomics
              </h1>
              <p className="absolute mt-40 lg:mt-[220px] text-sm token-billion lg:text-[30px] tokenomics-subtitle bg-gradient-to-r from-custom-1 via-custom-2 to-custom-4 bg-clip-text text-transparent">
                Token: <span className="font-semibold gradient-text">100</span>{" "}
                BILLION
              </p>
            </div>
            <CircularChat />
          </div>
        </div>

        {/* RoadMap */}
        <div
          id="roadmap"
          className="relative bg-gradient w-[83%] h-[730px] mx-auto mt-14 [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)]"
        >
          <div className="absolute bg-[#1C1C1C] [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] inset-[1px]">
            <div className="flex relative justify-center mb-20 mt-10">
              <img
                src="logo.png"
                alt="Main Image"
                className="lg:w-40 w-32 roadmap-logo"
              />
              <h1 className="absolute mt-32 lg:mt-[190px] text-white font-normal text-md md:text-xl roadmap-title">
                Charlie Unicorn AI
              </h1>
              <p className="absolute roadmap-subtitle roadmap-title mt-[150px] lg:mt-44 text-lg lg:text-[30px] bg-gradient-to-r from-custom-1 via-custom-2 to-custom-4 bg-clip-text text-transparent">
                Road Map
              </p>
            </div>
            <img
              src="redleft.png"
              alt=""
              className="hidden lg:absolute w-60 -ml-0 -mt-16 z-10"
            />
            <img
              src="bluerigh.png"
              alt=""
              className="hidden lg:absolute -right-0 -mt-0 z-10 w-64"
            />
            <div className="w-full">
              <CustomCarousal slides={RoadMapSlides} />
            </div>
          </div>
        </div>
        <div className="w-[83%] mx-auto mt-14">
          <h1 className="font-semibold text-2xl text-white text-center mb-8">
            PRESALE PHASES
          </h1>
          <AccordianGroup items={AccordianGroupItems} />
        </div>
        <div className="mt-14">
          <div className="flex items-center justify-center">
            <span className="text-white font-semibold text-2xl">TEAM</span>
          </div>
          {/* Members Section */}
          <div className="flex flex-col md:flex-row gap-10 items-center w-[83%] justify-between mx-auto mt-8">
            {members.map((member, index) => (
              <div
                key={index}
                className="relative member w-[360px] clip bg-gradient h-[360px]"
              >
                <div className="absolute clip bg-[#1C1C1C] inset-[1px] flex flex-col items-center justify-center">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-[200px] h-[200px] rounded-full object-cover object-[70%_20%] mb-4"
                  />
                  <h3 className="text-white font-normal text-base">
                    {member.name}
                  </h3>
                  <p className="gradient-text font-normal text-base">
                    {member.role}
                  </p>
                  <div className="flex items-center justify-center mt-2">
                    {member.linkedin && (
                      <Link to={member.linkedin}>
                        <img src="linkedin.svg" className="w-5 h-5" />
                      </Link>
                    )}
                    <img
                      src={member.flag}
                      alt={member.name}
                      className={`w-8 h-4 ${member.linkedin && "ml-4"}`}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="relative bg-gradient h-[360px] member w-[80%] clip">
              <div className="absolute clip bg-[#1C1C1C] inset-[1px] flex flex-col items-center justify-center p-8 z-50">
                <h1 className="gradient-text font-semibold text-md mb-4">
                  Our Developers
                </h1>
                {developers.map((dev, index) => (
                  <div
                    className={`relative bg-gradient [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] h-[50px] w-full ${
                      index > 0 && "mt-4"
                    }`}
                    key={index}
                  >
                    <div className="absolute bg-[#1C1C1C] opacity-90 [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] inset-[1px] flex items-center justify-center">
                      <h1 className="gradient-text font-semibold text-sm lg:text-lg">
                        {dev.name}
                      </h1>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative w-[83%] bg-[#444444] footer-bar mx-auto h-[70px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] mt-20">
        <div className="absolute inset-[1px] bg-[#1C1C1C] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] px-4 flex flex-col md:flex-row justify-center gap-2 items-center md:justify-between">
          <div className="flex flex-row gap-8 items-center">
            <a
              href="https://t.me/+oNLtgu5xw51kMzRh"
              target="_blank"
              rel="noreferrer"
            >
              <img src="./telegram.png" alt="" className="icon" />
            </a>
            <a
              href="https://www.youtube.com/@CharlieUnicoin"
              target="_blank"
              rel="noreferrer"
            >
              <img src="./youtube.png" alt="" className="icon" />
            </a>
            <a
              href="https://x.com/Charlie_Unicoin"
              target="_blank"
              rel="noreferrer"
            >
              <img src="./twitter.png" alt="" className="icon" />
            </a>
            <a
              href="https://discord.com/invite/charlietheUnicoin"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="./discord1.png"
                alt=""
                className="icon"
                style={{ width: 35, height: "auto" }}
              />
            </a>
          </div>
          <a href="#home">
            <div className="relative h-[45px] bg-gradient w-[200px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] transition-all ease-in-out duration-300 hover:scale-105">
              <div className="absolute inset-[3px] bg-white [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]">
                <button className="absolute inset-[1px] flex items-center justify-center bg-gradient text-white font-normal text-base [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]">
                  Buy CHARLIE
                </button>
              </div>
            </div>
          </a>
        </div>
      </div>
    </>
  );
};

export default MainPage;
