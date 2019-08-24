import React, { Component } from 'react'
import io from 'socket.io-client'
import { Device } from 'mediasoup-client'
import NewPeer from './NewPeer'
import Peer from './Peer'


class Peers extends Component {
  state = {
    peerId: this.props.peerId,
    peers: this.props.peers,
    producers: [],
    peer: this.props.peer,
    router: this.props.router,
  }
  async componentDidMount() {
    await this.loadPeerDevice(this.state.router)
    // await this.publish()
    // await this.subscribe()
  }
  componentDidUpdate(prevProps, prevState) {

      if(this.state.peers !== this.props){
        console.log(`yes`)
        console.log(this.state.peers)
        console.log(this.props)
      }

    }
    loadPeerDevice = async (routerRtpCapabilities) => {
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
          // await console.log(`peer device`)
          // await console.log(this.state.peerDevice)
    }
  publish = async (peerDevice) => {
    const isWebcam = true

    const data = await this.state.peer.request('createProducerTransport', {
      forceTcp: false,
      rtpCapabilities: peerDevice.rtpCapabilities,
    })
    console.log(data)

    if (data.error) {
      console.error(data.error)
      return
    }

    const transport = peerDevice.createSendTransport(data)

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
        stream = await this.getUserMedia(peerDevice, transport, isWebcam)
      } catch (err) {
           // $txtPublish.innerHTML = 'failed'
      }
  }
  getUserMedia = async (peerDevice, transport, isWebcam, producer) => {
    if (!peerDevice.canProduce('video')) {
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
    // await this.props.autoSubscribe(this.state.peer, this.state.peerDevice, this.state.peerId)
    return stream
  }
  subscribe = async (peer, peerDevice, peerId) => {
    console.log(`subscribing data`)
    console.log(peer)
    console.log(peerDevice)
    console.log(peerId)


    const data = await peer.request('createConsumerTransport', {
      forceTcp: false,
    });
    if (data.error) {
    console.error(data.error)
      return;
    }

    const transport = peerDevice.createRecvTransport(data);
    transport.on('connect', ({ dtlsParameters }, callback, errback) => {
      peer.request('connectConsumerTransport', {
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
          // console.log(`${peerId}-remote`)
          // console.log(document.getElementById(`${peerId}-remote`))
          document.getElementById(`${peerId}-remote`).srcObject = stream
          // $txtSubscription.innerHTML = 'subscribed'
          // $fsSubscribe.disabled = true
          document.getElementById(`${peerId}-sub`).disabled = true
          // subscribeButton.disabled = true
          break;

          case 'failed':
          transport.close()
          // $txtSubscription.innerHTML = 'failed'
          // $fsSubscribe.disabled = false
          break;

          default: break;
        }
      })

      const stream = await this.consume(transport, peer, peerDevice)
      peer.request('resume')
  }

  consume = async (transport, peer, peerDevice) => {
    const { rtpCapabilities } = peerDevice
    const data = await peer.request('consume', { rtpCapabilities })
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

  if(this.state.peers) {

      return (
        this.props.peers.map((peer, index) => {
          if(peer.peerId === this.state.peer.id) {
            return (
              <>
                <div key={ index }>
                  <h1>I'm Local Peer</h1>
                  <h1>{ peer.peerId }</h1>
                  <video id={ `${ peer.peerId }-local` } autoPlay width='300px'></video>
                  <button key= { index } id='cam' onClick={ () => { this.publish(this.state.peerDevice)
                  console.log(peer.peerDevice)} }>Enable Cam</button>
                </div>
              </>
                )
          } else {
            return(
              <>
                <div key={ index }>
                  <h1>I'm Remote Peer</h1>
                  <h1>{ peer.peerId }</h1>
                  <video id={ `${ peer.peerId }-remote`} autoPlay width='300px'></video>
                  <button id={ `${ peer.peerId }-sub` } onClick={ () => { this.subscribe(this.state.peer, this.state.peerDevice, peer.peerId) } }>Subscribe</button>
                </div>
              </>
            )
          }
        })
          )

        }
      }

}


export default Peers

      <Col sm>
      <CardDeck>
        <Card key={ index } style={{ width: '18rem' }}>
          <Card.Img variant="top" src="" />
          <Card.Body>
            <Card.Title>{ peer.peerId }</Card.Title>
            <Card.Text>
              I'm Remote Peer
            </Card.Text>
            <video id={ `${ peer.peerId }-remote`} autoPlay width='300px'></video>
          </Card.Body>
          <ListGroup className="list-group-flush">
            <ListGroupItem>
              <Button
                id={ `${ peer.peerId }-sub` }
                onClick={ () => {
                    this.subscribe(this.state.peer, this.state.peerDevice, peer.peerId, peer.producerId)
                  } }
                variant="outline-success">Subscribe</Button>
            </ListGroupItem>
          </ListGroup>
        </Card>
        </CardDeck>

      </Col>

    }
      <Container>
        <CardDeck>
      {
        this.state.peers.map((peer, index) => {
          if(peer.peerId !== this.state.peer.Id && peer.peerId !== this.state.pee) {
            return(
              <Col  sm>
                  <Card style={{ width: '18rem' }}>
                    <Card.Img variant="top" src="" />
                    <Card.Body>
                      <Card.Title>{ peer.peerId }</Card.Title>
                      <Card.Text>
                        I'm Remote Peer
                      </Card.Text>
                      <video id={ `${ peer.peerId }-remote`} autoPlay width='300px'></video>
                    </Card.Body>
                    <ListGroup className="list-group-flush">
                      <ListGroupItem>
                        <Button
                          id={ `${ peer.peerId }-sub` }
                          onClick={ () => {
                              this.subscribe(this.state.peer, this.state.peerDevice, peer.peerId, peer.producerId)
                            } }
                          variant="outline-success">Subscribe</Button>
                      </ListGroupItem>
                    </ListGroup>
                  </Card>
              </Col>
            )
          }
        })
      }
        </CardDeck>
      </Container>
