// person.js
'use strict';

const venom = require('venom-bot');
const { json } = require('express');

module.exports = class Sessions {

    static async start(sessionName) {
        Sessions.sessions = Sessions.sessions || []; //start array

        var session = Sessions.getSession(sessionName);

        if (!session) { //só adiciona se não existir
            Sessions.addSesssion(sessionName);
        } else {
            console.log(sessionName + " already exists");
        }
    }

    static addSesssion(sessionName) {
        var newSession = {
            name: sessionName,
            qrcode: false,
            client: false,
            status: 'notLogged',
            state: 'STARTING'
        }
        Sessions.sessions.push(newSession);

        newSession.client = Sessions.initSession(sessionName);
        Sessions.setup(newSession);

    }//addSession

    static setup(newSession) {
        newSession.client.then(client => {
            client.onStateChange(state => {
                newSession.state = state;
                console.log(state);
            });//.then((client) => Sessions.startProcess(client));
            client.onMessage((message) => {
                if (message.body === 'hi') {
                    client.sendText(message.from, 'Hello\nfriend!');
                }
            });
        });
    }//setup

    static async initSession(sessionName) {
        var session = Sessions.getSession(sessionName);
        const client = await venom.create(
            sessionName,
            (base64Qr) => {
                console.log("new qrcode updated");
                session.qrcode = base64Qr;
            },
            (statusFind) => {
                session.status = statusFind;
            },
            {
                headless: true,
                devtools: false,
                useChrome: false,
                debug: false,
                logQR: false,
                browserArgs: [
                    '--log-level=3',
                    '--no-default-browser-check',
                    '--disable-site-isolation-trials',
                    '--no-experiments',
                    '--ignore-gpu-blacklist',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--enable-features=NetworkService',
                    '--disable-setuid-sandbox',
                    '--no-sandbox',
                    // Extras
                    '--disable-webgl',
                    '--disable-threaded-animation',
                    '--disable-threaded-scrolling',
                    '--disable-in-process-stack-traces',
                    '--disable-histogram-customizer',
                    '--disable-gl-extensions',
                    '--disable-composited-antialiasing',
                    '--disable-canvas-aa',
                    '--disable-3d-apis',
                    '--disable-accelerated-2d-canvas',
                    '--disable-accelerated-jpeg-decoding',
                    '--disable-accelerated-mjpeg-decode',
                    '--disable-app-list-dismiss-on-blur',
                    '--disable-accelerated-video-decode',
                ],
                refreshQR: 1000,
                autoClose: false,
                disableSpins: true
            }
        );
        return client;
    }//initSession

    /*
    static startProcess(client) {

        console.log("new session " + client.name);

        /*
        //check messages
        setInterval((client, sessionName) => {
            console.log('check messages');
            var session = Sessions.getSession(sessionName);
            if (session.messages) {
                session.messages.forEach((message) => {
                    client.sendMessageToId(message.number + '@c.us', message.text);
                });//foreach messages
            }//if messages
        }, 1000);

        client.onMessage((message) => {
            if (message.body === 'Hi') {
                client.sendText(message.from, 'Welcome Venom 🕷');
            }
        });

    }
    */
    static getQrcode(sessionName) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (["UNPAIRED", "UNPAIRED_IDLE"].includes(session.state)) {
                session.client.then(client => {
                    client.close();
                    session.client = Sessions.initSession(sessionName);
                    Sessions.setup(session);
                });
                return { result: "error", message: session.state };
            } else { //CONNECTED
                if (session.status != 'isLogged') {
                    return { result: "success", qrcode: session.qrcode };
                } else {
                    return { result: "error", message: session.state };
                }
            }
        } else {
            return { result: "error", message: "session not started" };
        }
    } //getQrcode

    static getSession(sessionName) {
        var foundSession = false;
        if (Sessions.sessions)
            Sessions.sessions.forEach(session => {
                if (sessionName == session.name) {
                    foundSession = session;
                }
            });
        return foundSession;
    }//getSession

    static getSessions() {
        if (Sessions.sessions) {
            return Sessions.sessions;
        } else {
            return [];
        }
    }//getSessions

    static message(sessionName, number, text) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                session.client.then(client => {
                    client.sendMessageToId(number + '@c.us', text);
                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "session not started" };
        }
    }
}