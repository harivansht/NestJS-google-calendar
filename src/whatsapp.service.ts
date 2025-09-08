import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

interface WhatsAppSendResult {
  success: boolean;
  providerResponse?: any;
  error?: any;
}

@Injectable()
export class WhatsAppService {
  private client: AxiosInstance;
  private token: string | null = null;
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;

  constructor() {
    this.baseUrl =
      process.env.WHATSAPP_API_BASE_URL ||
      'https://portal.tubelightcommunications.com/whatsapp/api/v1/send';

    this.username = process.env.WHATSAPP_USERNAME || '';
    this.password = process.env.WHATSAPP_PASSWORD || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Login and get a fresh bearer token.
   */
  private async login(): Promise<string> {
    const loginUrl =
      process.env.WHATSAPP_LOGIN_URL ||
      'https://portal.tubelightcommunications.com/api/authentication/login';

    const resp = await axios.post(loginUrl, {
      username: this.username,
      password: this.password,
    });

    if (!resp.data) {
      throw new Error('Login failed: no token received');
    }

    const token = resp.data.token || resp.data; // depends on API response
    this.token = token;

    // update axios client header
    this.client.defaults.headers['Authorization'] = `Bearer ${token}`;

    return token;
  }

  /**
   * Ensure we have a valid token before making API requests.
   */
  private async ensureAuth() {
    if (!this.token) {
      await this.login();
    }
  }

  /**
   * Send freeform text message (non-template).
   */
  async sendMessage(to: string, message: string): Promise<WhatsAppSendResult> {
    try {
      await this.ensureAuth();

      const payload = {
        to: [to],
        message: {
          type: 'text',
          text: message,
        },
      };

      const resp = await this.client.post('', payload);
      return { success: true, providerResponse: resp.data };
    } catch (err) {
      // if token expired, retry once
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await this.login();
        return this.sendMessage(to, message);
      }

      console.error('WhatsApp sendMessage failed', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : err,
      };
    }
  }

  /**
   * Send approved template-based message.
   */
  async sendTemplateMessage(
    to: string,
    templateCode: string,
    bodyParams: string[] = [],
  ): Promise<WhatsAppSendResult> {
    try {
      if (!templateCode) {
        return { success: false, error: 'Template code is required' };
      }

      await this.ensureAuth();

      const payload = {
        to: [to],
        message: {
          template_name: templateCode,
          language: 'en',
          type: 'template',
          body_params: bodyParams,
        },
      };

      const resp = await this.client.post('', payload);
      return { success: true, providerResponse: resp.data };
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await this.login();
        return this.sendTemplateMessage(to, templateCode, bodyParams);
      }

      console.error('sendTemplateMessage error', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : err,
      };
    }
  }
}
