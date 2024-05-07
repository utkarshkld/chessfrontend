import React, {useState,useRef, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'


const LandingPage = ({socket}) => {
  
    const [createRoom,setCreateRoom] = useState(false)
    const [enterRoom,setEnterRoom] = useState(false)
    const [opponentid,setOpponentid] = useState('')
    const [userId,setUserId] = useState('')
    const [startGame,setStartGame] = useState(false)
    const navigation = useNavigate('')
    const [showDifficulty,setShowDifficulty] = useState(false)
    const [copy,setCopy] = useState('Copy')
    
    
    const inputRef = useRef()
    socket.on('connect',(data)=>{
      console.log(socket.id)
      setUserId(socket.id)
    })
    
    socket.on('opponent_id',(data)=>{
      // console.log(socket.id)
      if(data.opponent != 'Invalid'){
        setTimeout(()=>{
          navigation(`/startgame/opponent/${data.opponent}/${data.color}`)
        },1000)        
        setStartGame(true)
      }
      setOpponentid(data.opponent)
      
    })
    
    async function joinRoom(){
        await socket.emit('connect_with_user',{reqId:inputRef.current.value})       

    }
    // function copyClipboard() {
    //   var copyText = document.getElementById("myButton").innerHTML;
      
    //   var input = document.createElement("input");
    //   input.value = copyText;
    //   document.body.appendChild(input);
    //   input.select();
    //   document.execCommand("copy");
    //   document.body.removeChild(input); 
    // }

  return (
    <div className='flex justify-center items-center h-screen w-screen bg-black'>
    <div className='flex-col justify-center items-center'>
        {/* <div className='flex items-center w-full justify-center text-white text-2xl mb-5'>Your id : {userName}</div> */}
        <div className='flex justify-center items-center w-full'>        
        { !(createRoom || enterRoom || showDifficulty) && (
        <div className='flex flex-col md:flex-row w-full gap-4'>
            <button onClick={()=>{setCreateRoom(true)}} className='px-8 py-4 text-2xl bg-green-500 text-white font-bold mt-10  rounded-2xl  hover:bg-black w-full  flex gap-10 items-center justify-center opacity-90 transition '>Create Room</button>
            <button onClick={()=>{setEnterRoom(true)}} className='px-8 py-4 text-2xl bg-red-500 text-white font-bold  mt-10 rounded-2xl  hover:bg-black w-full  flex gap-10 items-center justify-center opacity-90 transition '>Join Room</button>
            <button onClick={()=>{setShowDifficulty(true)}} className='px-8 py-4 text-2xl bg-green-500 text-white font-bold  mt-10 rounded-2xl  hover:bg-black w-full  flex gap-10 items-center justify-center opacity-90 transition '>Computer</button>
        </div>        
      )}
      { (showDifficulty) && (
        <div className='flex flex-col md:flex-row w-full gap-4'>
            <button onClick={()=>{navigation('/computer?level=2')}} className='px-8 py-4 text-2xl bg-green-500 text-white font-bold mt-10  rounded-2xl  hover:bg-black w-full  flex gap-10 items-center justify-center opacity-90 transition '>Easy 😁</button>
            <button onClick={()=>{navigation('/computer?level=8')}} className='px-8 py-4 text-2xl bg-orange-500 text-white font-bold  mt-10 rounded-2xl  hover:bg-black w-full  flex gap-10 items-center justify-center opacity-90 transition '>Medium 😶‍🌫️</button>
            <button onClick={()=>{navigation('/computer?level=15')}} className='px-8 py-4 text-2xl bg-red-500 text-white font-bold  mt-10 rounded-2xl  hover:bg-black w-full  flex gap-10 items-center justify-center opacity-90 transition '>Hard ☠️👽</button>
        </div>        
      )}
      {createRoom && (
        <div className='flex flex-col justify-center items-center'>
        <div className='text-white text-lg mb-5'>⚠️ If Code is Not visible Please Refresh the site ⚠️</div>
        
        <div className='text-white text-lg'>Share this code : {userId}</div>
        <button onClick={()=>{setCopy("Copied");navigator.clipboard.writeText(userId);setTimeout(()=>{setCopy("Copy")},4000)}} className='p-3 w-20  bg-green-500 rounded-lg text-white hover:bg-black'>{copy}</button>
        
        </div>
      )}
      {enterRoom && (
        <div>
        <div className='rounded-lg  bg-zinc-900 p-4 '>
            <input ref={inputRef} placeholder="Enter the Code" className=' p-3 m-5 border-4 border-sky-600 bg-zinc-800 outline-none text-white rounded-lg'></input>
            <div className='flex justify-around mb-5 m-3 gap-3'>
            <button onClick={()=>{setCreateRoom(false);setEnterRoom(false)}} className='w-6/12 bg-red-500 text-white p-3 text-lg font-semibold rounded-lg hover:bg-black'>Cancel</button>
            <button onClick={joinRoom} className='w-6/12 bg-green-500 text-white p-3 text-lg font-semibold rounded-lg hover:bg-black'>Join</button>
            </div>
        </div>
        
        </div>
        

      )}
      </div>
      {(createRoom || enterRoom )&& <div className='text-white m-5 text-lg'>Opponent : {opponentid}</div>}
      
    </div>
    </div>
  )
}

export default LandingPage
