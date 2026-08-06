import { axiosInstance } from '../core/axiosInstance';

export type DemoRequestBody = {
  lastName: string;
  firstName: string;
  workEmail: string;
  company: string;
  title: string;
  phone: string;
  useCases: string[];
  otherDetail?: string;
};

/** 도입 문의 제출. 서버가 운영 메일함으로 발송한다. */
export async function submitDemoRequest(body: DemoRequestBody): Promise<void> {
  await axiosInstance.post('/marketing/demo-requests', body);
}
