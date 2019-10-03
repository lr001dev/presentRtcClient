import React, { Component } from 'react'
import io from 'socket.io-client'
import { Device } from 'mediasoup-client'
// import Peers from './Peers'
// import Peer from './Peer'
import { Container, CardDeck, Col, Card, ListGroup, ListGroupItem, Button } from 'react-bootstrap'


class RoomRouter extends Component {
  state = {
    roomId: '1',
    peers: [],
    socket: io('https://localhost:3003'),
    producers: []
  }

  async componentDidMount() {
    await this.connect()
  }

  connect = async (socket) => {
    // console.log(`this`)
    // console.log(this)
  // const serverUrl = `https://localhost:3002`
    socket = this.state.socket
    socket.request = this.socketPromise(socket)
    socket.on('connect', async () => {
      // $txtConnection.innerHTML = 'Connected';
        // $fsPublish.disabled = false;
        // $fsSubscribe.disabled = false;
        console.log(`connected`)
        socket.emit('room', this.state.roomId, socket.id)
        console.log(`socket.id`)
        console.log(socket.id)

      })
    socket.on('disconnect', () => {
        // $txtConnection.innerHTML = 'Disconnected';
        // $btnConnect.disabled = false;
        // $fsPublish.disabled = true;
        // $fsSubscribe.disabled = true;
        console.log(`disconnected`)
      })
    socket.on(`newProducer`, (msg, activePeers) => {
        // $fsSubscribe.disabled = false
        if(this.state.peers.length > 0){
          this.setState({
            peers: activePeers
           })
           console.log(activePeers)
        }
      })

      socket.on(`currentPeers`, async (msg, roomId, activePeers, peerId) => {

        const routerRtpCapabilities =
        await socket.request('getRouterRtpCapabilities')

        await this.setState({
          peerId: peerId,
          peer: socket,
          peers: activePeers,
          router: routerRtpCapabilities
         })
        this.loadPeerDevice(routerRtpCapabilities)
      })
      // socket.on(`autoSubscribe`, async (peer,peerDevice, peerId) => {
      //   console.log(`peerDevice`)
      //   console.log(peerDevice)
      //   console.log(peerId)
      //   console.log(this.state.peer)
      //   let assignPeerId = this.state.peer
      //   assignPeerId.id = peerId
      //   let newPeer = assignPeerId
      //   // console.log(newPeer)
      //   // this.subscribe(newPeer, peerDevice, peerId)
      //   console.log(`look for socket id`)
      //   console.log(this.state.socket)
      // })
      socket.on(`deleteFromList`, (msg,peerId) => {

  			console.log(peerId + ' ' + msg)
  			let deletePeer = [...this.state.peers]
        //
  			const index = deletePeer.map(thePeer => thePeer.peerId).indexOf(peerId)
  			deletePeer.splice(index, 1)
        console.log(deletePeer)
  			this.setState({
  				peers: deletePeer
  			}, () => {
  				// console.log(`new clients array`)
  				// console.log(this.state.peers)
  			})
  			// deletePeer.filter((thePeer) => {
  			// 	return thePeer.peerId === peerId
  			// })

  			// alert(msg + 'at index' + index)
  		})
  }

