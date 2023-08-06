
const anchor = require('@project-serum/anchor');
const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token');

async function main(provider, payer) {
  // Initialize the program
  anchor.setProvider(provider);
  const program = anchor.workspace.SolanaNFTMinting;

  // Mint the NFT
  const mint = await createNFTMint(payer.publicKey);
  console.log('NFT Mint created:', mint.toBase58());

  // Initialize the NFT metadata
  const metadata = {
    name: 'My NFT',
    symbol: 'NFT',
    uri: 'https://example.com/nft-metadata',
  };

  // Create the NFT token account
  const tokenAccount = await mintNFT(payer, mint, metadata);

  console.log('NFT Token Account created:', tokenAccount.toBase58());
}

async function createNFTMint(payer) {
  const mint = anchor.web3.Keypair.generate();
  const instructions = await createAssociatedTokenAccount(payer, mint.publicKey);
  await mint.initialize(payer, null, mint.publicKey, []);
  return mint;
}

async function createAssociatedTokenAccount(payer, mintAddress) {
  const token = new anchor.web3.PublicKey(TOKEN_PROGRAM_ID);
  const associatedTokenAddress = await anchor.web3.PublicKey.findProgramAddress(
    [payer.toBuffer(), token.toBuffer(), mintAddress.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const ix = anchor.web3.SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: associatedTokenAddress[0],
    space: 165,
    lamports: await provider.connection.getMinimumBalanceForRentExemption(165, 'singleGossip'),
    programId: token,
  });
  return [ix, associatedTokenAddress[0]];
}

async function mintNFT(payer, mint, metadata) {
  const token = new anchor.Program(TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, payer);
  const nftTokenAccount = await token.createAccount(mint.publicKey);
  await token.mintTo(nftTokenAccount, mint, [], 1);
  await token.setAuthority(mint.publicKey, null, 'MintTokens', payer, []);
  return nftTokenAccount;
}

module.exports = { main };

