# Causeway

An encrypted, authenticated bidirectional pipe over WebSockets.

## Problem

Suppose you want to create a bidirectional pipe between `prog1` and `prog2`:

    $ mkfifo fifo
    $ prog1 < fifo | prog2 > fifo
 
But `prog1` and `prog2` are on two separate hosts. 

## Solution: `nc`

On the first host (`192.168.1.35`):

    $ mkfifo fifo
    $ prog1 < fifo | nc -l -p 3333 > fifo

On the second host (`192.168.1.58`):

    $ mkfifo fifo
    $ nc 192.168.1.35 3333 < fifo | prog2 > fifo

This works okay, but does not encrypt data or authenticate endpoints.

## Solution: `cw`

On the first host (`192.168.1.35`):

    $ mkfifo fifo
    $ prog1 < fifo | cw > fifo
    [cw] Local wss://192.168.1.35:33207/ listening
    [cw] Waiting for connection...

On the second host (`192.168.1.58`):

    $ mkfifo fifo
    $ cw -d wss://192.168.1.35:33207 < fifo | prog2 > fifo
    [cw] Waiting for connection...
    [cw] Remote wss://192.168.1.35:33207/ opened

The first host confirms the connection:

    [cw] Remote wss://192.168.1.58:43400/ connected

All data is encrypted and endpoints are authenticated using certificates.
