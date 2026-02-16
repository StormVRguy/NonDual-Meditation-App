import { Link } from 'react-router-dom'
import './QuestionnaireComplete.css'

function QuestionnaireComplete() {
  return (
    <div className="questionnaire-complete">
      <div className="questionnaire-complete-card">
        <h1>Thank you</h1>
        <p>Your questionnaire responses have been submitted.</p>
        <p className="subtext">You can close this tab or return to your dashboard.</p>
        <Link to="/" className="back-button">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default QuestionnaireComplete
