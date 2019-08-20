import React, { Component } from 'react'
import { Device } from 'mediasoup-client'
import io    from 'socket.io-client'

class Peer extends Component {
  state = {
    peerId: this.props.peerId,
    peer: this.props.peer,
    router: this.props.routerCaps,
  }

  async componentDidMount() {
    //   this.setState({
    //   peerId: this.props.peerId,
    //   peer: this.props.peer,
    //   router: this.props.routerCaps
    // })

    await this.loadPeerDevice(this.state.router)
  }
  async loadPeerDevice(routerRtpCapabilities) {
    const peerDevice = await new Device()
    try {
        // peerDevice = await new Device()

      } catch (error) {
          if (error.name === 'UnsupportedError') {
            console.error('browser not supported')
          }
        }
        await peerDevice.load({routerRtpCapabilities})
        await this.setState({
          peerDevice: peerDevice
        })
        await console.log(`peer device`)
        await console.log(this.state.peerDevice)
  }

  async publish(e) {
    // const isWebcam = (e.target.id === 'btn_webcam')
    const isWebcam = true
    // $txtPublish = isWebcam ? $txtWebcam : $txtScreen

    const data = await this.state.peer.request('createProducerTransport', {
      forceTcp: false,
      rtpCapabilities: this.state.peerDevice.rtpCapabilities,
    })

    if (data.error) {
      console.error(data.error)
      return
    }
    await console.log (`producer transport`)
    await console.log (data)
    console.log(`state`)
    console.log(this.state)

    const transport = this.state.peerDevice.createSendTransport(data)

    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      this.state.peer.request('connectProducerTransport', { dtlsParameters })
      .then(callback)
      .catch(errback)
    })

    transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const { id } = await this.state.peer.request('produce', {
          transportId: transport.id,
          kind,
          rtpParameters,
        })
        callback({ id })
      } catch (err) {
        errback(err)
      }
    })

    transport.on('connectionstatechange', (state) => {
      switch (state) {
        case 'connecting':
          // $txtPublish.innerHTML = 'publishing...'
          // $fsPublish.disabled = true;
          // $fsSubscribe.disabled = true
          break;

          case 'connected':
          document.getElementById(`${this.state.peerId}-local`).srcObject = stream
          // $txtPublish.innerHTML = 'published'
          // $fsPublish.disabled = true
          // $fsSubscribe.disabled = false
          let subscribeButton = document.getElementById('cam')
          subscribeButton.disabled = true
          break;

          case 'failed':
          transport.close()
          // $txtPublish.innerHTML = 'failed'
          // $fsPublish.disabled = false
          // $fsSubscribe.disabled = true
          break;

          default: break;
        }
      })

      let stream
      try {
        stream = await this.getUserMedia(transport, isWebcam)
      } catch (err) {
        // $txtPublish.innerHTML = 'failed'
      }
  }

  async getUserMedia(transport, isWebcam, producer) {
    if (!this.state.peerDevice.canProduce('video')) {
      console.error('cannot produce video')
      return
    }

    let stream
    try {
      stream = isWebcam ?
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true }) :
        await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    } catch (err) {
      console.error('starting webcam failed,', err.message)
      throw err
    }
    const track = stream.getVideoTracks()[0]
    const params = { track }
    // if ($chkSimulcast.checked) {
    if (true) {
      params.encodings = [
        { maxBitrate: 100000 },
        { maxBitrate: 300000 },
        { maxBitrate: 900000 },
      ];
      params.codecOptions = {
        videoGoogleStartBitrate : 1000
      };
    }
    producer = await transport.produce(params)
    return stream
  }

  async subscribe() {
    const data = await this.state.peer.request('createConsumerTransport', {
      forceTcp: false,
    });
    if (data.error) {
    console.error(data.error)
      return;
    }

    const transport = this.state.peerDevice.createRecvTransport(data);
    transport.on('connect', ({ dtlsParameters }, callback, errback) => {
      this.state.peer.request('connectConsumerTransport', {
        transportId: transport.id,
        dtlsParameters
      })
        .then(callback)
        .catch(errback)
      })

      transport.on('connectionstatechange', (state) => {
        switch (state) {
          case 'connecting':
          // $txtSubscription.innerHTML = 'subscribing...'
          break;

          case 'connected':
          document.getElementById(`${this.state.peerId}-remote`).srcObject = stream
          // $txtSubscription.innerHTML = 'subscribed'
          // $fsSubscribe.disabled = true
          let subscribeButton = document.getElementById('sub')
          subscribeButton.disabled = true
          break;

          case 'failed':
          transport.close()
          // $txtSubscription.innerHTML = 'failed'
          // $fsSubscribe.disabled = false
          break;

          default: break;
        }
      })

      const stream = await this.consume(transport)
      this.state.peer.request('resume')
  }

  async consume(transport) {
    const { rtpCapabilities } = this.state.peerDevice
    const data = await this.state.peer.request('consume', { rtpCapabilities })
    const {
      producerId,
      id,
      kind,
      rtpParameters,
    } = data

    let codecOptions = {};
    const consumer = await transport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
      codecOptions,
    });
    const stream = new MediaStream()
    stream.addTrack(consumer.track)
    return stream
  }

  render() {
    if(this.state.peer) {
      if(this.state.peerId == this.state.peer.id ) {
        return (
          <>
          <h1>I'm Peer</h1>
          <h1>{this.state.peerId}</h1>
          <video id={ `${this.state.peerId}-local` } autoPlay width='300px'></video>
          <video id={ `${this.state.peerId}-remote` } autoPlay width='300px'></video>
          <button id='cam' onClick={ () => { this.publish() } }>Enable Cam</button>
          </>
        )
      } else {
        return (
          <>
          <h1>I'm Peer</h1>
          <h1>{this.state.peerId}</h1>
          <video id={ `${this.state.peerId}-remote` } autoPlay width='300px'></video>
          <button id='sub' onClick={ () => { this.subscribe() } }>Subscribe</button>
        </>
        )
      }
    }

  }
}
export default Peer
