import * as NanoCurrency from "nanocurrency";
import { load } from "https://deno.land/std@0.209.0/dotenv/mod.ts";
const env = await load();
const seed = env["SEED"];
// View other options of Public Nano Nodes: https://publicnodes.somenano.com
const RPC_SERVER = "https://nanoslo.0x.no/proxy";
// const converted = NanoCurrency.convert("1", {
//   from: "nano" as NanoCurrency.Unit,
//   to: "knano" as NanoCurrency.Unit,
// });
const WORK_SERVER = "https://proxy.nanos.cc/proxy";
const REQUEST_TIMEOUT = 10 * 1000; // 10 seconds
const WORK_LOCAL = false; // If false, work is requested from Nano Node
const DEFAULT_REPRESENTATIVE =
  "nano_1center16ci77qw5w69ww8sy4i4bfmgfhr81ydzpurm91cauj11jn6y3uc5y"; //NanoCenter
function string_add(n1, n2, pad = 0) {
  return (BigInt(n1) + BigInt(n2)).toString().padStart(pad, "0");
}

const queryNanoNode = async (input) => {
  const response = await fetch(RPC_SERVER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return response.json();
};

export const nanoBalance = async (address) => {
  const input = {
    action: "account_balance",
    account: address,
  };
  // const converted = NanoCurrency.convert("1", {
  //   from: "nano" as NanoCurrency.Unit,
  //   to: "knano" as NanoCurrency.Unit,
  // });
  // console.log(converted);

  const account = create_nano_account(seed, 0);
  receive_all_receivable(account.address, account.public, account.secret);
  // const account = create_nano_account(seed, 0);
  // console.log("Seed", seed);
  // console.log("Address", account.address);

  return queryNanoNode(input);
};

export const nanoHash = async (hash) => {
  const input = {
    action: "block_info",
    json_block: true,
    hash: hash,
  };
  return queryNanoNode(input);
};

const nanoReceivable = (address, count = undefined, threshold = undefined) => {
  const input = {
    action: "receivable",
    account: address,
    count: count,
    threshold: threshold,
  };
  return queryNanoNode(input);
};

function create_nano_account(seed, index) {
  const secretKey = NanoCurrency.deriveSecretKey(seed, index);
  const publicKey = NanoCurrency.derivePublicKey(secretKey);
  const address = NanoCurrency.deriveAddress(publicKey).replace(
    "xrb_",
    "nano_",
  );

  return {
    secret: secretKey,
    public: publicKey,
    address: address,
  };
}

function active_difficulty() {
  const input = {
    action: "active_difficulty",
  };
  return queryNanoNode(input);
}

//
async function work_helper(hash, subtype, verbose = true) {
  let response = await active_difficulty();
  let work_threshold = response.network_current;
  if (subtype == "receive") {
    work_threshold = response.network_receive_current;
  }

  if (verbose) {
    console.log(
      'Computing work for subtype "' + subtype + '", difficulty: ' +
        work_threshold + " (work being done locally: " + WORK_LOCAL + ")",
    );
  }
  let work = undefined;
  if (WORK_LOCAL) {
    work = await NanoCurrency.computeWork(hash, {
      workThreshold: work_threshold,
    });
  } else {
    work = (await work_generate(hash, work_threshold)).work;
  }

  return work;
}

function work_generate(hash, difficulty = undefined, multiplier = undefined) {
  const input = {
    action: "work_generate",
    hash: hash,
    difficulty: difficulty,
    multiplier: multiplier,
  };
  return queryNanoNode(input);
}

function process(block, subtype) {
  const input = {
    action: "process",
    json_block: true,
    subtype: subtype,
    block: block,
  };
  return queryNanoNode(input);
}

function block_info(hash) {
  const input = {
    action: "block_info",
    json_block: true,
    hash: hash,
  };
  return queryNanoNode(input);
}

function account_info(address, representative = true) {
  const input = {
    action: "account_info",
    representative: representative,
    account: address,
  };
  return queryNanoNode(input);
}

function receive_block(address, publicKey, secretKey, hash) {
  return new Promise(async (resolve, reject) => {
    console.log("Receiving in address " + address + " from block " + hash);
    let link = hash;
    let info = {
      block: await block_info(link),
      account: await account_info(address),
    };

    let subtype = "receive";
    let representative = info.account.representative;
    let previous = info.account.frontier;
    let old_balance = info.account.balance;
    let work_input = info.account.frontier;
    let work = await work_helper(work_input, subtype, true) as string;

    // If this is the first block in the account (Open), it has some specific requirements
    if (old_balance === undefined) {
      // Receive (Open) Block -- https://docs.nano.org/integration-guides/key-management/#first-receive-transaction
      old_balance = "0";
      previous = "0".padStart(64, "0");
      representative = DEFAULT_REPRESENTATIVE;
      work_input = publicKey; // https://docs.nano.org/integration-guides/work-generation/#work-calculation-details
    }

    // Calculate the new balance of the account
    let new_balance = string_add(old_balance, info.block.amount);

    // Create receive block
    let block = NanoCurrency.createBlock(secretKey, {
      work: work,
      previous: previous,
      representative: representative,
      balance: new_balance,
      link: link,
    });

    console.log("Processing block with block:");
    console.log(block);
    const response = await process(block.block, subtype);
    resolve(response);
    return;
  });
}

async function receive_all_receivable(address, publicKey, secretKey) {
  // First request the hashes of all receivable Nano Blocks
  let response = await nanoReceivable(address);
  let blocks_receivable = response.blocks;
  console.log("RESPONSE", response.blocks);

  // Iterate over receivable blocks and receive one at a time
  console.log("Found " + blocks_receivable.length + " blocks receivable...");
  console.log(blocks_receivable);
}
