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
.then(response => response.json())
.then(data => getData(data))

// Get the data
const getData = (data) => {
  const items = data.items;
  items.reduce((accumulator, item) => {
  // console.log(item);
  const holder = accumulator + `
  <div class="col s12 m6 l4 xl4">
  <div class="card">
    <div class="card-image">
      <img src="${item.images[0].url}">
    </div>
    <div class="card-content">
      <a class="black-text playlist-name">${truncate(`${item.name}`, 20)}</a>
    </div>
    <div class="card-action ">
      <a href="#modal1" class="right-align track btn black white-text modal-trigger" data-link="${item.tracks.href}" data-title="${item.name}">Tracks list</a>
      <a href="#" class="track btn green accent-3 white-text" data-link="${item.tracks.href}" data-title="${item.name}">Select</a>
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
          .then(response => response.json())
          .then(data => appendToModal(data));
        })
      })
    }
  getTracks();
}
  
// Function append tracks to modal content 
function appendToModal(params){
  let html = '';
  const rows = document.querySelector('tbody');
  const data = params.items;
  // Loop the data
  data.forEach((val, index) => {
    const trackName = val.track.name;
    const releaseDate = val.track.album.release_date;
    const duration = val.track.duration_ms;
    const tempoId = val.track.id;

    console.log(tempoId)
    // Assign to html
    html += `
    <tr>
        <td>${index+1}</td>
        <td>${val.track.artists[0].name}</td>
        <td>${truncate(`${trackName}`, 16)}</td>
        <td>${releaseDate}</td>
        <td>${category(`${releaseDate}`)}</td>
        <td>${msToMinutesSecond(`${duration}`)}</td>
        <td>${tempo(`${tempoId}`)}</td>
      </tr>
    `
  })
  return rows.innerHTML = html;
}

// Function to get tempo
function tempo(params){
  const url = `https://api.spotify.com/v1/audio-features/${params}`
  const options = {
    headers : {
      'Authorization' : `Bearer ${_token}`
    }
  }
  return fetch(url,options) 
    .then(res => res.json())
    .then(data => {
      console.log(data.tempo)
      Math.round(data.tempo)})
} 
// Function set category
function category(str){
  const getYear = parseInt(str.substring(0,4));
  const today = new Date();
  const year = today.getFullYear();
  const substract = year - getYear;
  
  let category = '';
    if(getYear === year){
       return category = 'Top 40';
    }
      if(substract === 1) {
        category = 'Current';
      } else if((substract >= 2) && (substract < 10)){
        category = 'Recurrent';
      } else {
        category = 'Oldies';
      }
      return category;
}

// Function change ms to Minutes and second
function msToMinutesSecond(ms) {
  var minutes = Math.floor(ms / 60000);
  var seconds = ((ms % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
} 

// Function truncate text
const truncate = (str, length) => {
  return (str.length >= length) ?  `${str.substring(0,length)} ....` : str;
}

// Init modal
  document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.modal');
    var modal = M.Modal.init(elems,
      {
        endingTop: '50%',
        preventScrolling: false,
        inDuration:500,
        outDuration:600
      });

    var elems = document.querySelectorAll('.tooltipped');
    var tooltips = M.Tooltip.init(elems);
  });