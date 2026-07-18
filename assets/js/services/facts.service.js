import { logError } from '../core/utils.js';
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3';

class FunFactService {
	constructor() {
		this.generator = null;
		this.isModelLoaded = false;
		this.isGenerating = false;
		this.config = null;
		this.currentBackend = null;
	}

	// TODO [Basic] Implementasikan metode untuk memuat model Transformers.js
	// TODO [Advance] Gunakan strategi Backend Adaptive seperti yang telah dipelajari sebelumnya
	async loadModel(progressCallback) {
		try {
			env.allowLocalModels = false;
			this.generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-77M', { 
				dtype: 'q4',
				progress_callback: progressCallback
			});
			this.isModelLoaded = true;
		} catch (error) {
			logError('Error loading Transformers.js model', error);
			throw new Error(`Failed to load FunFact model: ${error.message}`);
		}
	}

	// TODO [Basic] Implementasikan metode untuk menghasilkan fun fact tentang sayuran
	// TODO [Basic] Tambahkan validasi untuk maksimum panjang input dan pembersihan input terhadap karakter khusus untuk mengatasi prompt injection
	// TODO [Advanced] Gunakan parameter `tone` untuk variasi personalitas
	async generateFunFact(vegetable, tone = 'normal') {
		if (!this.isModelLoaded || this.isGenerating) {
			throw new Error('Model belum siap atau sedang menghasilkan fakta');
		}

		if (!vegetable || typeof vegetable !== 'string') {
			throw new Error('Nama sayuran yang valid diperlukan');
		}

		try {
			this.isGenerating = true;
			const cleanVeg = vegetable.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50);
			const prompt = `Provide one short fun fact about ${cleanVeg}.`;
			
			// Use greedy decoding (do_sample: false) for maximum speed and determinism
			const result = await this.generator(prompt, { max_new_tokens: 30 });
			
			let generatedText = result[0].generated_text.trim();
			return generatedText;
		} catch (error) {
			logError('Error generating fun fact', error);
			throw new Error(`Failed to generate fun fact: ${error.message}`);
		} finally {
			this.isGenerating = false;
		}
	}

	// TODO [Basic] Periksa apakah model siap dan tidak sedang menghasilkan fakta
	isReady() {
		return this.isModelLoaded && !this.isGenerating;
	}
}

export default FunFactService;
