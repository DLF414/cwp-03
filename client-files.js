// client-files.js
const net = require('net');
const fs = require('fs');

const OkServerStatus = 'ACK';
const ErrServerStatus = 'DEC';
const OkClientStatus = 'FILES';

const connectionAddressObj = {host: "127.0.0.1", port: 3001};

const client = new net.Socket();

client.setEncoding('utf8');

client.connect(connectionAddressObj, function (err) {
    if (err) {
        console.error(err);
    }
    else {
        client.write(OkClientStatus);
    }
});


client.on('data', function (data) {
    if (data === OkServerStatus) {
        fs.readFile('D:/1.txt', function (err, data) {
            let buffer = Buffer.from(data);
            console.log(buffer);
            console.log(buffer.length);
            client.write(buffer);
             fs.writeFile('D:/2.png',new Buffer(data),function(){});
             let buffer = Buffer.allocUnsafe();
             buffer.writeDoubleBE(data);
             client.write(buffer);
        })
    }
    else if (data === ErrServerStatus) {
        console.log(data);
        client.destroy();

    }
    else if (data !== OkServerStatus) {

    }
});