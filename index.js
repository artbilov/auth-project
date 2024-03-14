const { createServer } = require('http')
const fs = require('fs')
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
  if (request.url === '/' || request.url === '/index.html') {
    response.writeHead(200, { 'Content-Type': 'text/html' })
    fs.createReadStream('index.html').pipe(response)
  }
}

function handleAPI(request, response) {

}



