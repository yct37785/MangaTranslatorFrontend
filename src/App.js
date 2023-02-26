import logo from './logo.svg';
import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

function App() {
  return (
    <div className="App">
      <div className="page-vertical justify-center">
        <div className='flex-container vertical-layout align-center pad'>
          <TextField id="outlined-basic" label="URL" variant="outlined" className='fill-parent' />
          <Typography variant="body1" gutterBottom>
            Supported URLs: Mangadex, RawKuma
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default App;
