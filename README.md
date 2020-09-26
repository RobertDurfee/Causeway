# Causeway

A remote, bidirectional pipe utility over secure WebSockets with certificate authentication.

## Problem

Suppose you want to create a bidirectional pipe between `prog1` and `prog2`:

    $ mkfifo fifo
    $ prog1 < fifo | prog2 > fifo
 
But `prog1` and `prog2` are on two separate hosts.

## Solution

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

The first host should also confirm the connection:

    [cw] Remote wss://192.168.1.58:43400/ connected

Meanwhile, any unsent data is buffered.