  socketPromise (socket) {
    return function request(type, data = {}) {
      return new Promise((resolve) => {
        socket.emit(type, data, resolve)
      })
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
  publish = async (peerDevice, peerIndex, roomId) => {
    console.log(`peer index ${peerIndex}`)
    const isWebcam = true

    const data = await this.state.peer.request('createProducerTransport', {
      forceTcp: false,
      rtpCapabilities: this.state.peerDevice.rtpCapabilities,
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

    transport.on('produce', async ({ kind, rtpParameters } ,callback, errback) => {
      try {
        const { id } = await this.state.peer.request('produce', {
          transportId: transport.id,
          kind,
          rtpParameters,
          peerIndex,
          roomId
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
          console.log(`video object`)
          console.log(document.getElementById(`${this.state.peerId}-local`))
          document.getElementById(`${this.state.peerId}-local`).srcObject = stream
          // this.state.peer.on(`publishVideo`, peerIndex)
             // $txtPublish.innerHTML = 'published'
             // $fsPublish.disabled = true
             // $fsSubscribe.disabled = false
          let subscribeButton = document.getElementById(`${this.state.peerId}-cam`)
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
        stream = await this.getUserMedia(peerDevice, peerIndex, transport, isWebcam)
      } catch (err) {
           // $txtPublish.innerHTML = 'failed'
      }
  }
  getUserMedia = async (peerDevice, peerIndex, transport, isWebcam, producer) => {
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
  autoSubscribe = (peer, peerDevice, peerId) => {

    let newPeer = JSON.stringify(peer)


    this.state.socket.emit(`autoSubscribe`, this.state.roomId, newPeer, peerDevice, peerId)
    console.log(`sending subscribe`)
    // this.state.peers.forEach(async(subscribePeer, index) => {
    //   console.log(`for each`)
    //   console.log(subscribePeer)
    //   await this.subscribe(peer, peerDevice, peerId)
    // })
    // let newProducer = {
    //   peer: peer,
    //   peerDevice: peerDevice,
    //   peerId: peerId
    // }
    // await this.setState({
    //   producers:[...this.state.producers, newProducer]
    // })
    // await console.log(`producer`)
    // await console.log(this.state.producers)
  }

  subscribe = async (peer, peerDevice, peerId, producer) => {
    console.log(`subscribing data`)
    // console.log(peer)
    // console.log(peerDevice)
    // console.log(peerId)


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

      const stream = await this.consume(transport, peer, peerDevice,producer)
      peer.request('resume')
  }

  consume = async (transport, peer, peerDevice, producer) => {
    let prodId = {
      id: producer
    }
    const { rtpCapabilities } = peerDevice
    const data = await peer.request('consume', { prodId, rtpCapabilities })
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

  componentWillUnmount() {

		// const video = document.getElementById(`${this.state.peerId}-local`)
		// let localStream = video.srcObject
		// let tracks = localStream.getTracks()
    //
		// tracks.forEach(function(track) {
	 	// 	track.stop()
 		// })
    //
 		// video.srcObject = null
    //
		// this.state.peer.close()
	}
  render() {
    if(this.state.peers.length !== 0 ) {

        return (
          <>
          {
            this.state.peers.map((peer, index) => {
              if(peer.peerId === this.state.peer.id) {
                return (
                    <>
                      <Container key={peer.peerId} >
                        <Card key={ index } style={{ width: '30rem' }}>
                          <Card.Img variant="top" src="" />
                          <Card.Body>
                            <video id={ `${ peer.peerId }-local` } autoPlay width='300px'></video>
                            <Card.Title>{ peer.peerId }</Card.Title>
                            <Card.Text>
                            I'm Local Peer
                            </Card.Text>
                          </Card.Body>
                          <ListGroup className="list-group-flush">
                            <ListGroupItem>
                              <Button
                                id={ `${ peer.peerId }-cam` }
                                onClick={ () => { this.publish(this.state.peerDevice, index, this.state.roomId) } }
                                variant="outline-success">Enable</Button>
                              </ListGroupItem>
                          </ListGroup>
                        </Card>
                    </Container>
                  </>
                )
              } else {
                  return(
                    <></>
                  )
              }
            })
          }
            <Container>
              <CardDeck>
            {
              this.state.peers.map((peer, index) => {
                if(peer.peerId !== this.state.peer.id) {
                  return(
                    <Col key={peer.peerId} sm>
                        <Card style={{ width: '18rem' }}>
                          <Card.Img variant="top" src="" />
                          <Card.Body>
                            <video id={ `${ peer.peerId }-remote`} autoPlay width='300px'></video>
                            <Card.Title>{ peer.peerId }</Card.Title>
                            <Card.Text>
                              I'm Remote Peer
                            </Card.Text>
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
                } else {
                    return(
                      <></>
                    )
                }
              })
            }
              </CardDeck>
            </Container>
          </>
        )
      } else {
            return(
              <h1>Nada</h1>
            )
          }
  }
}
export default RoomRouter
