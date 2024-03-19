const { createServer } = require('http')
const fs = require('fs')
const { hash, verify } = require('argon2')
const { mimeTypes } = require('./mime-types.js')
const server = createServer(handleRequest)
const port = 2222
const limitedAccessURLs = [
  '/index.html',
]
const users = []
const sessions = []

loadData()

server.listen(port, notifyStart)

function notifyStart() {
  console.log(`Server listening on http://localhost:${port}`)
}

function handleRequest(request, response) {
  console.log(request.method, request.url)

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

    await addUser(login, password)
    response.end(JSON.stringify({ success: true }))

  } else if (endpoint === 'login') {
    const payload = JSON.parse(await getBody(request))
    const { login, password } = payload

    const user = users.find(user => user.login === login)

    const valid = await verify(user.hash, password)

    if (valid) {
      const token = startSession(user)

      response.setHeader('Set-Cookie', `token=${token}; Path=/; Max-Age=3600; HttpOnly`)
      response.end(JSON.stringify({ success: true }))
    } else {
      response.writeHead(401).end()
    }

  } else if (endpoint === 'logout') {
    const cookie = parseCookie(request)
    const { token } = cookie

    endSession(token)

    response.setHeader('Set-Cookie', 'token=; Path=/; Max-Age=0; HttpOnly')
    response.end(JSON.stringify({ success: true }))

  } else if (endpoint === 'users') {
    response.end(JSON.stringify(users))

  } else if (endpoint === 'user') {
    if (request.method === 'DELETE') {
      const payload = JSON.parse(await getBody(request))
      const { login } = payload

      deleteUser(login)

      response.end(JSON.stringify({ success: true }))
    } else if (request.method === 'PUT') {
      const payload = JSON.parse(await getBody(request))
      const { login, role } = payload

      updateUser(login, role)

      response.end(JSON.stringify({ success: true }))
    }

  } else if (endpoint === 'sessions') {
    const result = sessions.map(session => ({ login: users.find(user => user.id === session.userId).login, token: session.token }))

    response.end(JSON.stringify(result))

  } else if (endpoint === 'session') {
    if (request.method === 'DELETE') {
      const payload = JSON.parse(await getBody(request))
      const { token } = payload

      endSession(token)

      response.end(JSON.stringify({ success: true }))
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

async function addUser(login, password) {
  const id = generateId()
  const hash = await generateHash(password)
  const noAdmins = users.every(user => user.role !== 'admin')
  const role = noAdmins ? 'admin' : 'user'
  const user = { id, login, hash, role }

  users.push(user)

  saveUsers()
}

function deleteUser(login) {
  const index = users.findIndex(user => user.login === login)
  const id = users[index]?.id

  if (id) {
    users.splice(index, 1)
    saveUsers()

    sessions.filter(session => session.userId === id)
      .forEach(session => endSession(session.token))
    saveSessions()
  }
}

function updateUser(login, role) {
  const user = users.find(user => user.login === login)
  
  if (user) user.role = role
}

function startSession(user) {
  const id = generateId()
  const token = generateToken()

  sessions.push({ id, userId: user.id, token })

  saveSessions()

  return token
}

function checkAuth(request) {
  const cookie = parseCookie(request)
  const { token } = cookie

  const session = sessions.find(session => session.token === token)

  return !!session
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

function loadData() {
  try {
    fs.mkdirSync('data')
  } catch { }

  try {
    users.push(...JSON.parse(fs.readFileSync('data/users.json')))
  } catch { }

  try {
    sessions.push(...JSON.parse(fs.readFileSync('data/sessions.json')))
  } catch { }
}

function saveUsers() {
  try {
    fs.writeFileSync('data/users.json', JSON.stringify(users, null, 2))
  } catch (error) {
    console.error(error)
  }
}

function saveSessions() {
  try {
    fs.writeFileSync('data/sessions.json', JSON.stringify(sessions, null, 2))
  } catch (error) {
    console.error(error)
  }
}

function parseCookie(request) {
  const cookie = Object.fromEntries((request.headers.cookie || '').split('; ').map(str => str.split('=')))

  return cookie
}

function endSession(token) {
  const index = sessions.findIndex(session => session.token === token)

  if (index !== -1) sessions.splice(index, 1)

  saveSessions()
}

function generateHash(password) {
  return hash(password)
}