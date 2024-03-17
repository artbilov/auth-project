const { createServer } = require('http')
const fs = require('fs')
const { mimeTypes } = require('./mime-types.js')
const server = createServer(handleRequest)
const port = 2222
const limitedAccessURLs = [
  '/index.html',
]
const users = []
const sessions = []

users.push({ id: generateId(), login: 'a', password: 'b' })

server.listen(port, notifyStart)

function notifyStart() {
  console.log(`Server listening on http://localhost:${port}`)
}

function handleRequest(request, response) {
  if (request.url.startsWith('/api/')) {
    handleAPI(request, response)
  } else {
    serveFile(request, response)
  }
}

function serveFile(request, response) {
  if (request.url === '/') request.url = '/index.html'

  if (limitedAccessURLs.includes(request.url)) {
    const authorized = checkAuth(request)

    if (!authorized) {
      response.writeHead(301, { Location: '/lobby.html' }).end()
      return
    }
  }

  const ext = request.url.split('.').pop()
  const type = mimeTypes[ext] || 'text/plain'

  const stream = fs.createReadStream('public' + request.url)

  stream.on('error', () => {
    response.writeHead(404)
    response.end('File Not Found ' + request.url)
  })

  stream.on('open', () => {
    response.writeHead(200, { 'Content-Type': type })
    stream.pipe(response)
  })
}

async function handleAPI(request, response) {
  const endpoint = request.url.replace('/api/', '')

  response.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (endpoint === 'register') {
    const payload = JSON.parse(await getBody(request))
    const { login, password } = payload

    addUser(login, password)
    response.end(JSON.stringify({ success: true }))

  } else if (endpoint === 'login') {
    const payload = JSON.parse(await getBody(request))
    const { login, password } = payload

    const user = users.find(user => user.login === login && user.password === password)

    if (user) {
      const token = generateToken()
      const id = generateId()

      sessions.push({ id, userId: user.id, token })

      response.setHeader('Set-Cookie', `token=${token}; Path=/; Max-Age=3600; HttpOnly`)
      response.end(JSON.stringify({ success: true }))
    } else {
      response.writeHead(401).end()
    }

  } else if (endpoint === 'logout') {
    response.setHeader('Set-Cookie', 'login=; Path=/; Max-Age=0; HttpOnly')
    response.end(JSON.stringify({ success: true }))

  } else if (endpoint === 'users') {
    response.end(JSON.stringify(users))

  } else if (endpoint === 'user') {
    const payload = JSON.parse(await getBody(request))
    const { login } = payload
    const index = users.findIndex(user => user.login === login)

    if (index !== -1) {
      users.splice(index, 1)
      response.end(JSON.stringify({ success: true }))
    } else {
      response.writeHead(404).end()
    }

  } else if (endpoint === 'sessions') {
    const result = sessions.map(session => ({ login: users.find(user => user.id === session.userId).login, token: session.token }))
    
    response.end(JSON.stringify(result))

  } else if (endpoint === 'session') {
    const payload = JSON.parse(await getBody(request))
    const { token } = payload
    const index = sessions.findIndex(session => session.token === token)

    if (index !== -1) {
      sessions.splice(index, 1)
      response.end(JSON.stringify({ success: true }))
    } else {
      response.writeHead(404).end()
    }
  }
}


async function getBody(request) {
  let body = ''
  for await (const chunk of request) {
    body += chunk
  }
  return body
}

function addUser(login, password) {
  const id = generateId()
  const user = { id, login, password }

  users.push(user)
}

function checkAuth(request) {
  if (request.headers.cookie) {
    return true
  }
  return false
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function generateToken() {
  const source = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let token = ''

  for (let i = 0; i < 32; i++) {
    if (i % 5 === 0 && i !== 0) token += '-'

    token += source[Math.floor(Math.random() * source.length)]
  }

  return token
}