import axios from 'axios';
import { put, takeLatest } from 'redux-saga/effects';

// worker Saga: will be fired on "FETCH_USER" actions
function* fetchUser() {
  try {
    const config = {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    };

    // the config includes credentials which
    // allow the server session to recognize the user
    // If a user is logged in, this will return their information
    // from the server session (req.user)
    const response = yield axios.get('/api/user', config);

    // now that the session has given us a user object
    // with an id and username set the client-side user object to let
    // the client-side code know the user is logged in
    console.log('fetchuser response:', response)
    yield put({ type: 'SET_USER', payload: response.data });
  } catch (error) {
    console.log('User get request failed', error);
  }
}

// Saga for retrieving all of the current user's personal info
// and storing it in a reducer
function* fetchUserInfo(action) {
  try {
    const response = yield axios.get(`/api/user/profile/${action.payload}`)
    if (response.data === 'unauthorized') {
      // this is what we do in that case
    } else {
      yield put({ type: 'SET_USER_INFO', payload: response.data });
      //store same data in a edit reducer for the userinfo edits
      yield put({ type: 'SET_EDIT_USER_INFO', payload: response.data });
    }
  } catch (error) {
    console.log('User info get request failed', error);
  }
}

// Saga for posting a new user's info to DB
function* createUser(action) {
  try {

    yield axios.post('/api/user/profile', action.payload)
  } catch (error) {
    console.log('User post request failed', error);
  }
}

// saga listens for then a put request should be done for user_data
function* updateUserData(action) {
  try {

    // PUT request for the edit changes 
    yield axios.put('/api/user/edit', action.payload)
    //GET the new data that data! 


    yield put({ type: 'FETCH_USER_INFO', payload: action.payload.user_id })
    // ALso refresh the dojo list 
    const id = action.payload.dojo_id
    yield put({ type: 'GET_ACTIVE_USERS', payload: id })
    // yield put({ type: 'GET_INACTIVE_USERS', payload: id })
  } catch (error) {
    console.log('User_data PUT request failed', error);
  }
}

function* userSaga() {
  yield takeLatest('FETCH_USER', fetchUser);
  yield takeLatest('FETCH_USER_INFO', fetchUserInfo);
  yield takeLatest('CREATE_USER', createUser);
  yield takeLatest('UPDATE_USER_DATA', updateUserData)

}

export default userSaga;
