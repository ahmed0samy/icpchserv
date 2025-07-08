import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createClient } from 'redis'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'https://urch.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true
  }
})


const client = createClient({
  username: 'default',
  password: '8rjiNIk1BIpQkJtANTrvlChawSMUAQkc',
  socket: {
    host: 'redis-10642.crce176.me-central-1-1.ec2.redns.redis-cloud.com',
    port: 10642
  }
})

client.on('error', err => console.log('Redis Client Error', err))

async function startServer() {
  await client.connect()

  io.on('connection', socket => {
    const id = socket.id

    client.hSet('users', id, Date.now())

    socket.on('user-ready', data => {
      io.emit('incoming-stream', { id, signal: data })
    })

    socket.on('admin-answer', ({ id: targetId, signal }) => {
      io.to(targetId).emit('admin-accepted', signal)
    })

    socket.on('disconnect', () => {
      client.hDel('users', id)
    })
  })

  server.listen(3001, () => {
    console.log('Signaling server running on port 3001')
  })
}

startServer()
