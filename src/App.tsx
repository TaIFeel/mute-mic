import { useLayoutEffect, useState } from 'react'
import './App.css'
import { ipcRenderer } from 'electron'
import Icon from '@mdi/react';
import { mdiMicrophone, mdiMicrophoneOff } from '@mdi/js';

console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)


function App() {

  const [micStatus, setMicStatus] = useState(false)


  ipcRenderer.on('muteStatus', (event, status) => {
    setMicStatus(status)
  })

  useLayoutEffect(() => {
    ipcRenderer.send('pageLoaded')
  },[])


  return (
    <div className='App'>
      <div className='indicator-microphone'>
        <Icon path={micStatus? mdiMicrophoneOff :mdiMicrophone} size={1.5}  color={micStatus? 'red' : 'green'}/>
      </div>
    </div>
  )
}

export default App