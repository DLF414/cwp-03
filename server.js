// server.js
const net = require('net');
const fs = require('fs');
const path = require('path');
const port = 3001;

const ClientQAstatus = 'QA';
const ClientFILESstatus = 'FILES';
const endSendingFile = "ENDFILE";
const sendNextFile = 'NEXTFILE';
const bufferSeparator = '|||||';


const serverResOKstatus = 'ACK';
const serverResErrstatus = 'DEC';

const qaPath = "./qa.json";
const clientQALogPathDefault = './logs';
const recvFilesDirpath = process.env.FILESDIR + path.sep + 'files';

let seed = 0;
let Clients = [];
let filesClientsValue = 0;                   //(((

let questions = [];

let filesChanks = [];


const server = net.createServer(function (client) {


    client.on('error', function (err) {
        console.error(err);
    });

    client.on('end', function () {
        filesClientsValue--;
        console.log(`Client ${client.id} disconnected`);
    });

    client.on('data', createClientDialog);
    client.on('data', ClientDialogQA);
    client.on('data', ClientDialogFILES);

    function createClientDialog(data, err) {
        if (!err) {
            if (client.id === undefined && (data.toString() === ClientQAstatus || ClientFILESstatus)) {
                client.id = getUniqId() + seed++;
                Clients[client.id] = data.toString();

                if (Clients[client.id] === ClientFILESstatus) {
                    if (filesClientsValue++ < process.env.FILESMAXCLIENT) {
                        createDirIfNotExist(recvFilesDirpath + path.sep + client.id.toString());
                        filesChanks[client.id] = [];
                    }
                    else {
                        throw 'userFile limit exceeded';
                    }
                }
                client.write(serverResOKstatus);
                console.log('Client ' + client.id + " connected: " + Clients[client.id]);
            }
        } else {

            client.write(serverResErrstatus);
            client.write(err);
        }
    }

    function ClientDialogQA(data, err) {
        if (!err) {
            let dataString = data.toString();
            if (Clients[client.id] === ClientQAstatus && dataString !== ClientQAstatus) {

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
            if (Clients[client.id] === ClientFILESstatus && data.toString() !== ClientFILESstatus) {

                let bufferChank = Buffer.from(data);
                filesChanks[client.id].push(bufferChank);

                if (data.toString().endsWith(endSendingFile)) {
                    createFileFromBinData(client.id);
                    client.write(sendNextFile);
                }

            }
        }

    }

});

function createFileFromBinData(id) {

    let fileData = Buffer.concat(filesChanks[id]);
    let separatorIndex = fileData.indexOf(bufferSeparator);
    let fileName = fileData.slice(separatorIndex).toString().split(bufferSeparator)[1];

    fs.writeFile(recvFilesDirpath + path.sep + id + path.sep + fileName, fileData.slice(0,separatorIndex), function (err) {
            if (err)
                console.error(err);
        }
    );
    filesChanks[id]=[];
}

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
    createDirIfNotExist(recvFilesDirpath);
    createDirIfNotExist(clientQALogPathDefault);
}

function createDirIfNotExist(path) {
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