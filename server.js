// server.js
const net = require('net');
const fs = require('fs');
const port = 8124;

const clientReqString = 'QA';
const serverResStringOK = 'ACK';
const serverResStringErr = 'DEC';

const qaPath = "./qa.json";
const clientLogPathDefault = './logs';

let questions = [];
let seed = 0;
let fdFile;

const server = net.createServer(function (client) {

    client.setEncoding('utf8');

    client.on('end', function () {
        console.log(`Client ${client.id} disconnected`);
    });

    client.on('data', createUserDialog);
    client.on('data', startUserDialog);

    function createUserDialog(data, err) {
        if (!err) {
            if (data === clientReqString) {
                client.id = getUniqId();

                fs.open(`${clientLogPathDefault}//client_${client.id}.txt`, 'w', function (err, fd) {
                    fdFile = fd;
                    clientLogWrite("Client id: " + client.id);
                    client.write(serverResStringOK);
                });

            }
        } else {
            client.write(serverResStringErr);
            client.write(err);

        }
    }
    function startUserDialog(data, err) {
        if (!err) {
            if (data !== clientReqString) {
                let questionObj = getQuestionObj(data);
                let serverAnswer = questionObj[(Math.random() < 0.5) ? "corr" : "incorr"].toString();

                clientLogWrite('Q: ' + questionObj.question);
                clientLogWrite('A: ' + serverAnswer);

                client.write(serverAnswer);
            }
        }
        else {
            clientLogWrite(err);
        }
    }
});

function getQuestionObj(question) {
    for (let i = 0; i < questions.length; i++) {
        if (questions[i].question === question) {
            return questions[i];
        }
    }
}

function getUniqId() {
    return Date.now() + seed++;
}

function clientLogWrite(data) {
    fs.write(fdFile, data + '\r\n', function (err) {
        if (err) {
            console.log(err);
        }
    });
}

server.listen(port, 'localhost', function () {
    console.log("start server");

    fs.readFile(qaPath, function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            questions = JSON.parse(data);
        }
    });
});
