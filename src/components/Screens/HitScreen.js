import React, { Component }  from 'react';
import { StyleSheet, Text, View, Button, Alert, Slider } from 'react-native';
import { dieRoller } from '../../lib/DieRoller';

export default class HitScreen extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			value: 0
		}
	}
	
	_onRollClick() {
		Alert.alert('You rolled ' + dieRoller.rollCheck().total);
	}
	
  render() {
    return (
      <View style={styles.container}>
     	<View style={styles.titleContainer}>
     	    <Text>Total OCV/OMCV:</Text>
     	   <Text>{this.state.value}</Text>
      	</View>
      	<Slider 
      		step={1} 
      		minimumValue={-30} 
      		maximumValue={30} 
      		onValueChange={(value) => this.setState({value: value})} 
	      	trackStyle={thumbStyles.track}
	        thumbStyle={thumbStyles.thumb}
	        minimumTrackTintColor='#30a935'
      	/>
      	<Button title='Roll' onPress={this._onRollClick} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3C6591'
  },
  titleContainer: {
	    flexDirection: 'row',
	    justifyContent: 'space-between',
	    alignItems: 'center'
  }
});

const thumbStyles = StyleSheet.create({
	  track: {
	    height: 4,
	    borderRadius: 2,
	  },
	  thumb: {
	    width: 30,
	    height: 30,
	    borderRadius: 30 / 2,
	    backgroundColor: 'white',
	    borderColor: '#30a935',
	    borderWidth: 2,
	  }
	});