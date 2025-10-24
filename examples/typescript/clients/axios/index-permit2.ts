import axios from "axios";
import { config } from "dotenv";
import { withPaymentInterceptor, decodeXPaymentResponse, createSigner, type Hex, PERMIT2_ADDRESS } from "x402-axios";

config();

const privateKey = process.env.PRIVATE_KEY as Hex | string;
const baseURL = process.env.RESOURCE_SERVER_URL as string; // e.g. http://localhost:3000
const endpointPath = process.env.ENDPOINT_PATH as string; // e.g. /weather

if (!baseURL || !privateKey || !endpointPath) {
  console.error("Missing required environment variables");
  process.exit(1);
}

/**
 * This example shows how to use the x402-axios package with Permit2 authorization.
 * 
 * Permit2 is Uniswap's universal token approval contract that works with ANY ERC20 token.
 * After a one-time approval of the Permit2 contract, you can use off-chain signatures for all future payments.
 *
 * To run this example, you need to:
 * 1. Set the following environment variables:
 *    - PRIVATE_KEY: The private key of the signer
 *    - RESOURCE_SERVER_URL: The URL of the resource server
 *    - ENDPOINT_PATH: The path of the endpoint to call on the resource server
 * 
 * 2. Approve the Permit2 contract for your token (one-time per token):
 *    See README.md for instructions on how to approve Permit2
 *
 * Benefits of Permit2:
 * - Works with ANY ERC20 token
 * - Single transaction after initial approval
 * - Built-in expiration for security
 * - Can batch multiple tokens
 */
async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════");
  console.log("  x402-axios Example - Permit2");
  console.log("═══════════════════════════════════════════\n");

  console.log(`📝 Permit2 Contract: ${PERMIT2_ADDRESS}\n`);

  const signer = await createSigner("base-sepolia", privateKey);

  // Create Axios instance with Permit2 authorization
  const api = withPaymentInterceptor(
    axios.create({
      baseURL,
    }),
    signer,
    undefined,
    { evmConfig: { authorizationType: "permit2" } }, // Use Permit2
  );

  console.log(`🚀 Making request to: ${baseURL}${endpointPath}`);
  console.log(`📝 Using authorization type: Permit2\n`);

  try {
    const response = await api.get(endpointPath);

    console.log("✅ Success! Response:");
    console.log(JSON.stringify(response.data, null, 2));

    if (response.headers["x-payment-response"]) {
      const paymentResponse = decodeXPaymentResponse(response.headers["x-payment-response"]);
      console.log("\n💰 Payment Response:");
      console.log(JSON.stringify(paymentResponse, null, 2));
    }

    console.log("\n💡 Key Benefits of Permit2:");
    console.log("   - Works with ANY ERC20 token");
    console.log("   - Single transaction after initial approval");
    console.log("   - Built-in expiration for security");
    console.log("   - Can batch multiple tokens");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }

    if (error.message.includes("allowance") || error.message.includes("approval")) {
      console.error("\n⚠️  Tip: Make sure you've approved the Permit2 contract for your token.");
      console.error(`   Permit2 Address: ${PERMIT2_ADDRESS}`);
      console.error("   See README.md for approval instructions.");
    }
  }
}

main();

