let regedit = require('regedit')
// https://github.com/ironSource/node-regedit/issues/60
regedit.setExternalVBSLocation('resources/regedit/vbs');
regedit = regedit.promisified

export type ImicrophoneInfo = {
    name: string,
    location: string,
    deviceState: boolean
}

type IPropertiesValues = {
    [key: string]: {
        type: string,
        values: {[key: string]: {
            type:string,
            value:string
        }}
    }
}

interface IregeditResult {
    [key: string]: {
        exists: boolean,
        keys: string[],
        values: IPropertiesValues
    }
}


// regedit stores even microphones that are not plugged into the jack. This function return plugged into the jack microphones
async function isAvailableMicrophone(microphoneLocation:string) {

    let deviceRegedit = await regedit.list(microphoneLocation)
    let deviceState = deviceRegedit[microphoneLocation].values.DeviceState.value
        
    if(deviceState === 268435457){
        return {deviceState: false}
    }

    else if(deviceState === 1){
        return {deviceState: true}
    }

    else return false

}


// get all microphone from regedit
async function isWorkMicrophone(Properties:IPropertiesValues, currentLocation:string) {

    let deviceInfo = Properties[currentLocation].values
    let deviceType = deviceInfo["{a45c254e-df1c-4efd-8020-67d146a850e0},2"].value
    let deviceName = deviceInfo["{b3f8fa53-0004-438e-9003-51a46e139bfc},6"].value

    if(deviceType != "Microphone" && deviceType !== 'Микрофон') return false

    
    let microphoneLocation = currentLocation.replace("\\Properties\\", "")
    let microphoneDeviceState = await isAvailableMicrophone(microphoneLocation)

    if(!microphoneDeviceState) return false

    else{
        return {name: deviceName, location: microphoneLocation, deviceState:microphoneDeviceState.deviceState}
    }
}

export async function getAllAvailableMicrophone(){

    let location = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\MMDevices\\Audio\\Capture'
    let AllWorksMicrophones:ImicrophoneInfo[] = []
    let result:IregeditResult = await regedit.list(location)

    for(let element of result[location].keys){

        let currentLocation = location + "\\" + element + "\\" + "Properties\\"
        let preopreties = await regedit.list(currentLocation)
        let microphonWorked = await isWorkMicrophone(preopreties, currentLocation)

        if(microphonWorked){
            await AllWorksMicrophones.push(microphonWorked)
        }
        
    }

    return AllWorksMicrophones
}