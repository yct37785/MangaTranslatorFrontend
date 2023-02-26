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
const delayPromise = t => new Promise(resolve => setTimeout(resolve, t));

function App() {
  const [url, setUrl] = useState('');
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
        setState('retriving images');
        setSource('Mangadex');
      }
    } else if (url.includes('rawkuma.com')) {
      console.log("RawKuma chapter URL: " + url);
      setState('retriving images');
      setSource('Rawkuma');
    }
  }

  useEffect(() => {
    if (state == 'retriving images') {
      retriveImages();
    }
  }, [state]);

  async function retriveImages() {
    try {
      if (source == 'Rawkuma') {
        await retriveFromRawkuma();
        setState('success');
      }
    } catch (e) {
      setErrMsg(e);
    }
  }

  function retriveFromRawkuma() {
    return new Promise(async (resolve, reject) => {
      try {
        // retrieve HTML...
        await delayPromise(1000);
        // parse HTML
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
          <Typography variant='h6'>{`${source} detected`}</Typography>
          <Typography variant='caption'>retriving images...</Typography>
          </div> : null}
          {state == 'success' ? <div className='flex-container vertical-layout align-center' style={{ marginTop: '16px' }}>
            <Typography variant='h6'>{`${source} detected`}</Typography>
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
