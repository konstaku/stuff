import uniPoolListOptimism from './data/weth_pools_uni_v3_optimism.json' assert { type: 'json' };
import uniPoolListArbitrum from './data/weth_pools_uni_v3_arbitrum.json' assert { type: 'json' };

const poolList = [];

let poolFetchDone = false;

// Populating an array of pools from a certain blockchain
for (const entry of uniPoolListArbitrum.data.liquidityPools) {
  poolList.push({
    pair: `${entry.inputTokens[0].name}/${entry.inputTokens[1].name}`,
    address: entry.id,
    fee: entry.fees[2].feePercentage,
  });
}

// The query limit is max of 30 pools at once, so the function forms batches 
// of 30 addresses (or a remaining amount of addresses), and calls the loadBatch 
// function with the current batch until all pools are called.
async function fetchHotPools(pools) {
  const poolData = [];

  let urlBatch = [];
  let i = 0;

  while (i < 31 /* pools.length*/) {
    urlBatch.push(pools[i]);
    i++;

    if (urlBatch.length == 30) {
      await loadBatch(urlBatch, poolData);
      urlBatch = [];
    }

    if (i == pools.length - 1) {
      await loadBatch(urlBatch, poolData)
      urlBatch = null;
      break;
    }
  }
  
  console.log('*** Pool data before returning from fetchhotpools: ***', poolData);
  return poolData;
}

async function loadBatch(data, base) {
  const urls = data.map(el => fetch(`https://api.dexscreener.com/latest/dex/pairs/arbitrum/${el.address}`));

  await Promise.all(urls)
    .then(responses => Promise.all(responses.map(el => el.json())))
    .then(results => {
      for (const result of results) {
        if (result.pair) {
          base.push({
            pair: result.pair,
            liquidity: result.pair.liquidity,
          });
        }
      }
    })
    // .then(data => data.sort((a, b) => b.pair.fdv - a.pair.fdv))
    .catch(e => console.log('Error:', e));

    return base;

  // Promise.all(
  //   data.map(el => {
  //     fetch(`https://api.dexscreener.com/latest/dex/pairs/arbitrum/${el.address}`)
  //       .then(resp => resp.json())
  //       .then(result => { 
  //         try {
  //           if (result.pair && result.pair.liquidity.usd > 1000) {
  //             poolData.push({
  //               pair: `${result.pair.baseToken.symbol}/${result.pair.quoteToken.symbol}`,
  //               tvl: result.pair.liquidity.usd,
  //               volume: result.pair.volume.h24,
  //               priceChange24: result.pair.priceChange.h24,
  //               vitality: Math.round(100 * (result.pair.volume.h24 / result.pair.liquidity.usd)) / 100 * el.fee,
  //               address: el.address,
  //             });
  //           }
  //         } catch(error) {
  //           console.log(error);
  //         }
  //       })
  //       // Important to do sorting inside the async function, otherwise it doesn't work
  //       .then(() => {
  //         poolData.sort((a, b) => b.vitality - a.vitality);
  //       });
  //     }
  //   )
  // )
}

// fetchHotPools(poolList)
//   .then(results => {
//     console.log('Results:', results);

//     results.forEach(result => { 
//       console.log(result); 
//     });
//   });

(async () => {
  const results = await fetchHotPools(poolList);
  console.log('Results:', results);

  for (const result of results) {
    console.log(result);
  }
})();
