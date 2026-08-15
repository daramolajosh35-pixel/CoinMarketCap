const { Bot } = require('grammy');
const axios = require('axios');

// Initialize Bot with Telegram Token
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// Standardize Coin Symbol Mapping
const COIN_MAP = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  bnb: 'binancecoin',
  xrp: 'ripple',
  ada: 'cardano',
  doge: 'dogecoin',
  ton: 'the-open-network',
  trx: 'tron',
  dot: 'polkadot'
};

// Helper: Format Big Numbers
function formatUSD(num) {
  if (!num || isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: num < 1 ? 4 : 2
  }).format(num);
}

// Command: /start
bot.command('start', (ctx) => {
  ctx.reply(
    `📈 *Welcome to CoinMarketCap0 Bot!*\n\n` +
    `I track real-time crypto prices, market caps, FDV, and 24h volume.\n\n` +
    `*Commands:*\n` +
    `• \`/p <coin>\` - Get details for a token (e.g., \`/p btc\`, \`/p ethereum\`)\n` +
    `• \`/global\` - Get total market cap & global market data`,
    { parse_mode: 'Markdown' }
  );
});

// Command: /p <token>
bot.command('p', async (ctx) => {
  const input = ctx.match.trim().toLowerCase();
  
  if (!input) {
    return ctx.reply('⚠️ Please provide a token symbol or name. Example: `/p btc` or `/p solana`', { parse_mode: 'Markdown' });
  }

  const coinId = COIN_MAP[input] || input;

  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        community_data: false,
        developer_data: false
      }
    });

    const data = response.data;
    const market = data.market_data;

    const price = formatUSD(market.current_price.usd);
    const mcap = formatUSD(market.market_cap.usd);
    const fdv = formatUSD(market.fully_diluted_valuation.usd);
    const volume = formatUSD(market.total_volume.usd);
    const change24h = market.price_change_percentage_24h ? market.price_change_percentage_24h.toFixed(2) : '0.00';
    const changeEmoji = change24h >= 0 ? '🟢' : '🔴';

    const message = 
      `📊 *${data.name} (${data.symbol.toUpperCase()})*\n\n` +
      `💵 *Price:* \`${price}\` (${changeEmoji} ${change24h}%)\n` +
      `🧢 *Market Cap:* \`${mcap}\`\n` +
      `💎 *FDV:* \`${fdv}\`\n` +
      `🔄 *24h Volume:* \`${volume}\`\n\n` +
      `🌐 _Source: Real-time Market Index_`;

    await ctx.reply(message, { parse_mode: 'Markdown' });

  } catch (error) {
    if (error.response && error.response.status === 404) {
      ctx.reply(`❌ Token *"${input}"* not found. Try searching full name (e.g. \`/p bitcoin\`).`, { parse_mode: 'Markdown' });
    } else {
      ctx.reply('⚠️ Unable to fetch market data right now. Try again shortly.');
    }
  }
});

// Command: /global
bot.command('global', async (ctx) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/global');
    const data = response.data.data;

    const totalMcap = formatUSD(data.total_market_cap.usd);
    const totalVol = formatUSD(data.total_volume.usd);
    const btcDom = data.market_cap_percentage.btc.toFixed(1);
    const ethDom = data.market_cap_percentage.eth.toFixed(1);

    const message = 
      `🌐 *Global Crypto Market Metrics*\n\n` +
      `💰 *Total Market Cap:* \`${totalMcap}\`\n` +
      `📊 *24h Global Volume:* \`${totalVol}\`\n` +
      `🪙 *BTC Dominance:* \`${btcDom}%\`\n` +
      `🔷 *ETH Dominance:* \`${ethDom}%\``;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply('⚠️ Failed to load global stats.');
  }
});

// Launch Bot
bot.start();
console.log('Bot CoinMarketCap0 is online...');
