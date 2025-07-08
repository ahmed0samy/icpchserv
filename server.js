const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const { Redis } = require('@upstash/redis')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: "*" } })

const redis = new Redis({
  url: 'https://your-upstash-url',
  token: 'your-upstash-token',
})

io.on('connection', socket => {
  const id = socket.id

  redis.hset('users', { [id]: Date.now() })

  socket.on('user-ready', data => {
    socket.broadcast.emit('incoming-stream', { id, signal: data })
  })

  socket.on('admin-answer', ({ id: targetId, signal }) => {
    io.to(targetId).emit('admin-accepted', signal)
  })

  socket.on('disconnect', () => {
    redis.hdel('users', id)
  })
})

server.listen(process.env.PORT || 3001, () => console.log('Socket server running'))
