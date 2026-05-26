const axios = require('axios');
const crypto = require('crypto');

class AngelBroking {
  constructor(config) {
    this.apiKey = config.broker.apiKey;
    this.clientId = config.broker.clientId;
    this.password = config.broker.password;
    this.baseUrl = config.broker.baseUrl;
    this.accessToken = null;
    this.refreshToken = null;
  }

  /**
   * Login to Angel Broking
   */
  async login() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rest/auth/login`,
        {
          clientId: this.clientId,
          password: this.password,
        }
      );

      const { data } = response;
      this.accessToken = data.jwtToken;
      this.refreshToken = data.refreshToken;
      
      console.log('✅ Angel Broking Login Successful');
      return true;
    } catch (error) {
      console.error('❌ Login Failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get Options Chain for NIFTY 50
   */
  async getOptionsChain(symbol = 'NIFTY50', expiryDate) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rest/client/getoptionchain`,
        {
          symbol: symbol,
          expiryDate: expiryDate, // Format: DD-MMM-YYYY
          strikePrice: '0', // Get all strikes
          optionType: 'ALL',
        },
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.optionChain || [];
    } catch (error) {
      console.error('❌ Get Options Chain Error:', error.message);
      return [];
    }
  }

  /**
   * Get Live Quote for Options
   */
  async getLiveQuote(tokens) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rest/client/quote`,
        {
          mode: 'LTP', // LTP, QUOTE, OHLC
          exchangeTokens: tokens, // Array of token IDs
        },
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.fetched || [];
    } catch (error) {
      console.error('❌ Get Quote Error:', error.message);
      return [];
    }
  }

  /**
   * Place Order
   */
  async placeOrder(orderConfig) {
    try {
      const {
        symbol,
        side, // BUY or SELL
        quantity,
        price,
        orderType, // REGULAR, LIMIT, MARKET, STOPLOSS
        productType, // MIS (intraday), CNC (delivery)
        stopPrice,
      } = orderConfig;

      const response = await axios.post(
        `${this.baseUrl}/rest/client/placeorder`,
        {
          clientId: this.clientId,
          orderType: orderType || 'LIMIT',
          tradingSymbol: symbol,
          symbolToken: symbol,
          transactionType: side,
          quantity: quantity.toString(),
          price: price ? price.toString() : '0',
          productType: productType || 'MIS',
          pricetype: orderType || 'LIMIT',
          stopPrice: stopPrice ? stopPrice.toString() : '0',
          triggerPrice: stopPrice ? stopPrice.toString() : '0',
        },
        {
          headers: this.getHeaders(),
        }
      );

      const orderId = response.data.orderId;
      console.log(`✅ Order Placed: ${orderId}`);
      return {
        success: true,
        orderId: orderId,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Place Order Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel Order
   */
  async cancelOrder(orderId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rest/client/cancelorder`,
        {
          clientId: this.clientId,
          orderId: orderId,
        },
        {
          headers: this.getHeaders(),
        }
      );

      console.log(`✅ Order Cancelled: ${orderId}`);
      return true;
    } catch (error) {
      console.error('❌ Cancel Order Error:', error.message);
      return false;
    }
  }

  /**
   * Get Order Status
   */
  async getOrderStatus(orderId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rest/client/orderbook`,
        {
          clientId: this.clientId,
        },
        {
          headers: this.getHeaders(),
        }
      );

      const order = response.data.orderBook.find(o => o.orderId === orderId);
      return order || null;
    } catch (error) {
      console.error('❌ Get Order Status Error:', error.message);
      return null;
    }
  }

  /**
   * Get Holdings
   */
  async getHoldings() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rest/client/holding`,
        {
          clientId: this.clientId,
        },
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.holding || [];
    } catch (error) {
      console.error('❌ Get Holdings Error:', error.message);
      return [];
    }
  }

  /**
   * Get Portfolio
   */
  async getPortfolio() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rest/client/portfolio`,
        {
          clientId: this.clientId,
        },
        {
          headers: this.getHeaders(),
        }
      );

      return response.data || { portfolio: [] };
    } catch (error) {
      console.error('❌ Get Portfolio Error:', error.message);
      return { portfolio: [] };
    }
  }

  /**
   * Get Account Balance
   */
  async getBalance() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rest/client/getprofile`,
        {
          clientId: this.clientId,
        },
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.profile || {};
    } catch (error) {
      console.error('❌ Get Balance Error:', error.message);
      return {};
    }
  }

  /**
   * Get Headers with Auth Token
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'X-ClientId': this.clientId,
      'X-ApiKey': this.apiKey,
    };
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await axios.post(
        `${this.baseUrl}/rest/auth/logout`,
        { clientId: this.clientId },
        { headers: this.getHeaders() }
      );
      console.log('✅ Logged out successfully');
      return true;
    } catch (error) {
      console.error('❌ Logout Error:', error.message);
      return false;
    }
  }
}

module.exports = AngelBroking;
