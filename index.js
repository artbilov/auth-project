const { createServer } = require('http')
const fs = require('fs')
const { mimeTypes } = require('./mime-types.js')
const server = createServer(handleRequest)
const port = 1234
const limitedAccessURLs = [
  '/index.html',
]
const users = []


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
  } else {
    const payload = JSON.parse(await getBody(request))
    const { login, password } = payload

    const user = users.find(user => user.login === login && user.password === password)

    if (user) {
      response.end(JSON.stringify({ success: true }))
    } else {
      response.writeHead(401).end()
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
  const user = { login, password }

  users.push(user)
}

function checkAuth(request) {
  if (request.headers.cookie) {
    return true
  }
  return false
}