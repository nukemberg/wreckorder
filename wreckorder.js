const mimeType = 'video/webm; codecs=vp8'
function downloadMedia(data, name) {
    const url = URL.createObjectURL(new Blob(data, {type: mimeType}))
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = name + '.webm'
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
}

async function preview() {
    const select = document.querySelector('select#videoInput')
    const video = document.querySelector('video#cameraPreview')
    const deviceId = select.value
    const camera = await navigator.mediaDevices.getUserMedia({video: {deviceId}, audio: true})

    video.srcObject = camera
    video.captureStream()

}

async function record() {
    const name = document.querySelector('input#name').value
    const status = document.querySelector('#status')
    if (name == '') {
        status.innerHTML = '<mark>Empty name!</mark>'
        return
    } else {
        status.innerHTML = ''
    }

    const deviceId = document.querySelector('select#videoInput').value
    const camera = await navigator.mediaDevices.getUserMedia({video: {deviceId}, audio: true})
    const recorder = new MediaRecorder(camera, {mimeType})
    const screen = await navigator.mediaDevices.getDisplayMedia({video: true, audio: false})
    const screenRecorder = new MediaRecorder(screen, {mimeType})

    const cameraData = []
    const screenData = []

    recorder.ondataavailable = (e) => cameraData.push(e.data)
    screenRecorder.ondataavailable = (e) => screenData.push(e.data)

    await Promise.all([recorder.start(), screenRecorder.start()])

    const recordButton = document.querySelector('button#record')
    const stopButton = document.querySelector('button#stop')
    stopButton.disabled = false
    recordButton.disabled = true

    stopButton.addEventListener('click', async () => {
        await Promise.all([recorder.stop(), screenRecorder.stop()])
        screen.getTracks().forEach(track => track.stop())
        camera.getTracks().forEach(track => track.stop())
        console.log('Recording stopped')
        stopButton.disabled = true
        const downloadButton = document.querySelector('button#download')
        downloadButton.disabled = false
        downloadButton.addEventListener('click', () => {
            downloadMedia(cameraData, `${name}-camera`)
            downloadMedia(screenData, `${name}-screen`)
        })

    })
}

async function fillCamerasSelection() {
    const selectBox = document.querySelector('select#videoInput')
    selectBox.innerHTML = ''
    const devices = await navigator.mediaDevices.enumerateDevices()
    devices.forEach(device => {
        if (device.kind == 'videoinput') {
            const opt = document.createElement('option')
            opt.text = device.label || device.deviceId
            opt.value = device.deviceId
            selectBox.add(opt)
        }
    })
}

async function init() {
    const cameraPermissions = await navigator.permissions.query({name: 'camera'});
    if (cameraPermissions.state == 'granted') {
        fillCamerasSelection()
    }

    cameraPermissions.addEventListener('change', async function (e) {
        console.log('permissions changed: ' + cameraPermissions.state)
        fillCamerasSelection()
    })
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('button#record').addEventListener('click', record)
    
    document.querySelector('select#videoInput').addEventListener('change', preview)
    
    init().then(() => navigator.mediaDevices.getUserMedia({video: true, audio: true}))
    .then(preview)
})