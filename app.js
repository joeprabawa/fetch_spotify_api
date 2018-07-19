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
'user-top-read'
];

// If there is no token, redirect to Spotify authorization
if (!_token) {
  window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token&show_dialog=true`;
}

const url = 'https://api.spotify.com/v1/me/playlists';
const options = {
  headers : {
  'Authorization' :  `Bearer ${_token}`
  }
}

const output = document.querySelector('.output');

// Fetch Call
fetch(url,options)
.then(response => {
  console.log(response.status)
  return response.json();
  })
.then(data => getData(data))

// Get the data
const getData = (data) => {
  const items = data.items;
  items.reduce((accumulator, item) => {
  // console.log(item);
  const holder = accumulator + `
  <div class="col s12 m4 l4">
  <div class="card">
    <div class="card-image">
      <img src="${item.images[0].url}">
    </div>
    <div class="card-content">
      <a class="black-text">${truncate(`${item.name}`, 20)}</a>
    </div>
    <div class="card-action">
      <a href="#modal1" class="track modal-trigger" data-link="${item.tracks.href}" data-title="${item.name}">This is a link</a>
    </div>
  </div>
  </div>
  `
  return output.innerHTML = holder;
  },'')
  
  // Function get Track List  
  function getTracks(){
    const modalTitle = document.querySelector('h4.title');
    const buttons = document.querySelectorAll('a.track');
    buttons.forEach((button,index) => {
        button.addEventListener('click', e => {
          // Append Playlist name to modal title
          modalTitle.innerHTML = button.dataset.title;
          // Get the playlist url
          const url = button.dataset.link;
          const options = {
            headers : {
              'Authorization' : `Bearer ${_token}`
            }
          }
          // Fetch playlist url
          fetch(url,options)
          .then(response =>{
            console.log(response)
            return response.json()
          })
          .then(data => appendToModal(data));
        })
      })
    }
  getTracks();
}
  // Function truncate text
const truncate = (str, length) => {
  return (str.length >= length) ? `${str.substring(0,length)} ....` : str;
}

// Function append tracks to modal content 
function appendToModal(params){
  const rows = document.querySelector('tbody');
  const data = params.items;
  data.reduce((acc,val,index) => {
    const holder = acc + `
      <tr>
        <td>${index+1}</td>
        <td>${val.track.artists[0].name}</td>
        <td>${val.track.name}</td>
        <td>${val.track.album.release_date}</td>
        <td>${val.track.duration_ms}</td>
      </tr>
    `;
    return rows.innerHTML = holder;
  },'')
}
  // Init modal
  document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.modal');
    var modal = M.Modal.init(elems);
  });