import { ChunkedFileUploader } from './chunked-file-uploader';


function makeObjectGlobal(objectName, object) {
    window[objectName] = object;
}

function makeObjectsGlobal(objects) {
    Object.entries(objects).forEach(
        ([objectName, object]) => makeObjectGlobal(objectName, object)
    )
}

function main() {
    //makeObjectsGlobal({ChunkedFileUploader});
    const uploader = ChunkedFileUploader.fromHtmlElement(
        'chunked-file-uploader',
        process.env.FILE_CHUNK_UPLOAD_URL,
        104857600,
        'fileInput',
        'uploadButton',
        'progressBar'
    );
    uploader.on('fileUploaded', (assembledFilePath) => {
        alert(`File uploaded under ${assembledFilePath}`);
    });
}

main();