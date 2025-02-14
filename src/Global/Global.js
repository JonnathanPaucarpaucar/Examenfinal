var Global = {
	playlistLimit: 50,
	songLimit: 100,
	access_token: localStorage.getItem('BQBFHyH0Dp54Uai5HMP1YbWyxP2po1k-l1F_OsnwCNn7FWVjPeU5mWrHwIp3dGWJNNtI3J-7EZQCdJAoAVheFhymS1lw__qRPSIDjOaEOzMb91c4GyTAxPsXyO3gMOWgMH1xR9Xfw2Z31nVI7zM73WZX4XJ3sZYqIm9ibyICxSye6h5-WIK6DS6dEN0upYW92anYTWI3IMtcgu5kd9At2ZBl7s6GlMy8T_qTpNpzpKXrX1PBpLkxKTNIkgbcZat5F13GbNbu2w') || "",  // Cargar el token si existe
	refresh_token: localStorage.getItem('refresh_token') || "",
	redirect_uri : "http://localhost:3000/callback",
	client_id : "c98a6dcbfcc44297b69b3da2de0e7f24",
	client_secret : "e44c50ccb15d410eb84e48adfd519b11",
	scopes: "user-read-private user-read-email playlist-read-private playlist-read-collaborative"

}

export default Global;
