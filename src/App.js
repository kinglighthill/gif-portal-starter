import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

import idl from "./idl.json"
import kp from "./keypair.json"

import React, { useCallback, useEffect, useState } from "react"

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { Program, Provider, web3 } from '@project-serum/anchor'

const { SystemProgram } = web3

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// let baseAccount = Keypair.generate();


const programID = new PublicKey(idl.metadata.address)

const network = clusterApiUrl('devnet')

const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = 'kingholyhill';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [walletAddress, setWalletAdress] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!')

          const response = await solana.connect({
            onlyIfTrusted: true
          })

          console.log('Connected with Public Key: ', response.publicKey.toString())
          
          setWalletAdress(response.publicKey.toString())
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet  👻')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const connectWallet = async () => {
    const { solana } = window

    if (solana) {
      const response = await solana.connect()
      console.log('Connected with Public Key: ', response.publicKey.toString())
      setWalletAdress(response.publicKey.toString())
    }
  }

  const onInputChange = (event) => {
    const { value } = event.target
    setInputValue(value)
  }

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }

    setInputValue('')
    console.log('Gif link: ', inputValue)
    
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        }
      })
      console.log("GIF successfully sent to program", inputValue)

      await getGifList()
    } catch(error) {
      console.log("Error sending GIF: ", error)
    }
  }

  const upvoteGif = async (gifLink) => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)

      await program.rpc.upvoteGif(gifLink, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        }
      })
      console.log("GIF successfully upvoted: ", gifLink)

      await getGifList()
    } catch(error) {
      console.log("Error upvoting gif: ", error)
    }
  }

  const downvoteGif = async (gifLink) => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)

      await program.rpc.downvoteGif(gifLink, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        }
      })
      console.log("GIF successfully downvoted: ", gifLink)

      await getGifList()
    } catch(error) {
      console.log("Error downvoting gif: ", error)
    }
  }

  // const deleteGif = async (gifLink) => {
  //   try {
  //     const provider = getProvider()
  //     const program = new Program(idl, programID, provider)

  //     await program.rpc.deleteGif(gifLink, {
  //       accounts: {
  //         baseAccount: baseAccount.publicKey,
  //         user: provider.wallet.publicKey,
  //       }
  //     })
  //     console.log("GIF successfully deleted: ", gifLink)

  //     await getGifList()
  //   } catch(error) {
  //     console.log("Error deleting gif: ", error)
  //   }
  // }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    )

    return provider
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)
      console.log("ping")

      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      })
      console.log("Created a new BaseAccount w/ address: ", baseAccount.publicKey.toString())
      await getGifList()
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const renderNotConnectContainer = () => (
    <button className='cta-button connect-wallet-button' onClick={connectWallet}>
      Connect to Wallet
    </button>
  )

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } else {
      return (
        <div className='connected-container'>
          <form onSubmit={(event) => {
            event.preventDefault()
            sendGif()
          }}>
            <input type="text" placeholder="Enter gif link!" value={inputValue} onChange={onInputChange} />
            <button type="submit" className="cta-button submit-gif-button">Submit</button>
          </form>
          <div className='gif-grid'>
            {
              gifList.map((item, index) => (
                <div className='gif-item' key={index}>
                  <img src={item.gifLink} alt=""/>
                  <p className='user'>Submitted by {item.userAddress.toString()}</p>
                  <button className="secondary-button" onClick={() => upvoteGif(item.gifLink)}>Upvote {item.upvotes > 0 ? item.upvotes.toString() : ""}</button>
                  {item.upvotes > 0 ? <button className="secondary-button" onClick={() => downvoteGif(item.gifLink)}>Downvote</button> : <></>}
                  {/* <button className="secondary-button" onClick={() => deleteGif(item.gifLink)}>Delete</button> */}
                </div>
              ))
            }
          </div>
        </div>
      )
    }
  }
 
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected()
    }

    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  const getGifList = useCallback(async () => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)
      // const account = await program.account.baseAccount.fetch(baseAccount.publicKey)
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)
      setGifList(account.gifList)
    } catch(error) {
      console.log("Error in getGifList: ", error)
      setGifList(null)
    }
  }, [])

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...')

      getGifList()
    }
  }, [walletAddress, getGifList])

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 Meme GIF Portal</p>
          <p className="sub-text">
            View your Naruto GIF collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by ${TWITTER_HANDLE} runs on devnet`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
