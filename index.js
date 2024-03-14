const { createServer } = require('http')
const fs = require('fs')
const { mimeTypes } = require('./mime-types.js')
const server = createServer(handleRequest)
const port = 1234

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

function handleAPI(request, response) {

}



