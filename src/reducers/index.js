import { combineReducers } from 'redux';
import character from './character';
import forms from './forms';
import settings from './settings';
import statistics from './statistics';

export default combineReducers({
   character,
   forms,
   settings,
   statistics
});
