import React, { Component } from "react";
import Global from "../../Global/Global";
import axios from "axios";
import './Playlist.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faLockOpen, faHeart } from '@fortawesome/free-solid-svg-icons';
import Header from "../header/Header";
import { Navigate } from "react-router-dom";
import { getRefreshedAccesToken } from "../../utils";


import { faSearch } from '@fortawesome/free-solid-svg-icons';

export default class Playlists extends Component {
  access_token = localStorage.getItem('access_token');
  nombreUsuario = localStorage.getItem('user_id');
    
  state = {
    playlists: [],
    playlistsPublicas: [],
    playlistsPrivadas: [],
    playlistsSeguidas: [],
    searchArtist: "",
    searchGenre: "",
    filteredSongs: [],
    statusPlay: false,
    statusLoading: false,
    total: 0,
    songs: [],
    songsText: [],
    statusSong: false,
    imgP: "",
    nombreP: "",
    nombreUsuario: "",
    currentTrackId: null // ✅ Canción seleccionada para el reproductor
  };
  

  headers = {
    headers: {
      "Authorization": "Bearer " + this.access_token
    }
  };
  componentDidMount = () => {
    this.getUsuario();
    getRefreshedAccesToken();
  };
  

  setCurrentTrack = (trackId) => {
    this.setState({ currentTrackId: trackId });
  };
  


  getUsuario = () => {
    axios.get("https://api.spotify.com/v1/me", this.headers)
      .then(response => {
        console.log("👤 Usuario autenticado:", response.data.id);
  
        // 🔥 Asegurar que `nombreUsuario` se actualiza antes de llamar a `getListas()`
        this.setState({ nombreUsuario: response.data.id }, () => {
          console.log("✅ nombreUsuario actualizado:", this.state.nombreUsuario);
          this.getListas(); // Ahora solo se ejecuta después de que el usuario esté definido
        });
      })
      .catch(error => console.error("❌ Error obteniendo usuario:", error));
  };
  
