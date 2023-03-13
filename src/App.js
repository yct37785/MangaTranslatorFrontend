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
import { Buffer } from 'buffer';
import axios from "axios";
const delayPromise = t => new Promise(resolve => setTimeout(resolve, t));

/**
 * Main page
 */
function App() {
  const [url, setUrl] = useState('');
  const [mdChptHash, setMdChptHash] = useState('');
  const [imgB64s, setImgB64s] = useState([]);
  const [source, setSource] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [state, setState] = useState('input URL');  // input URL, retriving images, success, error

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
    }
  }, [state]);

  /**
   * Main function for retriving img URLs
   */
  async function retriveImages() {
    try {
      if (source == 'rawkuma') {
        await retriveFromRawkuma();
      } else if (source == 'mangadex') {
        await retrieveFromMangadex();
      }
    } catch (e) {
      console.log(e);
      setErrMsg(e);
    }
  }

  function retriveFromRawkuma() {
    return new Promise(async (resolve, reject) => {
      try {
        const corsUrl = 'https://us-central1-cors-anywhere-4646f.cloudfunctions.net/widgets/multi';
        // retrieve HTML via a proxy to bypass CORs
        let response = await axios({
          method: 'get',
          url: corsUrl,
          params: { reqs: [{ url: url }] }
        });
        // const response = { data: rawkuma };
        // parse HTML to retrive img urls
        const parser = new DOMParser();
        const root = parser.parseFromString(response.data[0], 'text/html');
        const imgs = root.querySelector('#readerarea').firstChild.querySelectorAll('img');
        const img_reqs = [];
        // for (let i = 0; i < img_reqs.length; i++)
        for (let i = 3; i < 5; i++) {
          // replace any whitespaces with %20 (url encoding)
          img_reqs.push({
            url: imgs[i].attributes.src.value.replace(/\s/g, "%20"),
            config: { responseType: 'arraybuffer' }
          });
        }
        // img urls to blob
        response = await axios({
          method: 'get',
          url: corsUrl,
          params: { reqs: img_reqs }
        });
        // success
        setImgB64s(response.data);
        setState('success');
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
        // for (let i = 0; i < response.data.chapter.dataSaver.length; i++) {
        for (let i = 3; i < 5; i++) {
          img_urls.push(`${baseUrl}/${response.data.chapter.dataSaver[i]}`);
        }
        // img urls to blob
        const res_list = await Promise.all(img_urls.map((imgURL) => axios.get(imgURL, { responseType: 'arraybuffer' })));
        // success
        setImgB64s(res_list);
        setState('success');
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  async function proceed() {
    try {
      console.log('Total imgs: ' + imgB64s.length);
      // submit img blobs to backend
      let fd = new FormData();
      fd.append("totalPages", imgB64s.length);
      for (let i = 0; i < imgB64s.length; ++i) {
        const arrayBuffer = imgB64s[i];
        let buffer = Buffer.from(arrayBuffer.data,'binary').toString("base64");
        fd.append(i.toString(), buffer);
      }
      // get job id
      const url = 'http://localhost:5000/job/submit';
      const res = await axios.post(url, fd);
      // redirect to URL
      console.log(res.data.job_id);
    } catch(e) {
      console.log(e);
    }
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
            <Typography variant='caption'>{`${imgB64s.length} images retrieved`}</Typography>
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
