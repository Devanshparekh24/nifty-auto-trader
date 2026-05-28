import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';

dotenv.config();

// Base32 decode function
function decodeBase32(base32) {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let hex = "";

  for (let i = 0; i < base32.length; i++) {
    const val = base32Chars.indexOf(base32.toUpperCase().charAt(i));
    if (val === -1) continue; // Skip padding or invalid characters
    bits += val.toString(2).padStart(5, '0');
  }

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const chunk = bits.substring(i, i + 8);
    hex += parseInt(chunk, 2).toString(16).padStart(2, '0');
  }
  return Buffer.from(hex, 'hex');
}

// TOTP generator
function generateTOTP(secretBase32) {
  const key = decodeBase32(secretBase32);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter), 0);
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;
  return code.toString().padStart(6, '0');
}

async function run() {
  const clientcode = process.env.ANGEL_CLIENT_ID;
  const password = process.env.ANGEL_PASSWORD;
  const totpSecret = process.env.ANGEL_TOTP;
  const apiKey = process.env.ANGEL_API_KEY;

  console.log('🔄 Loading credentials from .env...');
  console.log(`- Client Code: ${clientcode}`);
  console.log(`- Password (PIN): ${password}`);
  console.log(`- TOTP Secret: ${totpSecret ? '******** (Loaded)' : 'NOT LOADED'}`);
  console.log(`- API Key: ${apiKey ? '******** (Loaded)' : 'NOT LOADED'}`);

  if (!clientcode || !password || !totpSecret || !apiKey) {
    console.error('❌ Error: Missing credentials in .env file!');
    return;
  }

  let totpCode = '000000';
  if (/^\d{6}$/.test(totpSecret.trim())) {
    totpCode = totpSecret.trim();
    console.log('🔑 Using manually provided 6-digit TOTP.');
  } else {
    totpCode = generateTOTP(totpSecret.trim());
    console.log(`🔑 Generated dynamic TOTP: ${totpCode}`);
  }

  const loginData = {
    clientcode: clientcode,
    password: password,
    totp: totpCode,
    state: "STATE_VARIABLE"
  };

  try {
    console.log('\n🔗 Authenticating with Angel One...');
    const loginResponse = await axios.post(
      'https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword',
      loginData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '127.0.0.1',
          'X-ClientPublicIP': '127.0.0.1',
          'X-MACAddress': '00:00:00:00:00:00',
          'X-PrivateKey': apiKey
        }
      }
    );

    const { data } = loginResponse;
    if (!data.status || !data.data) {
      console.error('❌ Login failed:', data.message || 'Unknown response structure');
      return;
    }

    const jwtToken = data.data.jwtToken;
    console.log('✅ Authenticated successfully! Fetching RMS funds...');

    const balanceResponse = await axios.get(
      'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS',
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-PrivateKey': apiKey,
          'X-ClientId': clientcode,
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '127.0.0.1',
          'X-ClientPublicIP': '127.0.0.1',
          'X-MACAddress': '00:00:00:00:00:00'
        }
      }
    );

    if (balanceResponse.data?.status && balanceResponse.data?.data) {
      const balance = balanceResponse.data.data;
      console.log('\n======================================');
      console.log('💰 LIVE ANGEL ONE TRADING BALANCE');
      console.log('======================================');
      console.log(`Available Cash:  ₹${parseFloat(balance.availablecash || 0).toFixed(2)}`);
      console.log(`Net Margin:      ₹${parseFloat(balance.net || 0).toFixed(2)}`);
      console.log(`Utilised Margin: ₹${parseFloat(balance.utilisedmargin || 0).toFixed(2)}`);
      console.log(`Blocked Margin:  ₹${parseFloat(balance.blockedmargin || 0).toFixed(2)}`);
      console.log('======================================\n');
    } else {
      console.error('❌ Failed to fetch balance metrics:', balanceResponse.data);
    }
  } catch (error) {
    console.error('\n❌ Execution Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

run();
