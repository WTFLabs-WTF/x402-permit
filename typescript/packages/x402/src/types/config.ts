/**
 * Configuration options for Solana (SVM) RPC connections.
 */
export interface SvmConfig {
  /**
   * Custom RPC URL for Solana connections.
   * If not provided, defaults to public Solana RPC endpoints based on network.
   */
  rpcUrl?: string;
}

/**
 * Configuration options for EVM blockchain operations.
 */
export interface EvmConfig {
  /**
   * Authorization type to use for EVM payments
   *
   * @default "eip3009"
   * - "eip3009": EIP-3009 transferWithAuthorization (requires USDC or compatible token)
   * - "permit": EIP-2612 Permit (requires token with permit() function)
   * - "permit2": Uniswap Permit2 universal approvals (works with any ERC20 after initial approval)
   */
  authorizationType?: "eip3009" | "permit" | "permit2";

  /**
   * Custom RPC URL for EVM connections.
   * If not provided, defaults to public EVM RPC endpoints based on network.
   */
  rpcUrl?: string;
}

/**
 * Configuration options for X402 client and facilitator operations.
 */
export interface X402Config {
  /** Configuration for Solana (SVM) operations */
  svmConfig?: SvmConfig;
  /** Configuration for EVM operations */
  evmConfig?: EvmConfig;
}
