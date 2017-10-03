// server.js

process.env.defaultSaveFilesDir = "D:/cwp-03_files_dir";

const net = require('net');
const fs = require('fs');
const path = require('path');
const port = 3001;

const ClientQA = 'QA';
const endSendingFile = "ENDFILE";
const ClientFILES = 'FILES';
const sendNextFile = 'NEXTFILE';
const bufferSep = '\r\t\n';


const serverResOK = 'ACK';
const serverResErr = 'DEC';

const qaPath = "./qa.json";
const clientQALogPathDefault = './logs';

const clientFILESDirectoryDefault = 'D:/sendfilesDir';

let seed = 0;
let Clients = [];


let questions = [];

let bufferChanks = [];

const server = net.createServer(function (client) {


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
                Clients[client.id] = data.toString();                                               //тип клиента QA/FILES по его id

                console.log('Client ' + client.id + " connected: " + Clients[client.id]);

                client.write(serverResOK);
            }
        } else {
            client.write(serverResErr);
            client.write(err);
        }
    }

    function ClientDialogQA(data, err) {
        if (!err) {
            let dataString = data.toString();
            if (Clients[client.id] === ClientQA && dataString !== ClientQA) {

                let questionObj = getQuestionObj(dataString);
                let serverAnswer = questionObj[(Math.random() < 0.5) ? "corr" : "incorr"].toString();

                clientQALogWrite('Q: ' + questionObj.question, client.id);
                clientQALogWrite('A: ' + serverAnswer, client.id);

                client.write(serverAnswer);
            }
        }
        else {
            clientQALogWrite(err, client.id);
        }
    }

    function ClientDialogFILES(data, err) {
        if (!err) {
            if (Clients[client.id] === ClientFILES && data.toString() !== ClientFILES) {

                let bufferChank = Buffer.from(data);


                if (!data.toString().endsWith(endSendingFile)) {
                    bufferChanks.push(bufferChank);
                } else {


                    let endChank = Buffer.from(data);

                    let sepIndex = endChank.indexOf(bufferSep);                                                         //data....\r\t\nFilePathENDFILE
                    let pathName = endChank.slice(sepIndex, endChank.length).toString();
                    pathName = pathName.substring(bufferSep.length, pathName.length - endSendingFile.length);
                    let fileName = path.basename(pathName);


                    bufferChanks.push(endChank);
                    let fileData = Buffer.concat(bufferChanks);

                    fs.writeFile('D:/1.jpg', fileData, function (err) {
                            if (err)
                                console.error(err);
                        }
                    );

                    client.write(sendNextFile);
                }
            }
        }

    }
});


function getUniqId() {
    return Date.now() + seed++;
}



function getQuestionObj(question) {
    for (let i = 0; i < questions.length; i++) {
        if (questions[i].question === question) {
            return questions[i];
        }
    }
}

function clientQALogWrite(data, clientid) {
    fs.appendFileSync(`${clientQALogPathDefault}//client_${clientid}.txt`, data + '\r\n');
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
