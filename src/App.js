import React, { useState, useEffect, useRef } from 'react';
import logo from './logo.svg';
import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
// UI
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';
// utils
import axios from "axios";
const delayPromise = t => new Promise(resolve => setTimeout(resolve, t));

/**
 * Main page
 */
function App() {
  const [url, setUrl] = useState('');
  const [mdChptHash, setMdChptHash] = useState('');
  const [imgURLs, setImgURLs] = useState([]);
  const [source, setSource] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [state, setState] = useState('input URL');  // input URL, retriving images, parsing images, success, error

  /**
   * On click submit URL btn
   */
  function submitUrl() {
    if (url.includes('mangadex.org')) {
      // get chapter hash
      const mdUrl = url.split('/');
      if (mdUrl.length >= 5) {
        const chptHash = mdUrl[4];
        console.log("Mangadex chapter hash: " + chptHash);
        setMdChptHash(chptHash);
        setState('retriving images');
        setSource('mangadex');
      }
    } else if (url.includes('rawkuma.com')) {
      console.log("RawKuma chapter URL: " + url);
      setState('retriving images');
      setSource('rawkuma');
    }
  }

  /**
   * Check state changes
   */
  useEffect(() => {
    if (state == 'retriving images') {
      retriveImages();
    } else if (state == 'parsing images') {
      parseImages();
    }
  }, [state]);

  /**
   * Main function for retriving img URLs
   */
  async function retriveImages() {
    try {
      if (source == 'rawkuma') {
        await retriveFromRawkuma();
        setState('parsing images');
      } else if (source == 'mangadex') {
        await retrieveFromMangadex();
        setState('parsing images');
      }
    } catch (e) {
      console.log(e);
      setErrMsg(e);
    }
  }

  /**
   * Main function for parsing img URLs to base64
   */
  async function parseImages() {
    try {
      // convert all URL to base64
      for (let i = 0; i < imgURLs.length; ++i) {
        console.log(imgURLs[i]);
      }
      setState('success');
    } catch (e) {
      console.log(e);
      setErrMsg(e);
    }
  }

  function retriveFromRawkuma() {
    return new Promise(async (resolve, reject) => {
      try {
        // retrieve HTML via a proxy to bypass CORs
        const response = await axios({
          method: 'get',
          url: 'https://us-central1-cors-anywhere-4646f.cloudfunctions.net/widgets/',
          params: { url: url }
        });
        // const response = { data: rawkuma };
        // parse HTML
        const parser = new DOMParser();
        const root = parser.parseFromString(response.data, 'text/html');
        const imgs = root.querySelector('#readerarea').firstChild.querySelectorAll('img');
        const img_urls = [];
        for (let i = 0; i < imgs.length; i++) {
          // replace any whitespaces with %20 (url encoding)
          img_urls.push(imgs[i].attributes.src.value.replace(/\s/g, "%20"));
        }
        setImgURLs(img_urls);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  function retrieveFromMangadex() {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios('https://api.mangadex.org/at-home/server/' + mdChptHash);
        // build image URLs
        const baseUrl = `${response.data.baseUrl}/data-saver/${response.data.chapter.hash}/`;
        const img_urls = [];
        for (let i = 0; i < response.data.chapter.dataSaver.length; i++) {
          img_urls.push(`${baseUrl}/${response.data.chapter.dataSaver[i]}`);
        }
        setImgURLs(img_urls);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  function proceed() {

  }

  function restart() {
    setUrl('');
    setMdChptHash('');
    setSource('');
    setErrMsg('');
    setState('input URL');
  }

  return (
    <div className='app'>
      <div className='page-vertical'>
        <div style={{ height: '35%' }}/>
        {/* form */}
        <div className='flex-container children-container vertical-layout align-center pad'>
          <TextField id='outlined-basic' label='Chapter URL' variant='outlined' className='fill-parent' value={url}
            onChange={(e) => setUrl(e.target.value)} />
          <Typography variant='body1'>
            Supported chapter URLs: Mangadex, RawKuma
          </Typography>
          <LoadingButton disabled={!url || state != 'input URL'} variant='contained' style={{ marginTop: '16px' }}
            loading={state == 'retriving images'} loadingPosition="end"
            endIcon={<SendIcon />} onClick={submitUrl}>Submit</LoadingButton>
          {state == 'retriving images' ? <div className='flex-container vertical-layout align-center' style={{ marginTop: '16px' }}>
          <Typography variant='h6'>{`Source: ${source}`}</Typography>
          <Typography variant='caption'>retriving images...</Typography>
          </div> : null}
          {state == 'success' ? <div className='flex-container vertical-layout align-center' style={{ marginTop: '16px' }}>
            <Typography variant='h6'>{`Source: ${source}`}</Typography>
            <Typography variant='caption'>{`${imgURLs.length} images retrieved`}</Typography>
            <div className='flex-container children-container hort-layout align-center' style={{ marginTop: '16px' }}>
              <Button variant="outlined" onClick={restart}>Restart</Button>
              <Button variant="contained" onClick={proceed}>Proceed</Button>
            </div>
          </div> : null}
        </div>
      </div>
    </div>
  );
}

export default App;
