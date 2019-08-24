import React, { Component } from 'react'
import { BrowserRouter as Router, Redirect, Route, Link } from 'react-router-dom'
import DashboardProfile from './DashboardProfile'
// import DashboardProfileUpdate from './DashboardProfileUpdate'
// import DashboardCommunity from './DashboardCommunity'
// import DashboardSessions from './DashboardSessions'
import { Container, Col } from 'react-bootstrap'
import SideNav, { Toggle, Nav, NavItem, NavIcon, NavText } from '@trendmicro/react-sidenav'
import '@trendmicro/react-sidenav/dist/react-sidenav.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faUsers, faCalendarWeek } from '@fortawesome/free-solid-svg-icons'

class Dashboard extends React.Component {
  state = {

    sessions: '',
    members: ''
  }

  componentDidMount() {

    // this.getUser()
    // this.getUsers()
  }

  // getUser() {
  //   fetch(`${ BASE_URL }/users/${ this.props.currentUser }/`, {
  //     credentials: 'include'
  //   })
  //   .then(response => response.json())
  //   .then((currentUser) => {
  //     this.setState({
  //       currentUser: currentUser,
  //       sessions:  this.props.sessions
  //     })
  //   }).catch(err=> console.log(err))
  // }
  //
  // getUsers() {
  //   fetch(`${ BASE_URL }/users/`, {
  //     credentials: 'include'
  //   })
  //   .then(response => response.json())
  //   .then((members) => {
  //     this.setState({ members: members })
  //   }).catch(err=> console.log(err))
  // }
  //
  // updatedUser = () => {
  //   this.getUser()
  //   console.log('updated')
  // }
  //
  // bookedSession = () => {
  //   this.getUser()
  // }
  //
  // bookingDeleted = (index) => {
  //   const splicedBooking = this.state.currentUser
  //   splicedBooking.bookings.splice(index, 1)
  //   this.setState({
  //     currentUser: splicedBooking
  //   })
  //   console.log('spliced')
  //   // this.getUser()
  // }

  render() {

    return (
      <Router>
      <Route render={({ location, history }) => (
          <React.Fragment>
          <Container>
              <SideNav
                  onSelect={(selected) => {
                      const to = '/' + selected;
                      if (location.pathname !== to) {
                          history.push(to);
                      }
                  }}
              >
                  <SideNav.Toggle />
                  <SideNav.Nav defaultSelected="dash">
                      <NavItem eventKey="dash">
                          <NavIcon>
                            <FontAwesomeIcon icon={ faUser } />
                          </NavIcon>
                          <NavText>
                            My Dashboard
                          </NavText>
                      </NavItem>
                      <NavItem eventKey="update-profile">
                          <NavIcon>
                            <FontAwesomeIcon icon={ faUser } />
                          </NavIcon>
                          <NavText>
                           Update Profile
                          </NavText>
                      </NavItem>
                      <NavItem eventKey="classes">
                          <NavIcon>
                            <FontAwesomeIcon icon={ faCalendarWeek } />
                          </NavIcon>
                          <NavText>
                              Class Catalog
                          </NavText>
                      </NavItem>
                      <NavItem eventKey="community">
                          <NavIcon>
                              <FontAwesomeIcon icon={ faUsers } />
                          </NavIcon>
                          <NavText>
                              Community
                          </NavText>
                      </NavItem>
                      <NavItem onClick={ this.props.logoutUser } eventKey="logout">
                          <NavIcon>
                              <FontAwesomeIcon icon={ faUsers } />
                          </NavIcon>
                          <NavText>
                              Logout
                          </NavText>
                      </NavItem>
                  </SideNav.Nav>
              </SideNav>

              <main>
                {
                  this.state.currentUser ?
                  <Route path="/dash" exact
                    render= { (props) => <DashboardProfile { ...props }
                    currentUser= { this.state.currentUser }
                    bookingDeleted={ this.bookingDeleted } /> }
                  /> : null
                }

                <Route path="/logout"
                  render= { () => {
                    this.setState({ currentUser: undefined })
                    history.replace()
                    return (
                      <Redirect to='/' />
                    )
                  } }
                />
              </main>

          </Container>
          </React.Fragment>
      )}
      />
  </Router>
    )
  }
}

export default Dashboard
