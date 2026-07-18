import { logError, validateModelMetadata } from '../core/utils.js';

class DetectionService {
	constructor() {
		this.model = null;
		this.labels = [];
		this.config = null;
	}

	// TODO [Basic] Implementasikan metode untuk memuat model TensorFlow.js
	// TODO [Basic] Gunakan validateModelMetadata() untuk memeriksa metadata model
	// TODO [Advance] Gunakan strategi Backend Adaptive seperti yang telah dipelajari sebelumnya
	async loadModel() {
		try {
			this.model = await tf.loadLayersModel('./model/model.json');
			const response = await fetch('./model/metadata.json');
			const metadata = await response.json();
			if (!validateModelMetadata(metadata)) {
				throw new Error('Metadata model tidak valid');
			}
			this.labels = metadata.labels;
		} catch (error) {
			logError('Failed to load model', error);
			throw new Error(`Failed to load model: ${error.message}`);
		}
	}

	cropToCanvas(image) {
		const size = 224;
		const canvas = document.createElement('canvas');
		let width = image.width;
		let height = image.height;
		if (image instanceof HTMLVideoElement) {
			width = image.videoWidth;
			height = image.videoHeight;
		}
		const min = Math.min(width, height);
		const scale = size / min;
		const scaledW = Math.ceil(width * scale);
		const scaledH = Math.ceil(height * scale);
		const dx = scaledW - size;
		const dy = scaledH - size;
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d');
		
		const isFlipped = image.style && image.style.transform === 'scaleX(-1)';
		if (isFlipped) {
			ctx.scale(-1, 1);
			ctx.drawImage(image, Math.floor(dx / 2) * -1 - size, Math.floor(dy / 2) * -1, scaledW, scaledH);
		} else {
			ctx.drawImage(image, Math.floor(dx / 2) * -1, Math.floor(dy / 2) * -1, scaledW, scaledH);
		}
		return canvas;
	}

	// TODO [Basic] Implementasikan metode untuk melakukan prediksi pada elemen gambar
	async predict(imageElement) {
		let predictions;
		let maxConfidence = 0;
		let maxIndex = 0;
		
		try {
			const canvas = this.cropToCanvas(imageElement);
			
			// Use tf.tidy to automatically clean up all intermediate tensors!
			predictions = tf.tidy(() => {
				const tensor = tf.browser.fromPixels(canvas);
				const expanded = tensor.expandDims(0);
				// Normalisasi: (image / 127.5) - 1
				const normalized = expanded.toFloat().div(127.5).sub(1);
				return this.model.predict(normalized);
			});
			
			const data = predictions.dataSync();
			maxConfidence = Math.max(...Array.from(data));
			maxIndex = Array.from(data).indexOf(maxConfidence);
			
			return {
				label: this.labels[maxIndex],
				confidence: maxConfidence * 100,
				isValid: true
			};
		} catch (error) {
			logError('Prediction error', error);
			throw new Error(`Prediksi gagal: ${error.message}`);
		} finally {
			// TODO [Basic] Dispose tensor dan predictions untuk menghindari memory leak
			if (predictions) predictions.dispose();
		}
	}

	// TODO [Basic] Periksa apakah model sudah dimuat
	isLoaded() {
		return this.model !== null && this.labels.length > 0;
	}
}

export default DetectionService;
