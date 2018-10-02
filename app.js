// Get the hash of the url
const hash = window.location.hash
  .substring(1)
  .split("&")
  .reduce(function(initial, item) {
    if (item) {
      var parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
  }, {});
window.location.hash = "";

// Set token
let _token = hash.access_token;

const authEndpoint = "https://accounts.spotify.com/authorize";

// Replace with your app's client ID, redirect URI and desired scopes
const clientId = "753819e3242f444aabc7cadacd11de5b";
const redirectUri = "http://localhost:5500";
const scopes = ["user-top-read"];

// If there is no token, redirect to Spotify authorization
if (!_token) {
  window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
    "%20"
  )}&response_type=token&show_dialog=true`;
}

const url = "https://api.spotify.com/v1/me/playlists?limit=50";
const options = {
  headers: {
    Authorization: `Bearer ${_token}`
  }
};

const output = document.querySelector("#test1 .output");

// Fetch Call
fetch(url, options)
  .then(response => response.json())
  .then(data => getData(data));

// Get the data
const getData = data => {
  const items = data.items;
  items.reduce((accumulator, item) => {
    // console.log(item);
    const holder =
      accumulator +
      `
  <div class="col s12 m6 l4 xl4">
  <div class="card">
    <div class="card-image">
      <img src="${item.images[0].url}">
    </div>
    <div class="card-content">
      <a class="black-text playlist-name">${truncate(`${item.name}`, 20)}</a>
    </div>
    <div class="card-action ">
      <a href="#modal1" class="right-align track btn black white-text modal-trigger" data-link="${
        item.tracks.href
      }" data-title="${item.name}">Tracks list</a>
      <a href="#" class="select yellow darken-1 btn white-text" data-link="${
        item.tracks.href
      }">Select</a>
    </div>
  </div>
  </div>
  `;
    return (output.innerHTML = holder);
  }, "");

  // Function get Track List
  function getTracks() {
    //Append playlist name to modal header
    const modalTitle = document.querySelector("h4.title");
    const buttons = document.querySelectorAll("a.track");
    buttons.forEach(button => {
      button.addEventListener("click", e => {
        // Append Playlist name to modal title
        modalTitle.innerHTML = button.dataset.title;
        // Get the playlist url
        const url = button.dataset.link;
        const options = {
          headers: {
            Authorization: `Bearer ${_token}`
          }
        };
        // Fetch playlist url
        fetch(url, options)
          .then(response => response.json())
          .then(data => appendToModal(data));
      });
    });
  }
  getTracks();
  select();
};

// Function select playlist
function select() {
  const buttons = document.querySelectorAll(".select");
  buttons.forEach(button => {
    button.addEventListener("click", e => {
      const url = button.dataset.link;
      const options = {
        headers: {
          Authorization: `Bearer ${_token}`
        }
      };
      // Fetch playlist url
      fetch(url, options)
        .then(response => response.json())
        .then(data => saveToFirebase(data.items));
    });
  });
}

// Function save to firebase
function saveToFirebase(params) {
  // Loop data
  params.map(async (val, index) => {
    const { track } = val;
    const artistName = track.artists[0].name;
    const trackName = track.name;
    const releaseDate = track.album.release_date;
    const duration = msToMinutesSecond(track.duration_ms);
    const tempoId = track.id;
    const tempoResult = await tempo(`${tempoId}`);
    // console.log(
    //   `${tempoResult}${artistName}${trackName}${releaseDate}${duration}`
    // );
    const id = split(artistName, trackName);
    const obj = {
      artist: artistName,
      title: trackName,
      release: releaseDate,
      category: category(releaseDate),
      duration: duration,
      tempo: tempoResult
    };

    // Add data
    db.collection("playlist")
      .doc(id)
      .set(obj)
      .then(function() {
        console.log("Document successfully written!");
      })
      .catch(function(error) {
        console.error("Error writing document: ", error);
      });
  });
}

// Function append tracks to modal content
function appendToModal(params) {
  const rows = document.querySelector("tbody");
  const data = params.items;

  // Loop the data
  const rowsArr = data.map(async (val, index) => {
    const { track } = val;
    const trackName = track.name;
    const artistName = track.artists[0].name;
    // const href = track.artists[0].href;
    // const options = {
    //   headers: {
    //     Authorization: `Bearer ${_token}`
    //   }
    // };

    // fetch(href, options)
    //   .then(data => data.json())
    //   .then(res => console.log(res.genres));
    const releaseDate = track.album.release_date;
    const duration = track.duration_ms;
    const tempoId = track.id;
    const tempoResult = await tempo(`${tempoId}`);

    // Assign to html
    return `
    <tr>
      <td>${index + 1}</td>
      <td>${artistName}</td>
      <td>${truncate(`${trackName}`, 16)}</td>
      <td>${releaseDate}</td>
      <td>${category(`${releaseDate}`)}</td>
      <td>${msToMinutesSecond(`${duration}`)}</td>
      <td>${tempoResult}</td>
    </tr>
    `;
  });
  Promise.all(rowsArr).then(result => {
    // console.log(result);
    rows.innerHTML = result.join("");
  });
}

// Function to get tempo
async function tempo(params) {
  const url = `https://api.spotify.com/v1/audio-features/${params}`;
  const options = {
    headers: {
      Authorization: `Bearer ${_token}`
    }
  };
  const data = await fetch(url, options);
  const json = await data.json();
  const final = Math.round(json.tempo);
  // console.log(final)
  return `${final} BPM`;
}

