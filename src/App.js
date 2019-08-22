import React from 'react'
// import { BASE_URL } from './constants.js'
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom"
import { LinkContainer } from 'react-router-bootstrap'
import RoomRouter from './components/RoomRouter'
import Home from './components/Home'

class App extends React.Component {
  render() {
    return(
      <Router>
        <Route exact path="/" component={ Home } />
        <Route path="/room" component={ RoomRouter } />
      </Router>
    )
  }
}
export default App
