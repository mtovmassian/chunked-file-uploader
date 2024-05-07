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
    console.log('Hello world');
    const uploader = ChunkedFileUploader.fromHtmlElement(
        'chunked-file-uploader',
        'http://localhost:9015/api/v1/ext/users/public/upload/file-chunk',
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