  getListas = () => {
    axios.get(`https://api.spotify.com/v1/me/playlists?limit=${Global.playlistLimit}`, this.headers)
      .then(response => {
        const playlists = response.data.items;
        console.log("🎵 Todas las playlists recibidas:", playlists);
  
        playlists.forEach(p => {
          console.log(`🎼 Playlist: ${p.name} | Dueño: ${p.owner.id}`);
        });
  
        const publicas = playlists.filter(p => p.public === true);
        const privadas = playlists.filter(p => p.public === false && p.owner.id === this.state.nombreUsuario);
        const seguidas = playlists.filter(p => p.owner.id !== this.state.nombreUsuario // 🔥 Asegurar que las seguidas se capturen
        );
  
        console.log("🔓 Playlists públicas:", publicas);
        console.log("🔒 Playlists privadas:", privadas);
        console.log("❤️ Playlists seguidas:", seguidas);
  
        this.setState({
          playlists,
          playlistsPublicas: publicas,
          playlistsPrivadas: privadas,
          playlistsSeguidas: seguidas, 
          totalListas: playlists.length,
          statusPlay: true
        }, () => {
          console.log("📌 Estado actualizado de playlists seguidas (React):", this.state.playlistsSeguidas);
        });
      })
      .catch(error => console.error("❌ Error al obtener playlists:", error));
  };
  getCanciones = async (playlist) => {
    const id = playlist.id;
    const total = playlist.tracks.total;
  
    this.setState({ statusSong: false, statusLoading: true });
  
    if (total !== 0) {
      this.setState({ imgP: playlist.images[0].url, nombreP: playlist.name });
  
      try {
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=${Global.songLimit}`, this.headers);
        const datos = response.data.items;
  
        if (!datos || datos.length === 0) {
          console.warn("⚠️ No hay canciones en la playlist.");
          this.setState({ songs: [], songsText: [], statusSong: true, statusLoading: false });
          return;
        }
  
        const canciones = datos.map(item => ({
          id: item.track?.id,
          image: item.track?.album.images.length > 0 ? item.track.album.images[0].url : "",
          name: item.track?.name,
          artists: item.track?.artists.map(a => a.name),
          album: item.track?.album.name,
          duration: `${Math.floor(item.track?.duration_ms / 60000)}:${("0" + Math.floor((item.track?.duration_ms / 1000) % 60)).slice(-2)}`
        })).filter(song => song.id);
  
        this.setState({ songs: canciones, songsText: canciones, filteredSongs: canciones, statusSong: true, statusLoading: false });
  
      } catch (error) {
        if (error.response && error.response.status === 429) {
          console.warn("⚠️ Demasiadas solicitudes. Esperando 10 segundos para reintentar...");
          setTimeout(() => this.getCanciones(playlist), 10000);
        } else {
          console.error("❌ Error obteniendo canciones:", error);
        }
      }
    }
  };
  




handleSearchArtist = () => {
  const searchQuery = this.state.searchArtist.trim();
  if (!searchQuery) return;

  console.log("🔍 Buscando en Spotify:", searchQuery);

  axios.get(`https://api.spotify.com/v1/search?q=${searchQuery}&type=artist&limit=10`, this.headers)
      .then(response => {
          const artists = response.data.artists.items; // Extrae los artistas encontrados
          console.log("🎤 Artistas encontrados:", artists);

          if (artists.length === 0) {
              console.warn("⚠️ No se encontraron artistas en Spotify.");
              this.setState({ filteredSongs: [] });
              return;
          }

          // Muestra los artistas en la interfaz
          this.setState({ searchedArtists: artists });
      })
      .catch(error => console.error("❌ Error buscando artista en Spotify:", error));
};




getTrackPreview = (trackId) => {
  axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, this.headers)
      .then(response => {
          console.log("🎵 Detalles de la canción:", response.data);
          return response.data.preview_url || null;
      })
      .catch(error => console.error("❌ Error obteniendo detalles de la canción:", error));
};

playPreview = (previewUrl) => {
  if (!previewUrl) {
    alert("⚠️ No hay vista previa disponible para esta canción.");
    return;
  }

  // Detener el audio anterior si ya hay uno en reproducción
  if (this.currentAudio) {
    this.currentAudio.pause();
    this.currentAudio = null;
  }

  // Crear y reproducir el nuevo audio
  this.currentAudio = new Audio(previewUrl);
  this.currentAudio.play().catch(error => {
    console.error("❌ Error al reproducir el audio:", error);
    alert("⚠️ No se pudo reproducir la canción. Intenta hacer clic nuevamente.");
  });

  // Detener automáticamente después de 30 segundos (seguridad)
  setTimeout(() => {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }, 30000);
};


getSongsByArtist = async (artistId) => {
  console.log(`🔍 Buscando canciones del artista: ${artistId}`);

  // Esperar 500 ms entre cada solicitud para evitar bloqueo (throttling)
  await new Promise(resolve => setTimeout(resolve, 500));

  axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, this.headers)
    .then(response => {
      const songs = response.data.tracks;
      console.log("🎵 Canciones del artista:", songs);

      if (songs.length === 0) {
        console.warn("⚠️ No se encontraron canciones para este artista.");
        this.setState({ filteredSongs: [] });
        return;
      }

      const formattedSongs = songs.map(song => ({
        id: song.id,
        image: song.album.images.length > 0 ? song.album.images[0].url : "",
        name: song.name,
        artists: song.artists.map(a => a.name),
        album: song.album.name,
        duration: `${Math.floor(song.duration_ms / 60000)}:${("0" + Math.floor((song.duration_ms / 1000) % 60)).slice(-2)}`,
        preview_url: song.preview_url || null
      }));

      console.log("✅ Canciones con preview_url:", formattedSongs.filter(song => song.preview_url));

      this.setState({ filteredSongs: formattedSongs });
    })
    .catch(error => console.error("❌ Error obteniendo canciones del artista:", error));
};




render()  
{
  if (!this.access_token) {
    return (<Navigate to="/" />);
  }

  return (
    <div>
      <Header seleccion="playlists" />
      <div className="general">
        <div className="playlists row mx-lg-5 mx-3">
          <div className="datosPlaylist col-sm-12 col-md-3 col-lg-3 p-0">
            <div className="totalPlaylists">
              <h1 className="numeroListas">PLAYLISTS: {this.state.totalListas}</h1>
            </div>
            <div className="search-section">
              <input
                type="text"
                placeholder="Buscar por artista..."
                value={this.state.searchArtist || ""}
                onChange={(e) => this.setState({ searchArtist: e.target.value })}
              />
              <button onClick={this.handleSearchArtist}>
                <FontAwesomeIcon icon={faSearch} /> Buscar Artista
              </button>
            </div>

            {/* 🔍 SECCIÓN PARA MOSTRAR ARTISTAS ENCONTRADOS */}
            <div className="search-results">
              {this.state.searchedArtists && this.state.searchedArtists.length > 0 && (
                <div>
                  <h3>Resultados de búsqueda:</h3>
                  <ul>
                    {this.state.searchedArtists.map(artist => (
                      <li key={artist.id}>
                        <img src={artist.images.length > 0 ? artist.images[0].url : "https://via.placeholder.com/50"} alt={artist.name} width="50" />
                        {artist.name}
                        <button onClick={() => this.getSongsByArtist(artist.id)}>Ver Canciones</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="listas">
              <details>
                <summary><FontAwesomeIcon icon={faLockOpen} className="mx-2 icon" />Publicas</summary>
                {this.state.playlistsPublicas.map((playlist, index) => (
                  <button key={playlist.id + index} onClick={() => this.getCanciones(playlist)} className="btnPlist">
                    {playlist.name || "Sin Nombre"}
                  </button>
                ))}
              </details>
              <details>
                <summary><FontAwesomeIcon icon={faLock} className="mx-2 icon" />Privadas</summary>
                {this.state.playlistsPrivadas.map((playlist, index) => (
                  <button key={playlist.id + index} onClick={() => this.getCanciones(playlist)} className="btnPlist">
                    {playlist.name || "Sin Nombre"}
                  </button>
                ))}
              </details>
              <details>
                <summary><FontAwesomeIcon icon={faHeart} className="mx-2 icon" />Seguidas</summary>
                {this.state.playlistsSeguidas.map((playlist, index) => (
                  <button key={`${playlist.id}-${index}`} onClick={() => this.getCanciones(playlist)} className="btnPlist">
                    {playlist.name || "Sin Nombre"}
                  </button>
                ))}
              </details>
            </div>
          </div>

          {this.state.statusSong ? (
  <div className="canciones p-0 col-sm-12 col-md-9 col-lg-9">
    <div className="infoLista">
      <img className="imgLista" src={this.state.imgP} alt="" />
      <h3 className="nombrePlaylist">{this.state.nombreP}</h3>
    </div>
    
    <div className="divTablaCanciones">
      <table className="tablaCanciones">
        <thead>
          <tr>
            <th>#</th><th>NOMBRE</th><th>ARTISTA</th><th>ÁLBUM</th><th>DURACIÓN</th><th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {this.state.filteredSongs.length > 0 ? (
            this.state.filteredSongs.map((song, index) => (
              <tr key={`${song.id}-${index}`} style={{ backgroundColor: song.preview_url ? "#d4edda" : "transparent" }}>
                <td className="numeroCancion">{index + 1}</td>
                <td className="nombreCancion">
                  <a href={song.image} target="_blank" rel="noopener noreferrer">
                    <img className="imagenCancion" alt={song.name} src={song.image || "https://via.placeholder.com/50"} />
                  </a>
                  <span className="nombreEspecial">{song.name}</span>
                </td>
                <td className="artistaCancion"><span>{song.artists.join(", ")}</span></td>
                <td className="albumCancion"><span>{song.album}</span></td>
                <td className="duracionCancion">{song.duration}</td>
                <td>
                  <button onClick={() => this.setCurrentTrack(song.id)}>🎵 Reproducir</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No hay canciones en esta playlist</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* 🎵 SPOTIFY EMBED PLAYER (Reproductor único) */}
    {this.state.currentTrackId && (
      <div className="spotify-player">
        <iframe 
          src={`https://open.spotify.com/embed/track/${this.state.currentTrackId}`} 
          width="100%" 
          height="80" 
          frameBorder="0" 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          title="Spotify Player"
        ></iframe>
      </div>
    )}

  </div>
) : <div className="noSongs"><h1>NO HAS SELECCIONADO UNA PLAYLIST</h1></div>}


        </div>
      </div>
    </div>
  );
}

}
