import uniPoolListOptimism from './weth_pools_uni_v3_optimism.json' assert { type: 'json' };
import uniPoolListArbitrum from './weth_pools_uni_v3_arbitrum.json' assert { type: 'json' };


const OPWETH = '0x4200000000000000000000000000000000000006';
const ARBWETH = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
const CRYPTOCOMPARE_API_KEY = 'efe86f2987b2a724e744667f579ca39e258601ffbdf6c1adf904179c19ceb811';

const poolList = [];
let poolData = [];

for (const entry of uniPoolListArbitrum.data.liquidityPools) {
  poolList.push({
    pair: `${entry.inputTokens[0].name}/${entry.inputTokens[1].name}`,
    address: entry.id,
    fee: entry.fees[2].feePercentage,
  });
}

async function fetchHotPools(pools) {
  // Limit is 30 queries per fetch

  let urlBatch = [];
  let i = 0;

  while (i < pools.length) {
    urlBatch.push(pools[i]);
    i++;

    if (urlBatch.length == 30) {
      await loadBatch(urlBatch);
      urlBatch = [];
    }

    if (i == pools.length - 1) {
      await loadBatch(urlBatch);
      urlBatch = null;
      break;
    }

  }    
}

async function loadBatch(data) {
  await Promise.all(
    data.map(el => {
      fetch(`https://api.dexscreener.com/latest/dex/pairs/arbitrum/${el.address}`)
        .then(resp => resp.json())
        .then(result => { 
          if (result.pair && result.pair.liquidity.usd > 1000) {
            poolData.push({
              pair: `${result.pair.baseToken.symbol}/${result.pair.quoteToken.symbol}`,
              tvl: result.pair.liquidity.usd,
              volume: result.pair.volume.h24,
              priceChange24: result.pair.priceChange.h24,
              vitality: Math.round(100 * (result.pair.volume.h24 / result.pair.liquidity.usd)) / 100 * el.fee,
              address: el.address,
            });
          }
        })
        // Important to do sorting inside the async function, otherwise it doesn't work
        .then(() => poolData.sort((a, b) => b.vitality - a.vitality));
      }
    )
  );
}

fetchHotPools(poolList)
  .then(() => {console.dir(poolData)});
