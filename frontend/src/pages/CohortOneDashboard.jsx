import Dashboard from './Dashboard'
import PlaceholderWeeklyIntro from '../components/PlaceholderWeeklyIntro'
import { dashboardFeatures } from '../config/dashboardFeatures'
import { qualtricsSurveyUrls } from '../config/qualtricsSurveyUrls'

function CohortOneDashboard({ onLogout }) {
  return (
    <Dashboard
      onLogout={onLogout}
      pageTitle="Dashboard del Corso di Meditazione Non Duale"
      introContent={<PlaceholderWeeklyIntro />}
      {...dashboardFeatures.coreOnly}
      useDefaultQualtricsUrl={false}
      questionnaireSurveyUrl={qualtricsSurveyUrls.cohortOne}
    />
  )
}

export default CohortOneDashboard
