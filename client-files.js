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
    if (err)
    {
        console.error(err);
    }
    else
    {
        client.write(OkClientStatus);
    }
});


client.on('data', function (data) {
    if (data === OkServerStatus) {
        console.log(OkServerStatus);
        fs.open('D:\kok.docx','r',function(status,fc){
            if(status){
                console.log(status);
            }
            else{
                console.log('+2');

                let buffer = new Buffer(1000);
                fs.read(fd,buffer,0,1000,0,function(err,num){
                    client.write(buffer);
                })
            }
        })
    }
    else if (data === ErrServerStatus) {
        console.log(data);
        client.destroy();

    }
    else if (data !== OkServerStatus) {
        console.log("\nQuestion: " + questions[currentQuestionIndex].question);
        console.log("Server answer: " + data);
        console.log(data === questions[currentQuestionIndex].corr.toString() ?
            "Server answer is true" :
            "True answer: " + questions[currentQuestionIndex].corr);
        if (++currentQuestionIndex !== questions.length) {
            client.write(questions[currentQuestionIndex].question)
        }
        else {
            client.destroy();
        }
    }
});