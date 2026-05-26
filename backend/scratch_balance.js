import axios from 'axios';

async function fetchLiveBalance() {
  const apiKey = '7rZ6hree';
  const clientId = 'D383705';
  const password = '#Devanshparekh8;';
  const totpCode = '222003';

  try {
    console.log('🔄 Attempting live authentication with Angel One...');
    const loginResponse = await axios.post(
      'https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword',
      {
        clientcode: clientId,
        password: password,
        totp: totpCode,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-PrivateKey': apiKey,
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '127.0.0.1',
          'X-ClientPublicIP': '127.0.0.1',
          'X-MACAddress': '00:00:00:00:00:00'
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
          'X-ClientId': clientId,
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
    console.error('❌ Error executing request:', error.response?.data || error.message);
  }
}

fetchLiveBalance();
