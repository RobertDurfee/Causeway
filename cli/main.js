const https = require('https')
const fs = require('fs')
const WebSocket = require('ws')
const program = require('commander')

const server = () => {
    const server = https.createServer({
        cert: fs.readFileSync('my.cert.pem'),
        ca: [ fs.readFileSync('my.cert.pem') ],
        key: fs.readFileSync('my.key.pem'),
        passphrase: fs.readFileSync('my.key.pem.pass', { encoding: 'utf-8' }),
        requestCert: true,
        rejectUnauthorized: true
    })
    const wss = new WebSocket.Server({
        verifyClient: info => {
            return !!info.req.client.authorized
        },
        server
    })
    wss.on('listening', () => {
        console.error(`[cw] Local wss://localhost:${wss.address().port}/ listening`)
        console.error(`[cw] Waiting for connection...`)
    })
    wss.on('connection', (ws, req) => {
        console.error(`[cw] Remote wss://${req.socket.remoteAddress}:${req.socket.remotePort}/ connected`)
        const duplex = WebSocket.createWebSocketStream(ws, { encoding: 'utf-8' })
        duplex.on('end', () => {
            console.error(`[cw] Remote wss://${req.socket.remoteAddress}:${req.socket.remotePort}/ ended`)
            duplex.unpipe(process.stdout)
            process.stdin.unpipe(duplex)
        });
        duplex.on('error', () => {
            console.error(`[cw] Remote wss://${req.socket.remoteAddress}:${req.socket.remotePort}/ errored`)
            duplex.unpipe(process.stdout)
            process.stdin.unpipe(duplex)
        });
        process.stdin.on('end', () => {
            console.error(`[cw] Local wss://localhost:${wss.address().port}/ ended`)
            process.stdin.unpipe(duplex)
        });
        process.stdin.on('error', () => {
            console.error(`[cw] Local wss://localhost:${wss.address().port}/ errored`)
            process.stdin.unpipe(duplex)
        });
        duplex.pipe(process.stdout)
        process.stdin.pipe(duplex)
    })
    server.listen(0)
}

const client = url => {
    console.error(`[cw] Waiting for connection...`)
    const ws = new WebSocket(`wss://${url}/`, {
        cert: fs.readFileSync('my.cert.pem'),
        ca: [ fs.readFileSync('my.cert.pem') ],
        key: fs.readFileSync('my.key.pem'),
        passphrase: fs.readFileSync('my.key.pem.pass', { encoding: 'utf-8' }),
        rejectUnathorized: true,
        checkServerIdentity: (hostname, cert) => {
            const cn = fs.readFileSync('my.cert.pem.cn')
            if (cert.subject.CN != cn) {
                return new Error(`Remote CN '${cert.subject.CN}' does not match '${cn}'`)
            }
        },
    })
    ws.on('open', () => {
        console.error(`[cw] Remote wss://${url}/ opened`)
    })
    const duplex = WebSocket.createWebSocketStream(ws, { encoding: 'utf-8' })
    duplex.on('end', () => {
        console.error(`[cw] Remote wss://${url}/ ended`)
        duplex.unpipe(process.stdout)
        process.stdin.unpipe(duplex)
    })
    duplex.on('error', error => {
        console.error(`[cw] Remote wss://${url}/ errored: ${error.message}`)
        duplex.unpipe(process.stdout)
        process.stdin.unpipe(duplex)
    })
    process.stdin.on('end', () => {
        console.error(`[cw] Local wss://localhost:????/ ended`)
        process.stdin.unpipe(duplex)
    });
    process.stdin.on('error', () => {
        console.error(`[cw] Local wss://localhost:????/ errored`)
        process.stdin.unpipe(duplex)
    });
    duplex.pipe(process.stdout)
    process.stdin.pipe(duplex)
}

program
    .version('1.0.0')
    .description('Command-line interface for an encrypted, authenticated bidirectional pipe over WebSockets.')
    .option('-d, --destination <destination>', 'Destination WebSocket server.')
    .action(options => {
        if (options.destination) {
            client(options.destination)
        } else {
            server()
        }
    })

program.parse(process.argv)
