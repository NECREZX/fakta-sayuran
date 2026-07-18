import UIHandler from '../ui/ui.handler.js';
import { APP_CONFIG } from './config.js';
import { logError } from './utils.js';
import CameraService from '../services/camera.service.js';
import DetectionService from '../services/detection.service.js';
import FunFactService from '../services/facts.service.js';

class RootFactsApp {
	constructor() {
		this.detector = new DetectionService();
		this.camera = new CameraService();
		this.funFactGenerator = new FunFactService();
		this.ui = new UIHandler();
		this.isRunning = false;
		this.currentLoopId = null;
		this.config = APP_CONFIG;
		this.currentFunFact = '';

		// TODO [Advanced] Tambahkan properti untuk tone yang dipilih

		this.ui.disableButton();

		this.bindEvents();
		this.init();
		// TODO [Basic] Panggil registerServiceWorker()
		this.registerServiceWorker();
	}

	// TODO [Basic] Bind toggle camera event dengan nama onToggleCamera
	// TODO [Basic] Bind camera change event dengan nama onCameraChange
	// TODO [Skilled] Bind FPS change event dengan nama onFPSChange
	// TODO [Skilled] Bind copy fun fact event dengan nama onCopy
	// TODO [Advanced] Bind tone change event dengan nama onToneChange
	bindEvents() {
		this.ui.bindEvents({
			onToggleCamera: () => this.toggleCamera(),
			onCameraChange: (deviceId) => this.camera.startCamera(deviceId)
		});
	}
	
	// TODO [Skilled] Perbarui status header UI menjadi 'Memuat model...' saat memulai inisialisasi
	// TODO [Basic] Lengkapi inisialisasi kemampuan aplikasi
	// TODO [Skilled] Perbarui status header UI menjadi 'Siap'
	async init() {
		this.ui.updateHeaderStatus('Memuat AI (mungkin lama)...', true);
		try {
			await Promise.all([
				this.detector.loadModel(),
				this.funFactGenerator.loadModel((x) => {
					if (x.status === 'progress') {
						const pct = Math.round(x.progress || 0);
						this.ui.updateHeaderStatus(`Mengunduh AI: ${pct}%...`, true);
					} else if (x.status === 'ready') {
						this.ui.updateHeaderStatus(`Model ${x.file} siap`, true);
					}
				})
			]);
			this.ui.updateHeaderStatus('Siap', false);
			this.ui.enableButton();
		} catch (error) {
			logError('Gagal menginisialisasi aplikasi', error);
			// TODO [Skilled] Perbarui status header UI menjadi 'Error' jika inisialisasi gagal
			this.ui.updateHeaderStatus('Error', false);
			this.ui.showError(`Gagal menginisialisasi: ${error.message}`);
			this.ui.disableButton();
		}
	}


	// TODO [Basic] Buatlah berkas sw.js di root project dan konfigurasikan precaching di dalamnya menggunakan Workbox
	// TODO [Basic] Registrasikan Service Worker
	async registerServiceWorker() {
		if ('serviceWorker' in navigator) {
			try {
				await navigator.serviceWorker.register('./sw.js');
				console.log('Service Worker registered');
			} catch (error) {
				console.error('Service Worker registration failed:', error);
			}
		}
	}
	// TODO [Skilled] Buatlah metode untuk menyalin fun fact ke clipboard

	// TODO [Basic] Implementasikan metode untuk mengaktifkan atau menonaktifkan kamera
	toggleCamera() {
		if (this.isRunning) {
			this.stopCamera();
		} else {
			this.startCamera();
		}
	}

	// TODO [Basic] Implementasikan metode untuk memulai kamera
	async startCamera() {
		try {
			await this.camera.startCamera();
			this.isRunning = true;
			this.ui.updateCameraUI(true);
			this.startDetection();
		} catch (error) {
			logError('Gagal memulai kamera', error);
			this.ui.showError(`Gagal memulai kamera: ${error.message}`);
		}
	}

	// TODO [Basic] Implementasikan metode untuk menghentikan kamera
	stopCamera() {
		this.stopDetection();
		this.camera.stopCamera();
		this.isRunning = false;
		this.ui.updateCameraUI(false);
		this.ui.switchToState('idle');
	}

	// TODO [Basic] Implementasikan metode untuk memulai deteksi
	startDetection() {
		this.consecutiveDetections = 0; // Explicitly reset to prevent instant triggering on reload
		if (this.camera && this.camera.video && this.camera.video.paused) {
			this.camera.video.play().catch(e => logError('Failed to play video', e));
		}
		this.currentLoopId = Date.now();
		this.ui.switchToState('loading');
		this.detectLoop(this.currentLoopId);
	}

	// TODO [Basic] Implementasikan metode untuk menghentikan deteksi
	stopDetection() {
		this.currentLoopId = null;
	}

	// TODO [Basic] Implementasikan metode deteksi utama
	async detectLoop(loopId) {
		if (!this.isRunning || loopId !== this.currentLoopId) return;

		try {
			if (this.detector.isLoaded() && this.camera.isReady()) {
				const result = await this.detector.predict(this.camera.video);
				
				if (result && result.confidence >= this.config.detectionConfidenceThreshold) {
					if (this.lastDetectedLabel === result.label) {
						this.consecutiveDetections = (this.consecutiveDetections || 0) + 1;
					} else {
						this.lastDetectedLabel = result.label;
						this.consecutiveDetections = 1;
					}

					// Require 5 consecutive frames (about 0.5s) to confirm detection
					if (this.consecutiveDetections >= 5) {
						this.consecutiveDetections = 0;
						if (this.camera && this.camera.video) {
							this.camera.video.pause(); // Freeze camera frame
						}
						this.ui.showResults({
							className: result.label,
							confidence: Math.round(result.confidence)
						}, null);
						this.stopDetection(); // Stop detecting when a confident prediction is made
						await this.generateAndShowResults(result);
						return;
					}
				} else {
					this.consecutiveDetections = 0;
				}
			}
		} catch (error) {
			logError('Deteksi gagal', error);
		}

		setTimeout(() => {
			this.detectLoop(loopId);
		}, this.config.detectionRetryInterval);
	}

	// TODO [Basic] Implementasikan metode untuk menghasilkan dan menampilkan fun fact
	async generateAndShowResults(detectionResult) {
		try {
			this.ui.updateFunFactState('loading');
			const fact = await this.funFactGenerator.generateFunFact(detectionResult.label);
			this.currentFunFact = fact;
			this.ui.updateFunFactState('success', { funFact: fact });
			
			// Auto-restart scanning after 6 seconds so user doesn't have to manually click
			setTimeout(() => {
				if (this.isRunning) {
					this.startDetection();
				}
			}, this.config.analyzingDelay * 3);
		} catch (error) {
			logError('Gagal menampilkan hasil', error);
			this.ui.updateFunFactState('error');

			setTimeout(() => {
				if (this.isRunning) {
					this.startDetection();
				}
			}, this.config.analyzingDelay * 3);
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const app = new RootFactsApp();

	if (typeof lucide !== 'undefined') {
		lucide.createIcons();
	}
});

export default RootFactsApp;
