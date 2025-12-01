export type UserRole =
  "ROLE_USER" |
  "ROLE_ADMIN"

export type UserStatus =
  "ACTIVE" |
  "INACTIVE" |
  "DISABLE" |
  "LOCKED" |
  "SUSPENDED"

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  role: {
    id: number,
    name: string,
    permission: {
      id: number,
      name: string,
      description: string,
      active: boolean
    }[]
  };
  isLocked: boolean;
  phone: string;
}

export interface UserMini {
  id: number;
  fullName: string;
  email: string;
  role: UserRole,
  status: UserStatus;
  avatarURL: string;
}
export interface SubmissionBatch {
  id: number,
  name: string, // batchName
  term: string,
  examCode: string, // batchExamCode
  submissions: Submission[]
}

export interface Submission {
  id: number, // submissionId
  submissionFile: string, // submissionFileContent
  json_submission: any | null, // submissionJsonData
  studentCode: string,
  examCode: string, // submissionExamCode
  submitTime: string, // submissionTime
  status: string, // submissionStatus
  gradingStatus?: string,
  gradingFinalScore?: number,
  gradingFeedback?: string,
  gradingScoreJson?: string,
  gradingConfirmedAt?: string,
  gradingRound?: number,
  gradingEscalated?: boolean,
  submitterUserId?: number,
  graderUserId?: number | null,
  linkedSubmissionId?: number,
  gradingProcessId?: number
}

// New interface for server response
export interface BatchSubmissionResponse {
  [key: string]: {
    batchName: string,
    batchExamCode: string,
    submissions: Array<{
      submissionFileContent: string,
      submissionBatchId: number,
      studentCode: string,
      submissionJsonData: any,
      submissionExamCode: string,
      gradingFinalScore: number,
      linkedSubmissionId: number,
      gradingProcessId: number,
      graderUserId: number | null,
      gradingEscalated: boolean,
      submissionTime: string,
      submitterUserId: number,
      gradingFeedback: string,
      submissionId: number,
      gradingStatus: string,
      submissionStatus: string,
      gradingConfirmedAt: string,
      gradingScoreJson: string,
      gradingRound: number
    }>
  }
}
