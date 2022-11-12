const music = document.querySelector('audio');
const img = document.querySelector('img');
const play = document.getElementById('play');
const title = document.getElementById('title');
const artist = document.getElementById('artist');
const prew = document.getElementById('prew');
const next = document.getElementById('next');
const myvideo = document.getElementById('myVideo');
// console.log(myvideo);
// fetch('songsdata.json')
//     .then(response => response.json())
//     .then(data => {
//         console.log(data) // Prints result from `response.json()` in getRequest
//     })
// const songs = [{
//     name: "music1",
//     title: "Song name",
//     artist: "Artist name",
// },
// {
//     name: "music2",
//     title: "Song name",
//     artist: "Artist name",
// },
// {
//     name: "music3",
//     title: "Song name",
//     artist: "Artist name",
// }]
const songs = [{
    artist: "Arijit Singh",
    id: "1",
    name: "Kesariya",
    image: "https://cdn.bollywoodmdb.com/fit-in/movies/largethumb/2017/dragon/poster.jpg",
    title: "Kesariya",
},
{
    id: "2",
    name: "Deva Deva",
    title: "Deva Deva",
    artist: "Pritam, Arijit Singh",
    image: "https://cdn.bollywoodmdb.com/fit-in/movies/largethumb/2017/dragon/poster.jpg"
},
{
    artist: "Arijit Singh",
    id: "3",
    image: "https://cdn.bollywoodmdb.com/fit-in/movies/largethumb/2017/dragon/poster.jpg",
    name: "Dance Ka Bhoot",
    title: "Dance Ka Bhoot"
},
{
    id: "4",
    name: "Rasiya",
    title: "Rasiya",
    artist: "Shreya Ghoshal",
    image: "https://cdn.bollywoodmdb.com/fit-in/movies/largethumb/2017/dragon/poster.jpg",

},
{
    id: "5",
    name: "Thumkeshwari",
    title: "Thumkeshwari",
    artist: "Sachin-Jigar",
    image: "https://stat1.bollywoodhungama.in/wp-content/uploads/2022/10/Varun-Dhawan-turns-into-a-werewolf-in-first-ensemble-poster-of-Bhediya.jpg"
},
{
    id: "7",
    name: "Manike",
    title: "Manike",
    artist: "Yohani, Jubin Nautiyal,",
    image: "https://stat1.bollywoodhungama.in/wp-content/uploads/2022/10/Varun-Dhawan-turns-into-a-werewolf-in-first-ensemble-poster-of-Bhediya.jpg"
},
{
    id: "8",
    name: "Haaniya Ve",
    title: "Haaniya Ve",
    artist: "Jubin Nautiyal,",
    image: "https://stat1.bollywoodhungama.in/wp-content/uploads/2022/10/Varun-Dhawan-turns-into-a-werewolf-in-first-ensemble-poster-of-Bhediya.jpg"
},
{
    id: "9",
    name: "Dil De Diya",
    title: "Dil De Diya",
    artist: "Rochak Kohlhi",
    image: "https://stat1.bollywoodhungama.in/wp-content/uploads/2022/10/Varun-Dhawan-turns-into-a-werewolf-in-first-ensemble-poster-of-Bhediya.jpg"
},
{
    id: "10",
    name: "Raataan Lambiyan",
    title: "Raataan Lambiyan",
    artist: "Asees Kaur Jubin Nautiyal,",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAq_oU9csuAlwv2i5B3dp4M3vcIR_BkA8NEg&usqp=CAU"
},
{
    id: "10",
    name: "Raataan Lambiyan",
    title: "Raataan Lambiyan",
    artist: "Asees Kaur Jubin Nautiyal,",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAq_oU9csuAlwv2i5B3dp4M3vcIR_BkA8NEg&usqp=CAU"
},
{
    id: "10",
    name: "Raataan Lambiyan",
    title: "Raataan Lambiyan",
    artist: "Asees Kaur Jubin Nautiyal,",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAq_oU9csuAlwv2i5B3dp4M3vcIR_BkA8NEg&usqp=CAU"
},
{
    id: "10",
    name: "Raataan Lambiyan",
    title: "Raataan Lambiyan",
    artist: "Asees Kaur Jubin Nautiyal,",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAq_oU9csuAlwv2i5B3dp4M3vcIR_BkA8NEg&usqp=CAU"
},
{
    id: "10",
    name: "Raataan Lambiyan",
    title: "Raataan Lambiyan",
    artist: "Asees Kaur Jubin Nautiyal,",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAq_oU9csuAlwv2i5B3dp4M3vcIR_BkA8NEg&usqp=CAU"
},
{
    id: "10",
    name: "Raataan Lambiyan",
    title: "Raataan Lambiyan",
    artist: "Asees Kaur Jubin Nautiyal,",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAq_oU9csuAlwv2i5B3dp4M3vcIR_BkA8NEg&usqp=CAU"
},
{
    id: "10",
    name: "Raataan Lambiyan",
    title: "Raataan Lambiyan",
    artist: "Asees Kaur Jubin Nautiyal,",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAq_oU9csuAlwv2i5B3dp4M3vcIR_BkA8NEg&usqp=CAU"
},
{
    id: "10",
    name: "Raataan Lambiyan",
    title: "Raataan Lambiyan",
    artist: "Asees Kaur Jubin Nautiyal,",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAq_oU9csuAlwv2i5B3dp4M3vcIR_BkA8NEg&usqp=CAU"
},
{
    id: "10",
    name: "Raataan Lambiyan",
    title: "Raataan Lambiyan",
    artist: "Asees Kaur Jubin Nautiyal,",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAq_oU9csuAlwv2i5B3dp4M3vcIR_BkA8NEg&usqp=CAU"
},
{
    id: "10",
    name: "Raataan Lambiyan",
    title: "Raataan Lambiyan",
    artist: "Asees Kaur Jubin Nautiyal,",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAq_oU9csuAlwv2i5B3dp4M3vcIR_BkA8NEg&usqp=CAU"
},
{
    id: "10",
    name: "Raataan Lambiyan",
    title: "Raataan Lambiyan",
    artist: "Asees Kaur Jubin Nautiyal,",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAq_oU9csuAlwv2i5B3dp4M3vcIR_BkA8NEg&usqp=CAU"
}

]
let isPlaying = false;
const playMusic = () => {
    music.play();
    play.classList.replace('fa-play', 'fa-pause');
    img.classList.add('anime');
    myvideo.play();

    isPlaying = true;
}
const pauseMusic = () => {
    music.pause();
    play.classList.replace('fa-pause', 'fa-play');
    img.classList.remove('anime');
    myvideo.pause();
    isPlaying = false;
}
play.addEventListener('click', () => {
    if (!isPlaying) {
        playMusic();
    }
    else {
        pauseMusic();
    }
});

// change in data
const loadSong = (songs) => {
    title.textContent = songs.title;
    artist.textContent = songs.artist;
    music.src = "music/" + songs.name + ".mp3";
    img.src = songs.image;
};
songIndex = 0;
//loadSong(songs[2]);

const nextSong = () => {
    songIndex = (songIndex + 1) % songs.length;
    loadSong(songs[songIndex]);
    playMusic();
}
const prewSong = () => {
    songIndex = (songIndex - 1 + songs.length) % songs.length;
    loadSong(songs[songIndex]);
    playMusic();
}
next.addEventListener('click', nextSong);
prew.addEventListener('click', prewSong);