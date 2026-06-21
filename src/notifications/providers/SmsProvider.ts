export type SmsSendParams = {
  to: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export type SmsSendResult = {
  providerId?: string;
};

export interface SmsProvider {
  send(params: SmsSendParams): Promise<SmsSendResult>;
}
