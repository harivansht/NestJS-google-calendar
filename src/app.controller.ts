// src/google/google.controller.ts
import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { GoogleService } from './app.service';
import { WhatsAppService } from './whatsapp.service';

@Controller('google')
export class GoogleController {
  constructor(
    private readonly googleService: GoogleService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  @Get('auth')
  async auth(@Res() res) {
    const url = await this.googleService.generateAuthUrl();
    return res.redirect(url);
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Res() res) {
    const tokens = await this.googleService.getTokens(code);

    // ⚡ Save refresh_token to DB, linked to the counselor’s userId
    // e.g., user.refreshToken = tokens.refresh_token;

    return res.json({
      message: 'Google account connected!',
      tokens,
    });
  }

  @Post('create')
  async createEvent(@Body() payload: any): Promise<any> {
    // ⚡ In real app, get counselor’s refreshToken from DB
    const userRefreshToken = process.env.USER_REFRESH_TOKEN || '';

    // return this.googleService.createEvent(userRefreshToken, payload);
    return this.googleService.updateEvent(
      payload.eventId || '',
      payload,
      userRefreshToken,
    );
  }

  @Post('send')
  async send(
    @Body()
    body: {
      to: string;
      text?: string;
      templateCode?: string;
      bodyParams?: string[];
    },
  ) {
    const { to, text, templateCode, bodyParams } = body;

    if (!to) {
      return { success: false, error: 'Missing "to" field' };
    }

    // Case 1: Template message
    if (templateCode) {
      return this.whatsappService.sendTemplateMessage(
        to,
        templateCode,
        bodyParams || [],
      );
    }

    // Case 2: Plain text message
    if (text) {
      return this.whatsappService.sendMessage(to, text);
    }

    return {
      success: false,
      error: 'Either "text" or "templateCode" must be provided',
    };
  }
}
