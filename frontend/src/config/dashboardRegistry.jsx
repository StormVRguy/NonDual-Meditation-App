import GroupOneDashboard from '../pages/GroupOneDashboard'
import GroupTwoDashboard from '../pages/GroupTwoDashboard'
import CohortOneDashboard from '../pages/CohortOneDashboard'
import CohortTwoDashboard from '../pages/CohortTwoDashboard'

const DASHBOARD_COMPONENTS = {
  groupOne: GroupOneDashboard,
  groupTwo: GroupTwoDashboard,
  cohortOne: CohortOneDashboard,
  cohortTwo: CohortTwoDashboard,
}

export function getDashboardComponent(variant) {
  return DASHBOARD_COMPONENTS[variant] ?? null
}
