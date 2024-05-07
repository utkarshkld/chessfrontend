
import './App.css';
import Computer from './components/Computer';
import LandingPage from './components/LandingPage';
import Main from './components/Main';
import { Routes,Route } from 'react-router-dom';
import io from 'socket.io-client'
const socket = await io.connect('https://chessbackend-fm6u.onrender.com')
// const socket =  io.connect('http://localhost:3001')
function App() {
  
  console.log(socket.id)  
  return (
    <div className="App">
      <Routes>    
          <Route path="/" element={<LandingPage socket={socket}/>} />
          <Route path="/startgame/opponent/:id/:color" element={<Main socket={socket}/>} />  
          <Route path='/computer' element={<Computer/>}/>  
      </Routes>    
    </div>
  );
}

export default App;
