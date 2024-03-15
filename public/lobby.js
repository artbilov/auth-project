const menu = document.getElementById('menu')
const regForm = document.getElementById('reg-form')
const logForm = document.getElementById('log-form')

prepMenu()
prepRegForm()
prepLogForm()

function prepMenu() {
  const [regBtn, loginBtn] = menu.querySelectorAll('button')

  regBtn.onclick = showRegForm
  loginBtn.onclick = showLogForm
}

function prepRegForm() {
  const [regBtn, cancelBtn] = regForm.querySelectorAll('button')

  regBtn.onclick = (e) => {
    e.preventDefault()

    const login = regForm.login.value
    const password = regForm.password.value

    register(login, password)
  }

  cancelBtn.onclick = () => {
    regForm.hidden = true
    menu.hidden = false
  }
}

function prepLogForm() {
  const [loginBtn, cancelBtn] = logForm.querySelectorAll('button')

  loginBtn.onclick = (e) => {
    e.preventDefault()

    const login = logForm.login.value
    const password = logForm.password.value

    logIn(login, password)
  }

  cancelBtn.onclick = () => {
    logForm.hidden = true
    menu.hidden = false
  }
}

function showRegForm() {
  menu.hidden = true
  regForm.hidden = false
}

function showLogForm() {
  menu.hidden = true
  regForm.hidden = true
  logForm.hidden = false
}

async function register(login, password) {
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  }

  const response = await fetch('/api/register', init)

  if (response.ok) {
    alert('Registration successful. Please log in.')
    showLogForm()
  }
}

async function logIn(login, password) {
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  }

  const response = await fetch('/api/login', init)

  if (response.ok) {
    window.location = '/'
  }
}