// src/google/google.controller.ts
import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { GoogleService } from './app.service';

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get('auth')
  async auth(@Res() res) {
    const url = this.googleService.generateAuthUrl();
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
}
