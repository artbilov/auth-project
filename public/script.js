const logoutBtn = document.querySelector('button')
const userTable = document.querySelector('table')

logoutBtn.onclick = logOut
userTable.onclick = handleDelete

getUsers().then(showUsers)

async function logOut() {
  const response = await fetch('/api/logout')

  if (response.ok) {
    window.location = '/lobby.html'
  }
}

async function handleDelete(event) {
  if (event.target.classList.contains('delete')) {
    const row = event.target.closest('tr')
    const login = row.querySelector('td').textContent
    const response = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login }),
    })

    if (response.ok) {
      getUsers().then(showUsers)
    }
  }
}

async function getUsers() {
  const response = await fetch('/api/users')
  const users = await response.json()
  return users
}

function showUsers(users) {
  const tbody = document.querySelector('tbody')
  const html = users
    .map(buildRow)
    .join('')
  tbody.innerHTML = html
}

function buildRow(user) {
  return `
    <tr>
      <td>${user.login}</td>
      <td>${user.password}</td>
      <td><button class="delete">Delete</button></td>
    </tr>
  `
}
