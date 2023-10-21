import { useEffect, useLayoutEffect, useState } from 'react'
import { ipcRenderer } from 'electron'
import Icon from '@mdi/react';
import {getAllAvailableMicrophone, ImicrophoneInfo} from './utils'
import { mdiMicrophone, mdiMicrophoneOff, mdiMicrophoneSettings } from '@mdi/js';

const Store = require('electron-store');
const store = new Store();

let regedit = require('regedit')
// https://github.com/ironSource/node-regedit/issues/60
regedit.setExternalVBSLocation('resources/regedit/vbs');
regedit = regedit.promisified

type ILoaded = "Loading" | "Error" | "Succefull"
 
function App() {

  const [micEnabled, setMicEnabled] = useState<boolean>(false)
  const [loaded, setLoaded] = useState <ILoaded>("Loading")
  const [micRegeditLocation, setMicRegeditLocation] = useState<string>('')
  const [ allMicrophones, setAllMicrophones] = useState<ImicrophoneInfo[]>([])

  ipcRenderer.on('changeMicrophone', (event, microphoneName:string) => {
    let microphoneInfo = allMicrophones.find(el => el.name = microphoneName)
    if(!microphoneInfo) return
    setMicEnabled(microphoneInfo.deviceState)
    setMicRegeditLocation(microphoneInfo.location)
  })


  ipcRenderer.on('changeMuteStatus', async () => {

    let DeviceState = 0

    if(micEnabled){
      DeviceState = 268435457
      setMicEnabled(false)
    }
    else{
      DeviceState = 1
      setMicEnabled(true)
    }

    await regedit.putValue({
      [micRegeditLocation]: {
          DeviceState: {
              value: DeviceState,
              type: 'REG_DWORD'
          }
      }
    })
  })

  let loadedColor = () => {
    switch(loaded){
      case "Loading":
        return 'yellow'

      case "Error":
        return "red"
    }
  }

  useEffect(() => {
      getAllAvailableMicrophone().then((value)=>{
        if(value.length){
          let selectMicrophone:ImicrophoneInfo
          let lastMicrophone = store.get('lastMicrophone')

          if(!lastMicrophone) {
            store.set('lastMicrophone', value[0].name)
            selectMicrophone = value[0]
          }
          else {
            let microphoneFinded = value.find(e => e.name === lastMicrophone)!
            selectMicrophone = microphoneFinded
          }

          setAllMicrophones(value)
          setMicEnabled(selectMicrophone.deviceState)
          setMicRegeditLocation(selectMicrophone.location)

          ipcRenderer.send('pageLoaded', value)
        }
        if(!value.length) return setLoaded('Error')
        setLoaded("Succefull")
      })
  },[])


  return (
    <div className='App'>
      <div className='indicator-microphone'>
        {loaded === "Loading" || loaded === "Error"?
        <Icon path={mdiMicrophoneSettings} size={1.5} color={loadedColor()}/>
        :
        <Icon path={micEnabled? mdiMicrophone :mdiMicrophoneOff} size={1.5} color={micEnabled? 'green' : 'red'}/>
        }
      </div>
    </div>
  )
}

export default App