import { combineReducers } from 'redux';
import character from './character';
import combat from './combat';
import forms from './forms';
import settings from './settings';
import statistics from './statistics';
import randomHero from './randomHero';

export default combineReducers({
   character,
   combat,
   forms,
   settings,
   statistics,
   randomHero
});
