export interface Job {
  id: string;
  timestamp: string;
  company: string;
  startdate: string;
  enddate: string;
  status: string;
  instagram: string;
  linkedin: string;
  web: string;
  kategori: string;
  note: string;
  buktiurl: string;
  rownum: number;
  platform?: string;
  careerlevel?: string;
  currentstage?: string;
  province?: string;
  city?: string;
  otherlink?: string;
}

export interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  targetcompany: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Mastered' | 'Practice Needed';
  rownum: number;
}
