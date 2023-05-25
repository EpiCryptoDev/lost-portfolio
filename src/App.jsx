import React, { useState } from 'react';
import "./App.css"

const WETHAddress = '0xA1077a294dDE1B09bB078844df40758a5D0f9a27'; // WPLS contract address
const USDTAddress = '0x0Cb6F5a34ad42ec934882A05265A7d5F59b51A2f'; // USDT contract address


const App = () => {
  const [address, setAddress] = useState('');
  const [tokens, setTokens] = useState([]);

  const fetchTokenData = async () => {
    try {
      const response = await fetch(
         `https://scan.pulsechain.com/api?module=account&action=tokenlist&address=${address}`
      );
      const data = await response.json();
      const tokenList = data.result;

      const tokenPromises = tokenList.map(async (token) => {
        const tokenContractAddress = token.contractAddress;
        const response = await fetch(
           `https://scan.pulsechain.com/api?module=account&action=tokenbalance&contractaddress=${tokenContractAddress}&address=${address}&tag=latest`
        );
        const balanceData = await response.json();
        const balance = balanceData.result / Math.pow(10, token.tokenDecimal);

        // Fetch token name
        const tokenName = await fetchTokenName(tokenContractAddress);

        // Fetch price in USDT
        const tokenPrice = await fetchTokenPrice(tokenContractAddress);

        return {
          tokenSymbol: token.tokenSymbol,
          tokenName,
          balance,
          priceInUSDT: balance * tokenPrice,
        };
      });

      const tokenData = await Promise.all(tokenPromises);
      setTokens(tokenData);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTokenName = async (tokenContractAddress) => {
    try {
      const response = await fetch(
        `https://scan.pulsechain.com/api?module=token&action=tokeninfo&contractaddress=${tokenContractAddress}`
      );
      const data = await response.json();
      const tokenName = data.result.name;
      return tokenName;
    } catch (error) {
      console.error(error);
      return '';
    }
  };

  const fetchTokenPrice = async (tokenContractAddress) => {
    try {
      // Fetch WETH price in USDT
      const wethPrice = await fetchTokenToTokenPrice(WETHAddress, USDTAddress);

      // Fetch token price in WETH
      const tokenPrice = await fetchTokenToTokenPrice(tokenContractAddress, WETHAddress);

      return tokenPrice * wethPrice;
    } catch (error) {
      console.error(error);
      return 0;
    }
  };

  const fetchTokenToTokenPrice = async (tokenAddress1, tokenAddress2) => {
    try {
      const response = await fetch(
         `https://scan.pulsechain.com/api?module=stats&action=tokensupply&contractaddress=${tokenAddress1}`
      );
      const data = await response.json();
      const tokenSupply1 = data.result;

      const response2 = await fetch(
        `https://scan.pulsechain.com/api?module=stats&action=tokensupply&contractaddress=${tokenAddress2}`
      );
      const data2 = await response2.json();
      const tokenSupply2 = data2.result;

      return tokenSupply2 / tokenSupply1;
    } catch (error) {
      console.error(error);
      return 0;
    }
  };

  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchTokenData();
  };

  return (
    <div className="container">
      <h1>Token Balances</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={address}
          onChange={handleAddressChange}
          placeholder="Enter wallet address"
          className="input-field"
        />
        <button type="submit" className="submit-button">
          Fetch Tokens
        </button>
      </form>
      {tokens.length > 0 ? (
        <ul className="token-list">
          {tokens.map((token, index) => (
            <li key={index} className="token-item">
              <div className="token-info">
                <span className="token-symbol">{token.tokenSymbol}</span>
                <span className="token-name">({token.tokenName})</span>
              </div>
              <div className="token-details">
                <div className="balance">
                  <span className="balance-label">Balance:</span> {token.balance}
                </div>
                <div className="price">
                  <span className="price-label">Price in USDT:</span> {token.priceInUSDT}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-tokens">No tokens found</p>
      )}
    </div>
  );
};

export default App;
