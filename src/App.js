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
// samples
import { rawkuma } from './sample/rawkuma';
// utils
import axios from "axios";
const delayPromise = t => new Promise(resolve => setTimeout(resolve, t));

function App() {
  const [url, setUrl] = useState('');
  const [mdChptHash, setMdChptHash] = useState('');
  const [source, setSource] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [state, setState] = useState('input URL');  // input URL, retriving images, success, error

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

  useEffect(() => {
    if (state == 'retriving images') {
      retriveImages();
    }
  }, [state]);

  async function retriveImages() {
    try {
      if (source == 'rawkuma') {
        await retriveFromRawkuma();
        setState('success');
      } else if (source == 'mangadex') {
        await retrieveFromMangadex();
        setState('success');
      }
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
        for (let i = 0; i < imgs.length; i++) {
          console.log(imgs[i].attributes.src.value);
        }
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
        console.log(JSON.stringify(response.data));
        console.log(response.data.baseUrl);
        console.log(response.data.chapter.hash);
        console.log(response.data.chapter.data[0]);
        console.log(response.data.chapter.dataSaver[0]);

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
            <Typography variant='caption'>{`${5} images retrieved`}</Typography>
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
