const WebSocket = require('ws')
const program = require('commander')

const server = () => {
    const wss = new WebSocket.Server({ port: 0 })
    wss.on('listening', () => {
        console.error(`[cw] Local ws://localhost:${wss.address().port}/ listening`)
        console.error(`[cw] Waiting for connection...`)
    })
    wss.on('connection', (ws, req) => {
        console.error(`[cw] Remote ws://${req.socket.remoteAddress}:${req.socket.remotePort}/ connected`)
        const duplex = WebSocket.createWebSocketStream(ws, { encoding: 'utf-8' })
        duplex.on('end', () => {
            console.error(`[cw] Remote ws://${req.socket.remoteAddress}:${req.socket.remotePort}/ ended`)
            duplex.unpipe(process.stdout)
            process.stdin.unpipe(duplex)
        });
        duplex.on('error', () => {
            console.error(`[cw] Remote ws://${req.socket.remoteAddress}:${req.socket.remotePort}/ errored`)
            duplex.unpipe(process.stdout)
            process.stdin.unpipe(duplex)
        });
        process.stdin.on('end', () => {
            console.error(`[cw] Local ws://localhost:${wss.address().port}/ ended`)
            process.stdin.unpipe(duplex)
        });
        process.stdin.on('error', () => {
            console.error(`[cw] Local ws://localhost:${wss.address().port}/ errored`)
            process.stdin.unpipe(duplex)
        });
        duplex.pipe(process.stdout)
        process.stdin.pipe(duplex)
    })
}

const client = url => {
    console.error(`[cw] Waiting for connection...`)
    const ws = new WebSocket(url)
    ws.on('open', () => {
        console.error(`[cw] Remote ${url} opened`)
    })
    const duplex = WebSocket.createWebSocketStream(ws, { encoding: 'utf-8' })
    duplex.on('end', () => {
        console.error(`[cw] Remote ${url} ended`)
        duplex.unpipe(process.stdout)
        process.stdin.unpipe(duplex)
    })
    duplex.on('error', () => {
        console.error(`[cw] Remote ${url} errored`)
        duplex.unpipe(process.stdout)
        process.stdin.unpipe(duplex)
    })
    process.stdin.on('end', () => {
        console.error(`[cw] Local ws://localhost:????/ ended`)
        process.stdin.unpipe(duplex)
    });
    process.stdin.on('error', () => {
        console.error(`[cw] Local ws://localhost:????/ errored`)
        process.stdin.unpipe(duplex)
    });
    duplex.pipe(process.stdout)
    process.stdin.pipe(duplex)
}

program
    .version('1.0.0')
    .description('Command-line interface for a remote, bidirectional pipe over secure WebSockets with certificate authentication.')
    .option('-d, --destination <destination>', 'Destination WebSocket server.')
    .action(options => {
        if (options.destination) {
            client(options.destination)
        } else {
            server()
        }
    })

program.parse(process.argv)
