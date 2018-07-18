// Get the hash of the url
const hash = window.location.hash
.substring(1)
.split('&')
.reduce(function (initial, item) {
  if (item) {
    var parts = item.split('=');
    initial[parts[0]] = decodeURIComponent(parts[1]);
  }
  return initial;
}, {});
window.location.hash = '';

// Set token
let _token = hash.access_token;
const authEndpoint = 'https://accounts.spotify.com/authorize';

// Replace with your app's client ID, redirect URI and desired scopes
const clientId = '753819e3242f444aabc7cadacd11de5b';
const redirectUri = 'http://localhost:5500';
const scopes = [
  'user-read-private'
];

// If there is no token, redirect to Spotify authorization
if (!_token) {
  window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token`;
}

const url = 'https://api.spotify.com/v1/me/playlists';
const options = {
    headers : {
        'Authorization' :  `Bearer ${_token}`;
    }
}

// Fetch Call
fetch(url,options)
	.then(function(response){
		console.log(response.status);
		return response.json()
	})
	.then(data => console.log(data));