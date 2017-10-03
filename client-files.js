// client-files.js
const net = require('net');
const fs = require('fs');
const path = require('path');

const filesDirectories = process.argv.slice(2);

const endSendingFile = "ENDFILE";
const OkServerStatus = 'ACK';
const ErrServerStatus = 'DEC';
const OkClientStatus = 'FILES';
const nextFileStatus = 'NEXTFILE';
const bufferSep = '\r\t\n';

const connectionAddressObj = {host: "127.0.0.1", port: 3001};
const client = new net.Socket();

let directories = [];
let allFiles = [];


client.setEncoding('utf8');

client.connect(connectionAddressObj, (err) => {

    if (err) {
        console.error(err);
    }
    else {
        directories = getDirectoriesFrom();
        directories.forEach((dirVal) => {
            readAllFilesNames(dirVal);
        });
        client.write(OkClientStatus);

    }
});


client.on('data', createSendingDialog);
client.on('data', abortSendingDialog);

function createSendingDialog(data) {
    if (data === OkServerStatus || nextFileStatus) {
        sendNextFile()
    }
}



function sendNextFile(){
    let tmpFileName = allFiles.shift();
    let buffertoSend = Buffer.from(fs.readFileSync(tmpFileName));

    client.write(buffertoSend);
    client.write(bufferSep+tmpFileName);
    client.write(endSendingFile);
}

function abortSendingDialog(data) {
    if (data === ErrServerStatus) {
        console.log(data);
        client.destroy();
    }
}


function readAllFilesNames(dirVal) {
    fs.readdirSync(dirVal).forEach((fileVal) => {

        let filePath = path.normalize(dirVal + '\\' + fileVal);
        if (fs.statSync(filePath).isFile()) {
            allFiles.push(filePath);
        }
        else {
            readAllFilesNames(filePath);
        }
    })
}

function getDirectoriesFrom() {
    return process.argv.slice(2);
}