// Function set category
function category(str) {
  const getYear = parseInt(str.substring(0, 4));
  const today = new Date();
  const year = today.getFullYear();
  const substract = year - getYear;

  let category = "";
  if (getYear === year) {
    return (category = "Top 40");
  }
  if (substract === 1) {
    category = "Current";
  } else if (substract >= 2 && substract < 10) {
    category = "Recurrent";
  } else {
    category = "Oldies";
  }
  return category;
}

// Function change ms to Minutes and second
function msToMinutesSecond(ms) {
  var minutes = Math.floor(ms / 60000);
  var seconds = ((ms % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

// Function truncate text
const truncate = (str, length) => {
  return str.length >= length ? `${str.substring(0, length)} ....` : str;
};

// Get Songs method
const song = document.querySelector("a.songs");
song.addEventListener("click", e => {
  // alert("Clicked");
  db.collection("playlist")
    .orderBy("artist")
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const id = doc.id;
        const {
          artist,
          title,
          release,
          category,
          duration,
          tempo
        } = doc.data();
        // doc.data() is never undefined for query doc snapshots
        console.log(`${artist} - ${title}`);
      });
    });
});

// function trim 'the'
function split(artist, title) {
  let finalID = [];
  let splitArtist = artist.split(" ");
  if (splitArtist[0] == "The" || splitArtist[0] == "A") {
    finalID.push(splitArtist[1]);
  } else {
    finalID.push(splitArtist[0]);
  }

  let splitTitle = title.split(" ");
  if (splitTitle[0] == "The" || splitTitle[0] == "A") {
    finalID.push(splitTitle[1]);
  } else {
    finalID.push(splitTitle[0]);
  }

  splitTitle.find(val => {
    if (val == "Live") {
      finalID.push(val);
    }
  });

  const result = finalID.join("-").toUpperCase();
  console.log(result);
  return result;
}

// Init modal
document.addEventListener("DOMContentLoaded", function() {
  var elems = document.querySelectorAll(".modal");
  var modal = M.Modal.init(elems, {
    endingTop: "50%",
    preventScrolling: false,
    inDuration: 500,
    outDuration: 600
  });

  var tabs = document.querySelectorAll(".tabs");
  var instance = M.Tabs.init(tabs, {
    duration: 750
  });
});
