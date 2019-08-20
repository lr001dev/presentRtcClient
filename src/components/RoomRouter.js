import React, { Component } from 'react'
import io from 'socket.io-client'
import Peer from './Peer'


class RoomRouter extends Component {
  state = {
    roomId: '1',
    peers: [],
    socket: io('https://localhost:3002')
  }

  async componentDidMount() {
    await this.connect()
    // await this.connect()

  }

  async connect (socket) {

  // const serverUrl = `https://localhost:3002`
    socket = this.state.socket
    socket.request = this.socketPromise(socket)
    socket.on('connect', async () => {
      // $txtConnection.innerHTML = 'Connected';
        // $fsPublish.disabled = false;
        // $fsSubscribe.disabled = false;

        console.log(`connected`)
        console.log(socket)
        const routerRtpCapabilities =
        await socket.request('getRouterRtpCapabilities')
        await socket.emit('room', this.state.roomId)

        await this.setState({
          peer: socket,
          routerRtpCapabilities: routerRtpCapabilities
         })

      })
    socket.on('disconnect', () => {
        // $txtConnection.innerHTML = 'Disconnected';
        // $btnConnect.disabled = false;
        // $fsPublish.disabled = true;
        // $fsSubscribe.disabled = true;
        console.log(`disconnected`)
      })
    socket.on('newProducer', () => {
        // $fsSubscribe.disabled = false
      })

      socket.on(`currentPeers`, (msg, roomId, activePeers) => {

        console.log(`newPeer`)
        console.log(activePeers)

        this.setState({
          peers: activePeers
        })
      })
  }

  socketPromise (socket) {
    return function request(type, data = {}) {
      return new Promise((resolve) => {
        socket.emit(type, data, resolve)
      })
    }
  }

  render() {
    console.log(`routercaps`)
    console.log(this.state.routerRtpCapabilities)
    return(
      <>
        <h1>I'm Router</h1>
        {
          this.state.routerRtpCapabilities ?
          this.state.peers.map((peer, index) => {
            console.log(`map`)
            console.log(this.state.peer)
            return (
              <Peer
                key= { index }
                routerCaps= { this.state.routerRtpCapabilities }
                peerId= { peer.peerId  }
                peer= { this.state.peer }
              />
            )
          }) : null
        }

      </>
    )
  }
}
export default RoomRouter
