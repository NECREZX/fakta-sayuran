import {
	getCameraErrorMessage,
	logError
} from '../core/utils.js';

class CameraService {
	constructor() {
		this.stream = null;
		this.video = null;
		this.canvas = null;
		this.config = null;

		this.initializeElements();
		this.init();
	}

	// TODO [Basic] Implementasikan metode untuk menginisialisasi elemen DOM yang diperlukan
	initializeElements() {
		this.video = document.getElementById('videoElement');
		this.canvas = document.getElementById('canvasElement');
	}

	async init() {
		await this.loadCameras();
	}

	// TODO [Basic] Implementasikan metode untuk memuat daftar kamera yang tersedia
	async loadCameras() {
		try {
			const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
			const devices = await navigator.mediaDevices.enumerateDevices();
			
			// Hentikan stream sementara agar kamera tidak terkunci
			tempStream.getTracks().forEach(track => track.stop());

			const videoDevices = devices.filter(device => device.kind === 'videoinput');
			if (videoDevices.length === 0) {
				throw new Error('Tidak ada kamera ditemukan pada perangkat ini.');
			}
		} catch (error) {
			logError('Gagal memuat kamera', error);
			throw new Error(`Akses kamera gagal: ${error.message}`);
		}
	}

	// TODO [Basic] Implementasikan metode untuk memulai kamera dengan constraints yang sesuai
	async startCamera(facingMode = 'environment') {
		try {
			if (this.stream) {
				this.stopCamera();
			}
			const constraints = {
				video: {
					facingMode: facingMode,
					width: { ideal: 1280 },
					height: { ideal: 720 }
				},
				audio: false
			};
			this.stream = await navigator.mediaDevices.getUserMedia(constraints);
			this.video.srcObject = this.stream;
			
			return new Promise((resolve) => {
				this.video.onloadedmetadata = () => {
					this.video.play();
					resolve();
				};
			});
		} catch (error) {
			logError('Gagal memulai kamera', error);
			const errorMessage = getCameraErrorMessage(error);
			throw new Error(errorMessage);
		}
	}

	// TODO [Basic] Implementasikan metode untuk menghentikan kamera
	stopCamera() {
		if (this.stream) {
			this.stream.getTracks().forEach(track => track.stop());
			this.stream = null;
		}
		if (this.video) {
			this.video.srcObject = null;
		}
	}

	// TODO [Skilled] Implementasikan metode untuk mengatur FPS kamera
	setFPS(fps) {}

	// TODO [Basic] Periksa apakah kamera sedang aktif
	isActive() {
		return this.stream !== null && this.stream.active;
	}

	// TODO [Basic] Periksa apakah kamera siap untuk digunakan
	isReady() {
		return this.isActive() && this.video.readyState >= 2;
	}
}

export default CameraService;
