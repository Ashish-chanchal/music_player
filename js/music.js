document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const audio = document.getElementById('audioElement');
    const songGrid = document.getElementById('songGrid');
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const songCountBadge = document.getElementById('songCountBadge');
    const visibleSongCount = document.getElementById('visibleSongCount');
    
    // Player Elements
    const vinylRecord = document.getElementById('vinylRecord');
    const currentCover = document.getElementById('currentCover');
    const currentTitle = document.getElementById('currentTitle');
    const currentArtist = document.getElementById('currentArtist');
    const currentAlbum = document.getElementById('currentAlbum');
    
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    
    const currentTimeEl = document.getElementById('currentTime');
    const durationTimeEl = document.getElementById('durationTime');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    
    const volumeBarContainer = document.getElementById('volumeBarContainer');
    const volumeBarFill = document.getElementById('volumeBarFill');
    const volumeIcon = document.getElementById('volumeIcon');
    
    // Hero Banner Elements
    const heroTitle = document.getElementById('heroTitle');
    const heroArtist = document.getElementById('heroArtist');
    const heroCover = document.getElementById('heroCover');
    const heroPlayBtn = document.getElementById('heroPlayBtn');
    const heroFavBtn = document.getElementById('heroFavBtn');
    
    // Nav & Sort Elements
    const navItems = document.querySelectorAll('.nav-item');
    const sortBtns = document.querySelectorAll('.sort-btn');

    // State Variables
    let songsData = [];
    let currentPlaylist = [];
    let currentIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let isRepeat = false;
    let favorites = JSON.parse(localStorage.getItem('aurasound_favs') || '[]');

    // Fetch Songs Data
    fetch('songsdata.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            initData(data);
        })
        .catch(err => {
            console.warn('Fetching songsdata.json failed (possibly file:// protocol), using embedded fallback database.', err);
            initData(getFallbackSongs());
        });

    function normalizeSong(song) {
        const rawName = song.name || song.title_song || song.title || '';
        let audioUrl = song.url || song.Song_url || '';
        
        // If audioUrl is empty, expired Google Drive link, or broken external link, fallback to local MP3
        if (!audioUrl || audioUrl.includes('drive.google.com') || audioUrl.includes('pagalfree.com')) {
            audioUrl = `music/${rawName}.mp3`;
        }

        let coverUrl = song.cover || song.image || '';
        if (!coverUrl || coverUrl.includes('drive.google.com') || !coverUrl.startsWith('http')) {
            coverUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80';
        }

        return {
            id: String(song.id || ''),
            title: song.title_song || song.title || song.name || 'Unknown Track',
            artist: song.artist_song || song.artist || 'Unknown Artist',
            album: song.album || 'Single',
            url: audioUrl,
            cover: coverUrl
        };
    }

    function initData(data) {
        songsData = (Array.isArray(data) ? data : []).map(normalizeSong);
        currentPlaylist = [...songsData];
        songCountBadge.textContent = `${songsData.length} Songs`;
        renderSongGrid(currentPlaylist);
        if (songsData.length > 0) {
            loadSong(0, false);
        }
    }

    function getFallbackSongs() {
        return [
            { "id": "1", "title": "Kesariya", "artist": "Arijit Singh", "album": "Brahmastra", "url": "music/Kesariya.mp3", "cover": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80" },
            { "id": "2", "title": "Deva Deva", "artist": "Pritam, Arijit Singh", "album": "Brahmastra", "url": "music/Deva Deva.mp3", "cover": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80" },
            { "id": "3", "title": "Dance Ka Bhoot", "artist": "Arijit Singh", "album": "Brahmastra", "url": "music/Dance Ka Bhoot.mp3", "cover": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80" },
            { "id": "4", "title": "Rasiya", "artist": "Shreya Ghoshal, Tushar Joshi", "album": "Brahmastra", "url": "music/Rasiya.mp3", "cover": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80" },
            { "id": "5", "title": "Thumkeshwari", "artist": "Sachin-Jigar, Rashmeet Kaur", "album": "Bhediya", "url": "music/Thumkeshwari.mp3", "cover": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80" },
            { "id": "6", "title": "Apna Bana Le", "artist": "Arijit Singh, Sachin-Jigar", "album": "Bhediya", "url": "music/Apna Bana Le.mp3", "cover": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80" },
            { "id": "7", "title": "Manike", "artist": "Yohani, Jubin Nautiyal", "album": "Thank God", "url": "music/Manike.mp3", "cover": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80" },
            { "id": "8", "title": "Haaniya Ve", "artist": "Jubin Nautiyal", "album": "Taaj", "url": "music/Haaniya Ve.mp3", "cover": "https://images.unsplash.com/photo-1445985543470-41fba5c3144a?w=500&auto=format&fit=crop&q=80" },
            { "id": "9", "title": "Dil De Diya", "artist": "Rochak Kohli", "album": "Single", "url": "music/Dil De Diya.mp3", "cover": "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=500&auto=format&fit=crop&q=80" },
            { "id": "10", "title": "Sound of Jai Shree Ram", "artist": "Vikram Montrose", "album": "Ram Setu", "url": "music/Jai Shree Ram.mp3", "cover": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80" },
            { "id": "11", "title": "Jai Shree Ram", "artist": "Vikram Montrose", "album": "Ram Setu", "url": "music/Jai Shree Ram.mp3", "cover": "https://images.unsplash.com/photo-1567942712661-82b9b407abbf?w=500&auto=format&fit=crop&q=80" },
            { "id": "12", "title": "Maarkhayegaa", "artist": "Farhad Bhiwandiwala", "album": "Bachchhan Paandey", "url": "music/Maarkhayegaa.mp3", "cover": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&auto=format&fit=crop&q=80" },
            { "id": "13", "title": "Meri Jaan Meri Jaan", "artist": "B Praak", "album": "Bachchhan Paandey", "url": "music/Meri Jaan Meri Jaan.mp3", "cover": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80" },
            { "id": "14", "title": "Saare Bolo Bewafa", "artist": "B Praak, Jaani", "album": "Bachchhan Paandey", "url": "music/Saare Bolo Bewafa.mp3", "cover": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=80" },
            { "id": "15", "title": "Heer Raanjhana", "artist": "Arijit Singh, Shreya Ghoshal", "album": "Bachchhan Paandey", "url": "music/Heer Raanjhana.mp3", "cover": "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=500&auto=format&fit=crop&q=80" },
            { "id": "16", "title": "Raataan Lambiyan", "artist": "Jubin Nautiyal, Asees Kaur", "album": "Shershaah", "url": "music/Raataan Lambiyan.mp3", "cover": "https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=500&auto=format&fit=crop&q=80" },
            { "id": "17", "title": "Ranjha", "artist": "Jasleen Royal, B Praak", "album": "Shershaah", "url": "music/Ranjha.mp3", "cover": "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&auto=format&fit=crop&q=80" },
            { "id": "18", "title": "Jaihind Ki Senaa", "artist": "Vikram Montrose", "album": "Shershaah", "url": "music/Jaihind Ki Senaa.mp3", "cover": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80" },
            { "id": "19", "title": "Mann Bharryaa 2.0", "artist": "B Praak", "album": "Shershaah", "url": "music/Mann Bharryaa 2.0.mp3", "cover": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&auto=format&fit=crop&q=80" },
            { "id": "20", "title": "Kabhii Tumhhe", "artist": "Darshan Raval, Javed-Mohsin", "album": "Shershaah", "url": "music/Kabhii Tumhhe.mp3", "cover": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&auto=format&fit=crop&q=80" }
        ];
    }

    // Render Songs in Grid
    function renderSongGrid(songs) {
        songGrid.innerHTML = '';
        visibleSongCount.textContent = songs.length;

        if (songs.length === 0) {
            songGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fa-solid fa-compact-disc" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>No songs found matching your search.</p>
                </div>
            `;
            return;
        }

        songs.forEach((song, index) => {
            const isFav = favorites.includes(song.id);
            const isCurrentPlaying = songsData[currentIndex] && songsData[currentIndex].id === song.id;

            const card = document.createElement('div');
            card.className = `song-card ${isCurrentPlaying ? 'playing' : ''}`;
            card.dataset.id = song.id;

            card.innerHTML = `
                <div class="card-img-wrap">
                    <img src="${song.cover}" alt="${song.title}" loading="lazy">
                    <div class="play-overlay">
                        <div class="play-overlay-btn">
                            <i class="fa-solid ${isCurrentPlaying && isPlaying ? 'fa-pause' : 'fa-play'}"></i>
                        </div>
                    </div>
                    <button class="fav-card-btn ${isFav ? 'active' : ''}" data-id="${song.id}">
                        <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
                    </button>
                </div>
                <div class="card-info">
                    <span class="card-title">${song.title}</span>
                    <span class="card-artist">${song.artist}</span>
                </div>
            `;

            // Card Click to Play
            card.addEventListener('click', (e) => {
                if (e.target.closest('.fav-card-btn')) return; // Ignore if clicking favorite button
                
                const targetIndex = songsData.findIndex(s => s.id === song.id);
                if (targetIndex !== -1) {
                    if (currentIndex === targetIndex) {
                        togglePlay();
                    } else {
                        loadSong(targetIndex, true);
                    }
                }
            });

            // Favorite Toggle inside Card
            const favBtn = card.querySelector('.fav-card-btn');
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(song.id);
            });

            songGrid.appendChild(card);
        });
    }

    // Load Song Details into Player
    function loadSong(index, shouldPlay = true) {
        if (index < 0 || index >= songsData.length) return;
        
        currentIndex = index;
        const song = songsData[currentIndex];

        // Pause existing playback and reset currentTime
        audio.pause();
        audio.currentTime = 0;
        audio.src = song.url;
        audio.load();

        currentTitle.textContent = song.title;
        currentArtist.textContent = song.artist;
        currentAlbum.textContent = song.album || 'Single';
        currentCover.src = song.cover;

        // Update Hero Spotlight Banner
        heroTitle.textContent = song.title;
        heroArtist.textContent = `${song.artist} • ${song.album || 'Single'}`;
        heroCover.src = song.cover;
        
        updateFavoriteButtonState(song.id);

        if (shouldPlay) {
            playAudio();
        } else {
            pauseAudio();
        }

        // Highlight Active Card
        document.querySelectorAll('.song-card').forEach(card => {
            const isThis = card.dataset.id === song.id;
            card.classList.toggle('playing', isThis);
            const icon = card.querySelector('.play-overlay-btn i');
            if (icon) {
                icon.className = `fa-solid ${isThis && isPlaying ? 'fa-pause' : 'fa-play'}`;
            }
        });
    }

    // Play/Pause Controls
    function playAudio() {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                playPauseBtn.querySelector('i').className = 'fa-solid fa-pause';
                vinylRecord.classList.add('spinning');
                updateActiveCardPlayIcon(true);
            }).catch(err => {
                console.warn('Playback failed or blocked by browser policy:', err);
                pauseAudio();
            });
        }
    }

    function pauseAudio() {
        audio.pause();
        isPlaying = false;
        playPauseBtn.querySelector('i').className = 'fa-solid fa-play';
        vinylRecord.classList.remove('spinning');
        updateActiveCardPlayIcon(false);
    }

    function togglePlay() {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    }

    function updateActiveCardPlayIcon(playing) {
        const activeCard = document.querySelector('.song-card.playing');
        if (activeCard) {
            const icon = activeCard.querySelector('.play-overlay-btn i');
            if (icon) {
                icon.className = `fa-solid ${playing ? 'fa-pause' : 'fa-play'}`;
            }
        }
    }

    // Previous / Next Logic
    function playNextSong() {
        const activeList = currentPlaylist.length > 0 ? currentPlaylist : songsData;
        if (activeList.length === 0) return;

        if (isShuffle) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * activeList.length);
            } while (randomIndex === currentIndex && activeList.length > 1);
            loadSongByPlaylistIndex(randomIndex, true);
        } else {
            const currentSong = songsData[currentIndex];
            let currentListIdx = activeList.findIndex(s => s.id === (currentSong ? currentSong.id : ''));
            if (currentListIdx === -1) currentListIdx = 0;
            const nextListIdx = (currentListIdx + 1) % activeList.length;
            loadSongByPlaylistIndex(nextListIdx, true);
        }
    }

    function playPrevSong() {
        const activeList = currentPlaylist.length > 0 ? currentPlaylist : songsData;
        if (activeList.length === 0) return;

        const currentSong = songsData[currentIndex];
        let currentListIdx = activeList.findIndex(s => s.id === (currentSong ? currentSong.id : ''));
        if (currentListIdx === -1) currentListIdx = 0;
        const prevListIdx = (currentListIdx - 1 + activeList.length) % activeList.length;
        loadSongByPlaylistIndex(prevListIdx, true);
    }

    function loadSongByPlaylistIndex(playlistIdx, shouldPlay = true) {
        const activeList = currentPlaylist.length > 0 ? currentPlaylist : songsData;
        const targetSong = activeList[playlistIdx];
        if (!targetSong) return;

        const mainIndex = songsData.findIndex(s => s.id === targetSong.id);
        if (mainIndex !== -1) {
            loadSong(mainIndex, shouldPlay);
        }
    }

    // Toggle Favorites
    function toggleFavorite(songId) {
        if (favorites.includes(songId)) {
            favorites = favorites.filter(id => id !== songId);
        } else {
            favorites.push(songId);
        }
        localStorage.setItem('aurasound_favs', JSON.stringify(favorites));

        // Re-render current filter if favorites view is active
        const activeFilter = document.querySelector('.nav-item.active').dataset.filter;
        if (activeFilter === 'fav') {
            filterSongs('fav');
        } else {
            renderSongGrid(currentPlaylist);
        }
        
        if (songsData[currentIndex]) {
            updateFavoriteButtonState(songsData[currentIndex].id);
        }
    }

    function updateFavoriteButtonState(songId) {
        const isFav = favorites.includes(songId);
        heroFavBtn.querySelector('i').className = `fa-${isFav ? 'solid' : 'regular'} fa-heart`;
        if (isFav) {
            heroFavBtn.style.color = '#ec4899';
        } else {
            heroFavBtn.style.color = 'var(--text-primary)';
        }
    }

    // Audio Event Listeners (Time & Progress)
    audio.addEventListener('timeupdate', () => {
        if (!isNaN(audio.duration)) {
            const progressPercent = (audio.currentTime / audio.duration) * 100;
            progressBarFill.style.width = `${progressPercent}%`;

            currentTimeEl.textContent = formatTime(audio.currentTime);
            durationTimeEl.textContent = formatTime(audio.duration);
        }
    });

    audio.addEventListener('ended', () => {
        if (isRepeat) {
            audio.currentTime = 0;
            playAudio();
        } else {
            playNextSong();
        }
    });

    // Progress Bar Seek
    progressBarContainer.addEventListener('click', (e) => {
        const width = progressBarContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        if (duration) {
            audio.currentTime = (clickX / width) * duration;
        }
    });

    // Volume Bar
    volumeBarContainer.addEventListener('click', (e) => {
        const width = volumeBarContainer.clientWidth;
        const clickX = e.offsetX;
        const newVolume = Math.max(0, Math.min(1, clickX / width));
        audio.volume = newVolume;
        volumeBarFill.style.width = `${newVolume * 100}%`;
        
        if (newVolume === 0) {
            volumeIcon.className = 'fa-solid fa-volume-xmark';
        } else if (newVolume < 0.5) {
            volumeIcon.className = 'fa-solid fa-volume-low';
        } else {
            volumeIcon.className = 'fa-solid fa-volume-high';
        }
    });

    // Event Listeners for Player Buttons
    playPauseBtn.addEventListener('click', togglePlay);
    nextBtn.addEventListener('click', playNextSong);
    prevBtn.addEventListener('click', playPrevSong);
    heroPlayBtn.addEventListener('click', () => {
        if (songsData.length > 0) togglePlay();
    });
    heroFavBtn.addEventListener('click', () => {
        if (songsData[currentIndex]) toggleFavorite(songsData[currentIndex].id);
    });

    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
    });

    repeatBtn.addEventListener('click', () => {
        isRepeat = !isRepeat;
        repeatBtn.classList.toggle('active', isRepeat);
    });

    // Search Input Filtering
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        clearSearch.style.display = query ? 'block' : 'none';

        currentPlaylist = songsData.filter(song => 
            song.title.toLowerCase().includes(query) ||
            song.artist.toLowerCase().includes(query) ||
            (song.album && song.album.toLowerCase().includes(query))
        );
        renderSongGrid(currentPlaylist);
    });

    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        clearSearch.style.display = 'none';
        currentPlaylist = [...songsData];
        renderSongGrid(currentPlaylist);
    });

    // Navigation Category Filtering
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const filter = item.dataset.filter;
            filterSongs(filter);
        });
    });

    function filterSongs(filter) {
        if (filter === 'fav') {
            currentPlaylist = songsData.filter(s => favorites.includes(s.id));
        } else if (filter === 'bollywood') {
            currentPlaylist = songsData.filter(s => Number(s.id) <= 21);
        } else if (filter === 'global') {
            currentPlaylist = songsData.filter(s => Number(s.id) > 21);
        } else {
            currentPlaylist = [...songsData];
        }
        renderSongGrid(currentPlaylist);
    }

    // Sorting
    sortBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sortBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const sortType = btn.dataset.sort;
            if (sortType === 'title') {
                currentPlaylist.sort((a, b) => a.title.localeCompare(b.title));
            } else if (sortType === 'artist') {
                currentPlaylist.sort((a, b) => a.artist.localeCompare(b.artist));
            } else {
                currentPlaylist = [...songsData];
            }
            renderSongGrid(currentPlaylist);
        });
    });

    // Helper Utility Function
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
});