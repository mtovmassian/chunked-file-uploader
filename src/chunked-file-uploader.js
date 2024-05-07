import EventEmitter from 'events';

export class ChunkedFileUploader {

    /** @type {string} */
    chunkUploadUrl;
    /** @type {number} */
    chunkSize;
    /** @type {number} */
    totalchunks;
    /** @type {HTMLInputElement} */
    fileInput;
    /** @type {HTMLButtonElement} */
    uploadButton;
    /** @type {HTMLProgressElement} */
    progressBar;
    /** @type {string} */
    fileId;
    /** @type {EventEmitter} */
    emitter;

    /**
     * @param {string} chunkUploadUrl Url where chunks are uploaded
     * @param {number} chunkSize Chunk size in bytes (e.g. 1MB = 1024 * 1024 = 1048576)
     * @param {string} fileInputId ID of HTML input element used for selecting file
     * @param {string} uploadButtonId ID of HTML button element used for triggering upload
     * @param {string} progressBarId ID of HTML progress element used for displaying upload progress
     */
    constructor(
        chunkUploadUrl,
        chunkSize,
        fileInputId,
        uploadButtonId,
        progressBarId) {
        this.chunkUploadUrl = chunkUploadUrl;
        this.chunkSize = chunkSize;
        this.totalChunks = 0;
        this.currentChunk = 0;
        this.fileInput = document.getElementById(fileInputId);
        this.uploadButton = document.getElementById(uploadButtonId);
        this.progressBar = document.getElementById(progressBarId);
        this.emitter = new EventEmitter();

        this.uploadButton.addEventListener('click', () => this.uploadFile());

        console.debug('[ChunkedFileUploader] initialized');
    }

    async uploadFile() {
        this.disableUploadButton();
        this.resetChunks();

        /** @type {File} */
        const file = this.fileInput.files[0];

        if (!file) {
            alert('Please select a file.');
            return;
        }

        this.fileId = this.generateFileId();
        this.totalChunks = Math.ceil(file.size / this.chunkSize);
        this.progressBar.value = 0;

        this.sendNextChunk();
    }

    /**
     * Function to initiate the upload of the next chunk
     * @param {number} start Blob slice start
     * @param {number} end Blob slice end
     */
    sendNextChunk() {
        const file = this.fileInput.files[0];
        const start = this.currentChunk * this.chunkSize;
        const end = Math.min(start + this.chunkSize, file.size);
        this.sendChunk(start, end);
    }

    /**
     * Function to send a single chunk to the server
     * @param {number} start Blob slice start
     * @param {number} end Blob slice end
     */
    async sendChunk(start, end) {
        console.debug(`[ChunkedFileUploader] Sending chunk ([totalChunks=${this.totalChunks}] [currentChunk=${this.currentChunk}])`)
        const file = this.fileInput.files[0];
        const formData = new FormData();
        formData.append('fileid', this.fileId);
        formData.append('chunkindex', this.currentChunk);
        formData.append('totalchunks', this.totalChunks);
        formData.append('filename', file.name);
        formData.append('file', file.slice(start, end));

        const response = await fetch(this.chunkUploadUrl, {
            method: 'POST',
            body: formData,
        });

        const percentComplete = ((this.currentChunk + 1) / this.totalChunks) * 100;
        this.progressBar.value = percentComplete;

        if (this.hasChunkToUpload()) {
            this.handleFileUploadProgress()
        } else {
            this.handleFileUploadCompletion(response)
        }
    }

    handleFileUploadProgress() {
        this.currentChunk++;
        this.sendNextChunk();
    }

    /**
     * @param {Response} response
     */
    async handleFileUploadCompletion(response) {
        const bodyJson = await response.json();
        const assembledFilePath = bodyJson.assembledFilePath ? bodyJson.assembledFilePath : null;
        
        this.progressBar.value = 100;
        this.enableUploadButton();
        this.emitter.emit('fileUploaded', assembledFilePath);
    }

    disableUploadButton() {
        this.uploadButton.setAttribute('disabled', true);
    }

    enableUploadButton() {
        this.uploadButton.removeAttribute('disabled');
    }

    /**
     * @returns {number} 
     */
    hasChunkToUpload() {
        return this.currentChunk < this.totalChunks - 1;
    }

    /**
     * @returns {number} 
     */
    resetChunks() {
        this.totalChunks = 0;
        this.currentChunk = 0;
    }

    /**
     * @returns {string} 
     */
    generateFileId() {
        return Date.now().toString() + Math.floor(Math.random() * 1000);
    }

    /**
     * @param {string} htmlComponentId,
     * @param {string} chunkUploadUrl Url where chunks are uploaded
     * @param {number} chunkSize Chunk size in bytes (e.g. 1MB = 1024 * 1024 = 1048576)
     * @param {string} fileInputId ID of HTML input element used for selecting file
     * @param {string} uploadButtonId ID of HTML button element used for triggering upload
     * @param {string} progressBarId ID of HTML progress element used for displaying upload progress
     */
    static fromHtmlElement(
        htmlElementId,
        chunkUploadUrl,
        chunkSize,
        fileInputId,
        uploadButtonId,
        progressBarId) {
        /** @type {HTMLElement>} */
        const htmlElement = document.getElementById(htmlElementId);
        htmlElement.innerHTML = `
        <input type="file" id="${fileInputId}" />
        <button id="${uploadButtonId}">Upload</button>
        <progress id="${progressBarId}" value="0" max="100"></progress>
        `
        return new ChunkedFileUploader(chunkUploadUrl, chunkSize, fileInputId, uploadButtonId, progressBarId);
    }

    on(eventName, callback) {
        this.emitter.on(eventName, callback)
    }

}
