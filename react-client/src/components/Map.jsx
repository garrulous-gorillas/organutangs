import React from "react";
import { withGoogleMap, GoogleMap, Marker, Polyline, DirectionsRenderer } from 'react-google-maps';


class Map extends React.Component {
  constructor(props){
    super(props);
    this.state = { 
      location1: [0.0, 0.0], 
      location2: [0.0, 0.0],
      directions: null
    }
  }

  componentDidMount() {
    this.props.socket.on('user locations', (data) => {
      this.setState({
        location1: data.location1,
        location2: data.location2
      });
    });
  }

  componentDidUpdate() {
    console.log('component updated')
    const DirectionsService = new google.maps.DirectionsService();
     DirectionsService.route({
       origin: this.state.location1,
       destination: this.state.location2,
       travelMode: google.maps.TravelMode.WALKING,
     }, (result, status) => {
       if (status === google.maps.DirectionsStatus.OK) {
         this.setState({
           directions: result,
         });
       } else {
         console.error(`error fetching directions ${result}`);
       }
     });
  }

  render() {
    const markers = this.props.markers.map(function(obj,index){
      return {
        position: {
          lat: obj.coordinates.latitude,
          lng: obj.coordinates.longitude
        },
        label: obj.name,
        key: index,
        data: obj
      }
    });

    return(
      <GoogleMap 
        ref={this.props.onMapMounted}
        defaultZoom={16} 
        center={ this.props.center } 
        defaultCenter={ this.props.center } >
        { markers.map((marker, index) => {
            return(
              <Marker
                key={ marker.key }
                position={ marker.position }
                label={ marker.label }
                onClick={(e)=> this.props.handleMarkerClick(marker.data, marker.key)}
              />
            )
          }
        )}
        <Marker
          key="midpoint"
          position={ this.props.midpoint }
          label="Midpoint"
          icon={{ url: "./images/midPointIcon.png" }}
          />
        <Marker
          key="User 1"
          position={ this.state.location1 }
          label="Your location"
          icon={{ url: "./images/user1.png" }}
        />
        <Marker
          key="Friend"
          position={ this.state.location2 }
          label="Friend's location"
          icon={{ url: "./images/user2.png" }}
        />
        {this.state.directions && <DirectionsRenderer 
                                      directions={this.state.directions}
                                      options={ { preserveViewport: true, polylineOptions: { strokeColor: '#00BA6A' }} } />}
      </GoogleMap>
    )
  }
}
//higher functionality component
export default withGoogleMap(Map);
