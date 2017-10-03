// server.js
const net = require('net');
const fs = require('fs');
const path = require('path');
const port = 3001;

const ClientQA = 'QA';
const endSendingFile = "ENDFILE";
const ClientFILES = 'FILES';
const sendNextFile = 'NEXTFILE';
const bufferSep = '|||||';


const serverResOK = 'ACK';
const serverResErr = 'DEC';

const qaPath = "./qa.json";
const clientQALogPathDefault = './logs';
const recvFilesDir = process.env.FILESDIR + path.sep + 'files';

let seed = 0;
let Clients = [];


let questions = [];

let bufferChanksArray = [];


const server = net.createServer(function (client) {


    client.on('end', function () {
        let i = Clients.indexOf(client.id);
        if(i !== -1) {
            Clients.splice(i, 1);
        }
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


                client.write(serverResOK);
                console.log('Client ' + client.id + " connected: " + Clients[client.id]);

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

                let clientFilesDir = recvFilesDir+path.sep+client.id.toString();

                createDirIfNotExist(clientFilesDir);

                let bufferChank = Buffer.from(data);


                if (!data.toString().endsWith(endSendingFile)) {
                    bufferChanksArray.push(bufferChank);
                } else {

                    let endChank = Buffer.from(data);

                    let separatorIndex = endChank.indexOf(bufferSep);
                    let pathName = endChank.slice(separatorIndex, endChank.length).toString();
                    let fileName = pathName.substring(bufferSep.length, pathName.length - endSendingFile.length);


                    bufferChanksArray.push(endChank.slice(0, separatorIndex));
                    let fileData = Buffer.concat(bufferChanksArray);

                    fs.writeFile(clientFilesDir + path.sep + fileName, fileData, function (err) {
                            if (err)
                                console.error(err);
                        }
                    );

                    bufferChanksArray = [];
                    client.write(sendNextFile);
                }
            }
        }

    }

});

server.listen(port, 'localhost', function () {
    console.log("start server");

    fs.readFile(qaPath, function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            questions = JSON.parse(data);
            initDirs();
        }
    });
});


function initDirs() {
    createDirIfNotExist(recvFilesDir);
    createDirIfNotExist(clientQALogPathDefault);
}

function createDirIfNotExist(path){
    if (!fs.existsSync(path))
        fs.mkdirSync(path);
}

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
