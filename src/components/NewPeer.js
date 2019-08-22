import React, { Component } from 'react'
import { Device } from 'mediasoup-client'
import io    from 'socket.io-client'

class NewPeer extends Component {
  state = {
    peerId: this.props.peerId,
    peer: this.props.peer,
  
  }

  render() {
    return(
      <h1>{this.state.peerId}-Peer</h1>
    )
  }
}

export default NewPeer
