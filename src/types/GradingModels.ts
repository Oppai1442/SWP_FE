import type { Submission } from "./Model";

export interface GradeResponse {
  submissionId: number;
  studentId: string;
  totalScore: number;
  answers: AnswerDTO[];
}

export interface AnswerDTO {
  id: number;
  question: string;
  answer: string;
  feedback: string;
  weight: number;
  score: number;
  plagiarismCheck: {
    isPlagiarized: boolean;
    similarityScore: number;
    matchedSubmissions: [
      {
        submissionId:string;
        similarity:number;
      }
    ],
    comments: string; // List of submissions that matched
  }
}

export interface GradedSubmission {
  id: number;
  submission: {
    studentCode: string;
    examCode: string;
    term: string;
    status: string;
    title: string;
    submitTime: string;
    batch: {
      id: number;
      name: string;
      term: string;
      examCode: string;
      question: string;
      submitTime: string;
    };
  };
  //  "grader": null,
  //     "round": 1,
  //     "scoreJson": "{\"totalScore\": 9.0, \"breakdown\": {\"request1\": 2.0, \"request2\": 2.0, \"request3\": 3.0, \"request4\": 2.0}}",
  //     "finalScore": 9,
  //     "feedback": "Overall, this submission demonstrates a solid understanding of various project management concepts. The stakeholder and risk analyses are comprehensive, reflecting good strategic thinking. The schedule analysis includes accurate PERT calculations, critical path determination, and appropriate resource leveling recommendations. The EVM calculations are correct and well-interpreted, with suitable forecasting methods. Some areas for improvement include providing more detailed engagement strategies for lower influence stakeholders and elaborating on corrective actions for project overruns. Additionally, ensure to explicitly justify the choice of EAC in your analysis for full clarity.",
  //     "status": "GRADED",
  grader: string | null;
  round: number;
  scoreJson: string;
  finalScore: number;
  feedback: string;
  status: string;
  answers: string;
}

export interface GradingResponse {
  data: GradedSubmission[];
  meta?: {
    total: number;
    page: number;
    lastPage: number;
  };
}

export interface GradingFilters {
  searchTerm: string;
  examCode: string;
}
