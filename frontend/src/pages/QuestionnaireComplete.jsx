import { Link } from 'react-router-dom'
import './QuestionnaireComplete.css'

function QuestionnaireComplete() {
  return (
    <div className="questionnaire-complete">
      <div className="questionnaire-complete-card">
        <h1>Grazie</h1>
        <p>Le risposte al questionario sono state inviate.</p>
        <p className="subtext">Puoi chiudere questa scheda o tornare alla tua dashboard.</p>
        <Link to="/" className="back-button">
          Torna alla dashboard
        </Link>
      </div>
    </div>
  )
}

export default QuestionnaireComplete
