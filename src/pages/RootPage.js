import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../App.css';
// UI
import AnimateHeight from 'react-animate-height';
// MUI
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
// utils
import { Buffer } from 'buffer';
import axios from "axios";
const delayPromise = t => new Promise(resolve => setTimeout(resolve, t));

/**
 * Main page
 */
function RootPage() {
  // state
  const [url, setUrl] = useState('');
  const [mdChptHash, setMdChptHash] = useState('');
  const [imgB64s, setImgB64s] = useState([]);
  const [source, setSource] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [state, setState] = useState('input URL');  // input URL, retriving images, success, error
  // UI
  const [previewImgsRow, setPreviewImgsRow] = useState(4);
  const [previewHeight, setPreviewHeight] = useState(0);

  /**
   * listen
   */
  const updateWindowDimensions = useCallback(() => {
    if (window.innerWidth < 768 && previewImgsRow != 6) {
      setPreviewImgsRow(6);
    } else if (window.innerWidth >= 768 && previewImgsRow != 3) {
      setPreviewImgsRow(3);
    }
  }, [previewImgsRow]);

  useEffect(() => {
    updateWindowDimensions();
    window.addEventListener('resize', updateWindowDimensions);
    return () => window.removeEventListener('resize', updateWindowDimensions);
  }, []);

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
        // const corsUrl = 'http://localhost:5080/multi';
        // retrieve HTML via a proxy to bypass CORs
        let fd = new FormData();
        fd.append('reqs', JSON.stringify([{ url: url }]));
        let response = await axios.post(corsUrl, fd, { headers: { 'Content-Type': 'application/json' } });
        // const response = { data: rawkuma };
        // parse HTML to retrive img urls
        const parser = new DOMParser();
        const root = parser.parseFromString(response.data[0], 'text/html');
        const imgs = root.querySelector('#readerarea').firstChild.querySelectorAll('img');
        const img_reqs = [];
        // for (let i = 0; i < imgs.length; i++) {
        for (let i = 0; i < 5; i++) {
          // replace any whitespaces with %20 (url encoding)
          img_reqs.push({
            url: imgs[i].attributes.src.value.replace(/\s/g, "%20"),
            config: { responseType: 'arraybuffer' }
          });
        }
        // img urls to blob
        fd = new FormData();
        fd.append('reqs', JSON.stringify(img_reqs));
        console.log(img_reqs.length);
        response = await axios.post(corsUrl, fd, { headers: { 'Content-Type': 'application/json' } });
        // success
        setImgB64s(response.data);
        setState('success');
        setPreviewHeight('auto');
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
        setPreviewHeight('auto');
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
    setPreviewHeight(0);
  }

  return (
    <div className='app'>
      <div className='page-vertical' style={{ justifyContent: 'center', overflowY: 'hidden' }}>
        {/* form */}
        <div className='flex-container children-container vertical-layout align-center pad' 
          style={{ height: '250px' }}>
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
          </div> : null}
        </div>
        {/* preview */}
        {state == 'success' ? <div className='flex-container justify-center'
          style={{ display: 'flex', width: 'calc(100% - 28px)' }}>
          <Button variant="outlined" style={{ marginRight: '8px' }} onClick={restart}>Restart</Button>
          <Button variant="contained" onClick={proceed}>Proceed</Button>
        </div> : null}
        <AnimateHeight duration={500} height={state == 'success' ? '40vh' : 0} style={{ marginTop: '16px' }}>
          {state == 'success' ? <div style={{ width: '100%', height: '40vh', overflowY: 'scroll' }}>
            <Box sx={{ padding: '8px' }}>
              <Grid container spacing={2}>
                {
                  imgB64s.map((imgB64, i) => {
                    return <Grid key={i} item xs={previewImgsRow}>
                      <img style={{ width: '100%' }} src={`data:image/jpg;base64,${Buffer.from(imgB64, 'binary').toString("base64")}`} />
                    </Grid>
                  })
                }
              </Grid>
            </Box>
          </div> : null}
        </AnimateHeight>
      </div>
    </div>
  );
}

export default RootPage;
