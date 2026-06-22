import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import * as cbtStore from './store/index.js'

// CDP 검증용 훅 (파일럿). 화면은 이걸 쓰지 않는다.
if (typeof window !== 'undefined') window.__cbt = cbtStore

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
