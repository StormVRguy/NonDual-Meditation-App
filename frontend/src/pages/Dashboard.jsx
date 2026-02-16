import { getUser, clearAuth } from '../utils/auth'
import './Dashboard.css'

function Dashboard({ onLogout }) {
  const user = getUser()

  const handleLogout = () => {
    clearAuth()
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Meditation Training Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <p>Dashboard features will be implemented in Phase 3</p>
        <p>You are successfully authenticated!</p>
      </div>
    </div>
  )
}

export default Dashboard
