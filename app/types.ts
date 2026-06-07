type CaseT = {
  case_number: string;
  case_year: string;

  client_name: string;
  client_opponent_name: string;

  client_role: string;
  client_opponent_role: string;

  client_national_id: string;
  client_opponent_national_id: string;

  latest_court_session_date: string;
  next_court_session_date: string;

  case_status: string;
  case_notes: string;
};

export type { CaseT };
