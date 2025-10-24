# x402-axios

A utility package that extends Axios to automatically handle 402 Payment Required responses using the x402 payment protocol. This package enables seamless integration of payment functionality into your applications when making HTTP requests with Axios.

## Installation

```bash
npm install x402-axios
```

## Quick Start

```typescript
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { withPaymentInterceptor } from "x402-axios";
import axios from "axios";
import { baseSepolia } from "viem/chains";

// Create a wallet client
const account = privateKeyToAccount("0xYourPrivateKey");
const client = createWalletClient({
  account,
  transport: http(),
  chain: baseSepolia,
});

// Create an Axios instance with payment handling
const api = withPaymentInterceptor(
  axios.create({
    baseURL: "https://api.example.com",
  }),
  client
);

// Make a request that may require payment
const response = await api.get("/paid-endpoint");
console.log(response.data);
```

## Features

- Automatic handling of 402 Payment Required responses
- Automatic retry of requests with payment headers
- Payment verification and header generation
- Exposes payment response headers
- Support for multiple authorization types:
  - **EIP-3009**: transferWithAuthorization (USDC and compatible tokens)
  - **EIP-2612 Permit**: Standard ERC20 permit function
  - **Permit2**: Uniswap's universal token approvals

## API

### `withPaymentInterceptor(axiosClient, walletClient, paymentRequirementsSelector?, config?)`

Adds a response interceptor to an Axios instance to handle 402 Payment Required responses automatically.

#### Parameters

- `axiosClient`: The Axios instance to add the interceptor to
- `walletClient`: The wallet client used to sign payment messages (must implement the x402 wallet interface)
- `paymentRequirementsSelector` (optional): A function that selects the payment requirements from the response
- `config` (optional): Configuration for X402 operations
  - `authorizationType`: `"eip3009" | "permit" | "permit2"` - Authorization type for EVM payments (default: `"eip3009"`)
  - `svmConfig`: Custom RPC configuration for Solana

#### Returns

The modified Axios instance with the payment interceptor that will:
1. Intercept 402 responses
2. Parse the payment requirements
3. Create a payment header using the provided wallet client
4. Retry the original request with the payment header
5. Expose the X-PAYMENT-RESPONSE header in the final response

## Authorization Types

### EIP-3009 (Default)

Uses USDC's `transferWithAuthorization` function. Works with USDC and other tokens that implement EIP-3009.

```typescript
const api = withPaymentInterceptor(
  axios.create(),
  client
);
```

### EIP-2612 Permit

Uses the standard ERC20 `permit()` function. Works with tokens like DAI, WETH, and many others.

```typescript
const api = withPaymentInterceptor(
  axios.create(),
  client,
  undefined,
  { authorizationType: "permit" }
);
```

### Permit2

Uses Uniswap's Permit2 contract for universal token approvals. Works with ANY ERC20 token after a one-time approval.

```typescript
const api = withPaymentInterceptor(
  axios.create(),
  client,
  undefined,
  { authorizationType: "permit2" }
);
```

**Note**: Permit2 requires a one-time approval of the Permit2 contract (`0x000000000022D473030F116dDEE9F6B43aC78BA3`) for each token:

```typescript
import { PERMIT2_ADDRESS } from "x402-axios";

// Approve Permit2 to spend your tokens (one-time per token)
await client.writeContract({
  address: tokenAddress,
  abi: [{
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }],
  functionName: "approve",
  args: [PERMIT2_ADDRESS, maxUint256],
});
```

## Advanced Usage

### Manual Permit/Permit2 Header Creation

For advanced use cases, you can manually create Permit or Permit2 payment headers:

```typescript
import {
  createPaymentHeaderPermit,
  createPaymentHeaderPermit2,
} from "x402-axios";

// Create a Permit payment header
const permitHeader = await createPaymentHeaderPermit(
  client,
  1, // x402Version
  paymentRequirements
);

// Create a Permit2 payment header
const permit2Header = await createPaymentHeaderPermit2(
  client,
  1, // x402Version
  paymentRequirements
);

// Use the header in a request
await axios.get("/protected-resource", {
  headers: {
    "X-PAYMENT": permitHeader,
  },
});
```
