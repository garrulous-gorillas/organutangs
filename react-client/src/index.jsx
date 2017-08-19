import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import List from './components/List.jsx';
import axios from 'axios';
import Map from './components/Map.jsx';
import MeetUpForm from './components/MeetUpForm.jsx';
import Title from './components/Title.jsx';
import sampleData from './sampleData.js';
import LogoutButton from './components/LogoutButton.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import ChatContainer from './components/ChatContainer.jsx';
const io = require('socket.io-client');
const socket = io();

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      auth: !!localStorage.getItem('username') || false,
      userId: localStorage.getItem('username') || '',
      // meetingLocations: [],
      transportation: 'walking',
      meetingLocations: sampleData.sampleData,
      allMeetingLocations: sampleData.sampleData,
      displayAllLocations: false,
      midpoint: { "lat": 40.751094, "lng": -73.987597 },
      center: { "lat": 40.751094, "lng": -73.987597 },
      departure_time: undefined,
      routePath: [],
      favoriteLocations: {}
    };

    this.showSignUp = false;

    this.handleFavoriteClick = this.handleFavoriteClick.bind(this);
    this.handleTransportationChange = this.handleTransportationChange.bind(this);
    this.toggleLocations = this.toggleLocations.bind(this);
    this.handleMapMounted = this.handleMapMounted.bind(this);
    this.setAuth = this.setAuth.bind(this);
    this.setuserId = this.setuserId.bind(this);
    // this.handleClick = this.handleClick.bind(this);
    this.resetMidpoint = this.resetMidpoint.bind(this);
  }

  setuserId(input) {
    this.setState({userId: input}, () => {
      if (this.state.userId === null) {
        socket.emit('remove user', this.state.userId);
      } else {
        socket.emit('add user', this.state.userId);
      }
    });
  }

  setAuth(input) {
    this.setState({auth: input});
  }

  handleListClick(item, key) {
    console.log("item:", item, ", key:", key);
    this.setState({center: {"lat": item.coordinates.latitude, "lng": item.coordinates.longitude} });
  }

  handleMarkerClick(item, key) {
    console.log("item:", item, ", key:", key);
    this.setState({center: {"lat": item.coordinates.latitude, "lng": item.coordinates.longitude} });
  }

  handleFavoriteClick(item, favoriteStatus) {

    console.log("favorite clicked");
    console.log('status', favoriteStatus);
    if (!favoriteStatus) {
      const newFavorites = Object.assign(this.state.favoriteLocations, {[item.id]: item});
      this.setState({favoriteLocations: newFavorites});
      axios.put(`/favorites/${this.state.userId}`, {
        newLocation: item
      })
        .catch(err => console.log(err));
    } else {
      console.log(item.id);
      const newFavorites = Object.assign({}, this.state.favoriteLocations);
      delete newFavorites[item.id];
      this.setState({favoriteLocations: newFavorites});
      axios.put(`/favorites/delete/${this.state.userId}`, {
        location: item.id
      })
        .catch(err => console.log(err));
    }
  }

  handleMapMounted(map) {
    // Keep a reference to map object for react-google-maps method
    this._map = map;
  }

  handleMapMounted(map) {
    // Keep a reference to map object for react-google-maps method
    this._map = map;
  }

  handleCenterChanged() {
    console.log('handleCenterChange called');
    this._map.setCenter({lat: -34, lng: 151});
  }

  handleAllLocationsToggle() {
    this.setState({displayAllLocations : !this.state.displayAllLocations}, ()=> {
      var markers = this.toggleLocations().map(function(obj,index){
        return {
          lat: obj.coordinates.latitude,
          lng: obj.coordinates.longitude
        }
      });

      var bounds = new google.maps.LatLngBounds();
      for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i]);
      }
      this._map.fitBounds(bounds);
    });
  }

  toggleLocations() {
    return this.state.displayAllLocations ? this.state.allMeetingLocations : this.state.meetingLocations;
  }

  handleTransportationChange(event) {
    console.log('transportation changed', event.target.name);
    this.setState( {transportation: event.target.name })
  }

  resetMidpoint() {
    this.setState({ midpoint: null }, function() {
      console.log('---midpt was reset---');
    });
  }

  componentDidMount() {
    axios.get(`/favorites/${this.state.userId}`)
      .then((favoriteLocations) => {
        console.log('all favorite locations: ', favoriteLocations.data);
        this.setState( { favoriteLocations: favoriteLocations.data });
      })
      .catch(err => console.log(err));

    socket.on('mid meeting locations', (data) => {
      this.setState({ meetingLocations: data });
    });

    socket.on('all meeting locations', (data) => {
      this.setState({ allMeetingLocations: data });
    });

    socket.on('routePath', (data) => {
      this.setState({ routePath: data });
      console.log('routePath', data);
    });

    socket.on('match status', (data) => {
      console.log('match status inside index.jsx');
    });

    socket.on('midpoint', (data) => {
      console.log('midpoint listener data', data);
      this.setState({ midpoint: data, center: data });
    });

    /** update departure_time  */
    socket.on('departure_time', (data) => {
      console.log('Got departure_time', data);
      this.setState( data );
    });

    if (this.state.userId) {
      console.log('should be logged in', this.state.userId);
      socket.emit('add user', this.state.userId);
    } else {
      console.log('should be logged out');
    }
  }

//this render method renders title,meetup,map if you're logged in, else it renders login/register components
  render () {
    return (
      <div>
      {this.state.auth ? (
        <div>
          <div className="top">
            <Title />
            <LogoutButton setuserId={this.setuserId} setAuth={this.setAuth}/>
          </div>
          <ChatContainer userId={this.state.userId}
                         socket={ socket }
                         midpoint = {this.state.midpoint} />
          <MeetUpForm userId={this.state.userId}
                      socket = { socket }
                      handleAllLocationsToggle = {this.handleAllLocationsToggle.bind(this) }
                      resetMidpoint = { this.resetMidpoint }
                      handleTransportationChange={ this.handleTransportationChange }
                      transportation={ this.state.transportation }/>

          <div className="resultsContainer">
            <div className= "mapBox" >
              <div className="subMapBox">
                <Map
                  socket = { socket }
                  markers = { this.toggleLocations() }
                  midpoint = { this.state.midpoint }
                  center = { this.state.center }
                  containerElement={<div style={{height:100+'%'}} />}
                  mapElement={<div style={{height:100+'%'}} />}
                  handleMarkerClick={ this.handleMarkerClick.bind(this) }
                  onMapMounted = { this.handleMapMounted }
                  transportation={  this.state.transportation }
                />
              </div>
            </div>
            <div className="listContainer">
              <List 
                handleClick={this.handleListClick.bind(this)} 
                items={ this.toggleLocations()  }
                favoriteLocations={ this.state.favoriteLocations }
                handleFavoriteClick={this.handleFavoriteClick}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="signInContainer">
          <div className="signInForms">
            <div className="card">
              <div className="title">Login Here!</div>
              <Login setAuth={this.setAuth} setuserId={this.setuserId}/>
            </div>
            <div className="card">
              <div className="title">New User? Register here!</div>
              <Register setAuth={this.setAuth} setuserId={this.setuserId}/>
            </div>
          </div>
        </div>
      )}
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
