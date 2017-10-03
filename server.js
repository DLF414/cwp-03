// server.js
const net = require('net');
const fs = require('fs');
const port = 3001;

const ClientQA = 'QA';
const ClientFILES = 'FILES';

const serverResStringOK = 'ACK';
const serverResStringErr = 'DEC';

const qaPath = "./qa.json";
const clientLogPathDefault = './logs';

let questions = [];
let seed = 0;
let Clients = [];

let bufferParts = [];
let fileBufferSum = 0;

const server = net.createServer(function (client) {

    //  client.setEncoding('utf8');

    client.on('end', function () {
        console.log(`Client ${client.id} disconnected`);
    });

    client.on('data', createUserDialog);
    client.on('data', ClientDialogQA);
    client.on('data', ClientDialogFILES);


    function createUserDialog(data, err) {
        if (!err) {
            if (client.id === undefined && (data.toString() === ClientQA || ClientFILES)) {
                client.id = getUniqId();
                Clients[client.id] = data.toString();
                console.log('Connect' + client.id + ":" + Clients[client.id]);
                client.write(serverResStringOK);
            }
        } else {
            client.write(serverResStringErr);
            client.write(err);
        }
    }

    function ClientDialogQA(data, err) {
        if (!err) {
            if (Clients[client.id] === ClientQA && data !== ClientQA) {

                let questionObj = getQuestionObj(data);
                let serverAnswer = questionObj[(Math.random() < 0.5) ? "corr" : "incorr"].toString();

                clientLogWrite('Q: ' + questionObj.question, client.id);
                clientLogWrite('A: ' + serverAnswer, client.id);

                client.write(serverAnswer);
            }
        }
        else {
            clientLogWrite(err, client.id);
        }
    }

    function ClientDialogFILES(data, err) {
        if (!err) {
            if (Clients[client.id] === ClientFILES && data.toString() !== ClientFILES) {

                let tempBuf = new Buffer(data);

                //  console.log(new Buffer(data,'utf8').toString());

                bufferParts.push(tempBuf);
                fileBufferSum += tempBuf.length;

                if (tempBuf.length !== 65536)
                {
                    let buf = Buffer.concat(bufferParts, fileBufferSum);
                    fs.writeFileSync('D:/2.txt', buf);
                }
            }
        }
        else {
            clientLogWrite(err, client.id);
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

function clientLogWrite(data, clientid) {
    fs.appendFileSync(`${clientLogPathDefault}//client_${clientid}.txt`, data + '\r\n');
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