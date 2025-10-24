import axios from "axios";
import { config } from "dotenv";
import { withPaymentInterceptor, decodeXPaymentResponse, createSigner, type Hex } from "x402-axios";

config();

const privateKey = process.env.PRIVATE_KEY as Hex | string;
const baseURL = process.env.RESOURCE_SERVER_URL as string; // e.g. http://localhost:3000
const endpointPath = process.env.ENDPOINT_PATH as string; // e.g. /weather

if (!baseURL || !privateKey || !endpointPath) {
  console.error("Missing required environment variables");
  process.exit(1);
}

/**
 * This example shows how to use the x402-axios package with EIP-2612 Permit authorization.
 * 
 * EIP-2612 Permit allows off-chain approval signatures for ERC20 tokens that support the permit() function.
 * This is useful for tokens like DAI, WETH, and many others that implement the EIP-2612 standard.
 *
 * To run this example, you need to set the following environment variables:
 * - PRIVATE_KEY: The private key of the signer
 * - RESOURCE_SERVER_URL: The URL of the resource server
 * - ENDPOINT_PATH: The path of the endpoint to call on the resource server
 *
 * Note: The token must support EIP-2612 permit() function
 */
async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════");
  console.log("  x402-axios Example - EIP-2612 Permit");
  console.log("═══════════════════════════════════════════\n");

  const signer = await createSigner("base-sepolia", privateKey);

  // Create Axios instance with Permit authorization
  const api = withPaymentInterceptor(
    axios.create({
      baseURL,
    }),
    signer,
    undefined,
    { evmConfig: { authorizationType: "permit" } }, // Use EIP-2612 Permit
  );

  console.log(`🚀 Making request to: ${baseURL}${endpointPath}`);
  console.log(`📝 Using authorization type: EIP-2612 Permit\n`);

  try {
    const response = await api.get(endpointPath);

    console.log("✅ Success! Response:");
    console.log(JSON.stringify(response.data, null, 2));

    if (response.headers["x-payment-response"]) {
      const paymentResponse = decodeXPaymentResponse(response.headers["x-payment-response"]);
      console.log("\n💰 Payment Response:");
      console.log(JSON.stringify(paymentResponse, null, 2));
    }
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

main();

