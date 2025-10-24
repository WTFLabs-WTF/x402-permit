# x402-axios Example Client

This is an example client that demonstrates how to use the `x402-axios` package to make HTTP requests to endpoints protected by the x402 payment protocol.

## Features

The x402-axios package supports three authorization types:

1. **EIP-3009 (Default)** - `transferWithAuthorization` for USDC and compatible tokens
2. **EIP-2612 Permit** - Standard ERC20 `permit()` function for tokens like DAI, WETH
3. **Permit2** - Uniswap's universal token approvals (works with ANY ERC20)

## Prerequisites

- Node.js v20+ (install via [nvm](https://github.com/nvm-sh/nvm))
- pnpm v10 (install via [pnpm.io/installation](https://pnpm.io/installation))
- A running x402 server (you can use the example express server at `examples/typescript/servers/express`)
- A valid Ethereum private key for making payments
- Tokens with sufficient balance on Base Sepolia (get from [CDP Faucet](https://portal.cdp.coinbase.com/products/faucet))

## Setup

1. Install and build all packages from the typescript examples root:
```bash
cd ../../
pnpm install
pnpm build
cd clients/axios
```

2. Copy `.env-local` to `.env` and configure:
```bash
cp .env-local .env
# Edit .env and set:
# - PRIVATE_KEY: Your Ethereum private key
# - RESOURCE_SERVER_URL: e.g., http://localhost:3000
# - ENDPOINT_PATH: e.g., /weather
```

## Running Examples

### 1. EIP-3009 (Default - USDC)

```bash
pnpm dev
# or
tsx index.ts
```

This uses the default EIP-3009 authorization with USDC's `transferWithAuthorization`.

### 2. EIP-2612 Permit

```bash
tsx index-permit.ts
```

This uses EIP-2612 Permit for tokens that support the `permit()` function (DAI, WETH, etc.).

**Requirements:**
- Token must implement EIP-2612 (has `permit()` function)
- Token must implement `nonces()` for replay protection

### 3. Permit2 (Universal)

```bash
tsx index-permit2.ts
```

This uses Uniswap's Permit2 contract for universal token approvals.

**Requirements:**
- One-time approval of Permit2 contract for each token

**To approve Permit2:**

```bash
# Using cast (Foundry)
cast send <TOKEN_ADDRESS> \
  "approve(address,uint256)" \
  0x000000000022D473030F116dDEE9F6B43aC78BA3 \
  $(cast max-uint256) \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL
```

Or use the facilitator's approve endpoint (if available).

## How It Works

The examples demonstrate how to:
1. Create a wallet client using the x402 `createSigner` helper
2. Create an Axios instance with x402 payment handling
3. Specify the authorization type (optional, defaults to EIP-3009)
4. Make requests to paid endpoints
5. Decode and display payment responses

## Example Code

### Basic Usage (EIP-3009)

```typescript
import axios from "axios";
import { withPaymentInterceptor, createSigner } from "x402-axios";

const signer = await createSigner("base-sepolia", process.env.PRIVATE_KEY);

// Default: uses EIP-3009 (transferWithAuthorization)
const api = withPaymentInterceptor(
  axios.create({ baseURL: process.env.RESOURCE_SERVER_URL }),
  signer
);

const response = await api.get("/weather");
console.log(response.data);
```

### With EIP-2612 Permit

```typescript
import axios from "axios";
import { withPaymentInterceptor, createSigner } from "x402-axios";

const signer = await createSigner("base-sepolia", process.env.PRIVATE_KEY);

// Use EIP-2612 Permit
const api = withPaymentInterceptor(
  axios.create({ baseURL: process.env.RESOURCE_SERVER_URL }),
  signer,
  undefined,
  { authorizationType: "permit" }
);

const response = await api.get("/weather");
console.log(response.data);
```

### With Permit2

```typescript
import axios from "axios";
import { withPaymentInterceptor, createSigner, PERMIT2_ADDRESS } from "x402-axios";

const signer = await createSigner("base-sepolia", process.env.PRIVATE_KEY);

// Use Permit2 (requires one-time token approval)
const api = withPaymentInterceptor(
  axios.create({ baseURL: process.env.RESOURCE_SERVER_URL }),
  signer,
  undefined,
  { authorizationType: "permit2" }
);

console.log(`Permit2 Address: ${PERMIT2_ADDRESS}`);
const response = await api.get("/weather");
console.log(response.data);
```

## Comparison of Authorization Types

| Feature | EIP-3009 | EIP-2612 Permit | Permit2 |
|---------|----------|-----------------|---------|
| Token Support | USDC, compatible tokens | Tokens with `permit()` | ANY ERC20 |
| Setup Required | None | None | One-time approval per token |
| Gas Cost | Medium | Low (off-chain) | Low (off-chain) |
| Security | High | High | High |
| Use Case | USDC payments | Standard ERC20 | Universal solution |

## Troubleshooting

### "Insufficient funds" error
- Ensure your wallet has sufficient token balance on Base Sepolia
- Get tokens from [CDP Faucet](https://portal.cdp.coinbase.com/products/faucet)

### "Token does not support permit" (EIP-2612)
- The token must implement EIP-2612 `permit()` function
- Try using EIP-3009 or Permit2 instead

### "Allowance" error (Permit2)
- You need to approve the Permit2 contract first
- See "To approve Permit2" section above
- Permit2 Address: `0x000000000022D473030F116dDEE9F6B43aC78BA3`
