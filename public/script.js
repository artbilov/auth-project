const logoutBtn = document.querySelector('button')
const [userTable, sessionTable] = document.querySelectorAll('table')

logoutBtn.onclick = logOut
userTable.onclick = handleDeleteUser
sessionTable.onclick = handleDeleteSession

getUsers().then(showUsers)
getSessions().then(showSessions)

async function logOut() {
  const response = await fetch('/api/logout')

  if (response.ok) {
    window.location = '/lobby.html'
  }
}

async function handleDeleteUser(event) {
  if (event.target.classList.contains('delete')) {
    const row = event.target.closest('tr')
    const login = row.querySelector('td').textContent
    const response = await fetch('/api/user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login }),
    })

    if (response.ok) {
      getUsers().then(showUsers)
    }
  }
}

async function handleDeleteSession(event) {
  if (event.target.classList.contains('delete')) {
    const row = event.target.closest('tr')
    const token = row.querySelector('td:nth-child(2)').textContent
    const response = await fetch('/api/session', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (response.ok) {
      getSessions().then(showSessions)
    }
  }
}

async function getSessions() {
  const response = await fetch('/api/sessions')
  const sessions = await response.json()
  return sessions
}

async function getUsers() {
  const response = await fetch('/api/users')
  const users = await response.json()
  return users
}

function showUsers(users) {
  const tbody = userTable.querySelector('tbody')
  const html = users
    .map(buildUserRow)
    .join('')
  tbody.innerHTML = html
}

function showSessions(sessions) {
  const tbody = sessionTable.querySelector('tbody')
  const html = sessions
    .map(buildSessionRow)
    .join('')
  tbody.innerHTML = html
}

function buildUserRow(user) {
  return `
    <tr>
      <td>${user.login}</td>
      <td>${user.password}</td>
      <td><button class="delete">Delete</button></td>
    </tr>
  `
}

function buildSessionRow(session) {
  return `
    <tr>
      <td>${session.login}</td>
      <td>${session.token}</td>
      <td><button class="delete">Delete</button></td>
    </tr>
  `
}
