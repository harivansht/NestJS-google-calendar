// import { Injectable, Logger } from '@nestjs/common';
// import { DataSource } from 'typeorm';
// import {
//   CommunicationService,
//   GenericMessageDto,
// } from './communication.service';
// import { GoogleService } from './calendar-event.service';
// import { IcsMeetingService } from 'src/module/ics/service/ics.service';

// interface CommunicationConfig {
//   level_id: number;
//   level_type: string;
//   communication_config_type: string;
//   provider: string;
//   config_id: number;
//   service: string;
//   status: number;
// }

// interface UserContext {
//   level_id: number;
//   level_type: string;
//   organization_id: number;
//   id?: number;
// }

// interface MailPayload {
//   to: string | string[];
//   message?: string;
//   subject: string;
//   cc?: string | string[];
//   bcc?: string | string[];
//   html?: string;
//   templateCode?: string;
//   variables?: Record<string, any>;
// }

// interface MeetingPayload extends MailPayload {
//   attendees?: Array<{ email: string | string[] } | string>;
//   eventId?: string;
//   templateId?: string;
// }

// @Injectable()
// export class WrapperService {
//   private readonly logger = new Logger(WrapperService.name);

//   constructor(
//     private readonly datasource: DataSource,
//     private readonly communicationService: CommunicationService,
//     private readonly googleService: GoogleService,
//     private readonly icsService: IcsMeetingService,
//   ) {}

//   /**
//    * Wrapper for sending mail
//    */
//   async sendMailWrapper(payload: any, loggedInUser: any) {
//     try {
//       this.logger.log(
//         `sendMailWrapper called. User: ${JSON.stringify(loggedInUser)}, Payload: ${JSON.stringify(payload)}`,
//       );

//       const { level_id, level_type, organization_id } = loggedInUser;

//       // 1. Check for config at user’s level
//       this.logger.debug(
//         `Fetching configs for level_id=${level_id}, level_type=${level_type}`,
//       );
//       const configs = await this.datasource.query(
//         `SELECT *
//          FROM cr_communication_hub
//          WHERE level_id = ?
//            AND level_type = ?
//            AND status = 1
//            AND communication_config_type = 'EMAIL'`,
//         [level_id, level_type],
//       );
//       this.logger.debug(`Configs found: ${JSON.stringify(configs)}`);

//       let templateCode: string | undefined;

//       if (payload.templateCode) {
//         this.logger.debug(
//           `Looking up templateCode=${payload.templateCode} for current level`,
//         );
//         const template = await this.datasource.query(
//           `SELECT rich_text FROM cr_wf_comm_template WHERE code = ? LIMIT 1`,
//           [payload.templateCode],
//         );
//         this.logger.debug(
//           `Template lookup result: ${JSON.stringify(template)}`,
//         );

//         if (template && template.length > 0) {
//           payload.message = template[0]?.rich_text;
//         } else {
//           this.logger.warn(
//             `No template found for templateCode=${payload.templateCode} and current level`,
//           );
//         }
//       }

//       let payloadSendMail: GenericMessageDto;

//       if (configs && configs.length > 0) {
//         this.logger.debug(`Using user-level configs`);
//         payloadSendMail = {
//           levelId: level_id,
//           levelType: level_type,
//           to: payload.to,
//           message: payload.message,
//           subject: payload.subject,
//           type: 'EMAIL',
//           cc: payload.cc,
//           bcc: payload.bcc,
//           html: payload.html,
//           // attachments: payload.attachments,
//           // templateId: templateCode,
//           variables: payload.variables,
//         };
//       } else {
//         this.logger.warn(
//           `No user-level configs found. Falling back to ORG-level`,
//         );
//         const fallbackConfigs = await this.datasource.query(
//           `SELECT *
//            FROM cr_communication_hub
//            WHERE level_type = 'ORG'
//              AND communication_config_type = 'EMAIL'`,
//         );
//         this.logger.debug(
//           `ORG-level configs: ${JSON.stringify(fallbackConfigs)}`,
//         );

//         if (!fallbackConfigs || fallbackConfigs.length === 0) {
//           this.logger.warn('No active email communication config found');
//         }

//         payloadSendMail = {
//           levelId: 1,
//           levelType: 'ORG',
//           to: payload.to,
//           message: payload.message,
//           subject: payload.subject,
//           type: 'EMAIL',
//           cc: payload.cc,
//           bcc: payload.bcc,
//           html: payload.html,
//           // attachments: payload.attachments,
//           // templateId: payload.templateId,
//           variables: payload.variables,
//         };
//       }

//       this.logger.debug(
//         `Final payload for CommunicationService: ${JSON.stringify(payloadSendMail)}`,
//       );

//       const result =
//         await this.communicationService.sendGenericMessage(payloadSendMail);

//       this.logger.log(
//         `sendMailWrapper SUCCESS. Result: ${JSON.stringify(result)}`,
//       );

//       return {
//         success: true,
//         data: result,
//       };
//     } catch (error: any) {
//       this.logger.error(`sendMailWrapper ERROR: ${error.message}`, error.stack);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }

//   async scheduleMeetingWrapper(payload: MeetingPayload, loggedInUser: UserContext) {
//     try {
//       this.logger.log(`scheduleMeetingWrapper called by user=${loggedInUser?.id || 'unknown'}`);

//       const { level_id, level_type } = loggedInUser;

//       // Normalize attendees
//       payload.attendees = this.normalizeAttendees(payload);

//       // Try user-level configs first
//       const userConfigs = await this.getMeetingConfigs(loggedInUser, true);

//       if (userConfigs && userConfigs.length > 0) {
//         const provider = userConfigs[0]?.provider;
//         const configId = userConfigs[0]?.config_id;

//         if (provider === 'gmail') {
//           const creds = await this.getConfigCred(configId);
//           if (creds) {
//             return await this.handleGoogleCalendar(creds, payload, 'user');
//           }
//         }

//         // Non-Gmail user-level fallback
//         return {
//           success: true,
//           data: await this.sendIcsFallback(payload, level_id, level_type),
//         };
//       }

//       // Try ORG-level configs
//       this.logger.log(`No user-level config found, checking ORG-level...`);

//       const orgConfigs = await this.getMeetingConfigs(loggedInUser, false);

//       if (orgConfigs && orgConfigs.length > 0) {
//         const provider = orgConfigs[0]?.provider;
//         const configId = orgConfigs[0]?.config_id;

//         if (provider === 'gmail') {
//           const creds = await this.getConfigCred(configId);
//           if (creds) {
//             return await this.handleGoogleCalendar(creds, payload, 'ORG');
//           }
//         }

//         // Non-Gmail ORG-level fallback
//         return {
//           success: true,
//           data: await this.sendIcsFallback(payload, 1, 'ORG'),
//         };
//       }

//       // Absolute fallback (no configs at all)
//       this.logger.warn(`No configs found at any level, sending fallback ICS email`);
//       return {
//         success: true,
//         data: await this.sendIcsFallback(payload, level_id, level_type),
//       };

//     } catch (error: any) {
//       this.logger.error(`scheduleMeetingWrapper ERROR: ${error.message}`, error.stack);
//       return { success: false, error: error.message };
//     }
//   }

//   /**
//    * Fetch credentials JSON by config ID
//    */
//   private async getConfigCred(configId: number) {
//     this.logger.debug(`Fetching config JSON for configId=${configId}`);
//     const configRes = await this.datasource.query(
//       `SELECT config_json
//        FROM cr_communication_config
//        WHERE id = ?`,
//       [configId],
//     );
//     this.logger.debug(`Config fetch result: ${JSON.stringify(configRes)}`);
//     return configRes?.[0]?.config_json || null;
//   }

//   /**
//    * Send ICS fallback via email
//    */
//   private async sendIcsFallback(
//     payload: MeetingPayload,
//     levelId: number,
//     levelType: string,
//   ) {
//     this.logger.log(`Generating ICS file for fallback`);

//     // Generate both raw ICS (for inline) and base64 (for attachment)
//     const icsText = this.icsService.generateIcsText(payload);
//     const base64String = this.icsService.generateIcs(payload);
//     this.logger.debug(`ICS generated (base64 length: ${base64String?.length})`);

//     // Normalize attendees
//     const attendeeEmails =
//       payload.attendees?.flatMap((a) =>
//         typeof a === 'string' ? [a] :
//         Array.isArray(a.email) ? a.email : [a.email],
//       ) || [];

//     // Combine into one list (to + attendees)
//     const toList = [
//       ...(Array.isArray(payload.to)
//         ? payload.to
//         : payload.to
//           ? [payload.to]
//           : []),
//       ...attendeeEmails,
//     ];

//     const payloadSendMail: GenericMessageDto = {
//       levelId,
//       levelType,
//       to: toList,
//       message: payload.message || '',
//       subject: payload.subject,
//       type: 'EMAIL',
//       cc: payload.cc,
//       bcc: payload.bcc,
//       html: payload.html,
//       // Add inline calendar alternative to trigger RSVP UI in clients
//       alternatives: [
//         {
//           contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
//           content: icsText,
//           headers: { 'Content-Class': 'urn:content-classes:calendarmessage' },
//         },
//       ],
//       attachments: [
//         {
//           content: base64String,
//           type: 'text/calendar; method=REQUEST; charset=UTF-8',
//           filename: 'invite.ics',
//           disposition: 'attachment',
//         },
//       ],
//       templateId: payload.templateId,
//       variables: payload.variables,
//     };

//     this.logger.debug(`Sending ICS fallback email`);
//     const result = await this.communicationService.sendGenericMessage(payloadSendMail);
//     this.logger.log(`ICS fallback mail sent successfully`);
//     return result;
//   }

//   // ================= HELPER METHODS =================

//   /**
//    * Get communication config with fallback logic
//    */
//   private async getCommunicationConfig(
//     user: UserContext,
//     configType: string
//   ): Promise<{ level_id: number; level_type: string }> {
//     const { level_id, level_type } = user;

//     // Try user-level first
//     this.logger.debug(`Fetching ${configType} config for level_id=${level_id}, level_type=${level_type}`);

//     const userConfigs = await this.datasource.query<CommunicationConfig[]>(
//       `SELECT * FROM cr_communication_hub
//        WHERE level_id = ? AND level_type = ? AND status = 1
//        AND communication_config_type = ?`,
//       [level_id, level_type, configType]
//     );

//     if (userConfigs && userConfigs.length > 0) {
//       this.logger.debug(`Using user-level ${configType} config`);
//       return { level_id, level_type };
//     }

//     // Fallback to ORG-level
//     this.logger.warn(`No user-level ${configType} config found. Falling back to ORG-level`);

//     const orgConfigs = await this.datasource.query<CommunicationConfig[]>(
//       `SELECT * FROM cr_communication_hub
//        WHERE level_type = 'ORG' AND communication_config_type = ?`,
//       [configType]
//     );

//     if (!orgConfigs || orgConfigs.length === 0) {
//       this.logger.warn(`No active ${configType} communication config found at any level`);
//     }

//     return { level_id: 1, level_type: 'ORG' };
//   }

//   /**
//    * Process template if templateCode provided
//    */
//   private async processTemplate(payload: MailPayload): Promise<MailPayload> {
//     if (!payload.templateCode) {
//       return payload;
//     }

//     this.logger.debug(`Processing template: ${payload.templateCode}`);

//     const template = await this.datasource.query(
//       `SELECT rich_text FROM cr_wf_comm_template WHERE code = ? LIMIT 1`,
//       [payload.templateCode]
//     );

//     if (template && template.length > 0 && template[0]?.rich_text) {
//       this.logger.debug(`Template found and applied`);
//       return { ...payload, message: template[0].rich_text };
//     } else {
//       this.logger.warn(`No template found for templateCode=${payload.templateCode}`);
//       return payload;
//     }
//   }

//   /**
//    * Get meeting configs with provider filtering
//    */
//   private async getMeetingConfigs(
//     user: UserContext,
//     isUserLevel: boolean
//   ): Promise<CommunicationConfig[]> {
//     const { level_id, level_type } = user;

//     const query = isUserLevel
//       ? `SELECT * FROM cr_communication_hub
//          WHERE level_id = ? AND level_type = ? AND status = 1
//          AND communication_config_type = 'EMAIL' AND service = 'API'`
//       : `SELECT * FROM cr_communication_hub
//          WHERE level_id = 1 AND level_type = 'ORG'
//          AND communication_config_type = 'EMAIL' AND service = 'API'`;

//     const params = isUserLevel ? [level_id, level_type] : [];

//     return await this.datasource.query<CommunicationConfig[]>(query, params);
//   }

//   /**
//    * Normalize email lists and attendees
//    */
//   private normalizeAttendees(payload: MeetingPayload): Array<{ email: string }> {
//     const cleanEmails = (arr: string[] = []) =>
//       arr.filter((e) => e && e.trim() !== '').map((e) => e.trim());

//     const toList = Array.isArray(payload.to) ? cleanEmails(payload.to as string[]) :
//                    payload.to ? [payload.to as string] : [];
//     const ccList = Array.isArray(payload.cc) ? cleanEmails(payload.cc as string[]) :
//                    payload.cc ? [payload.cc as string] : [];
//     const bccList = Array.isArray(payload.bcc) ? cleanEmails(payload.bcc as string[]) :
//                     payload.bcc ? [payload.bcc as string] : [];

//     const existingAttendees = (payload.attendees || []).flatMap((a) =>
//       typeof a === 'string'
//         ? [{ email: a }]
//         : Array.isArray(a?.email)
//           ? a.email.map((e) => ({ email: e }))
//           : a?.email
//             ? [{ email: a.email as string }]
//             : [],
//     );

//     return [
//       ...toList.map((e) => ({ email: e })),
//       ...ccList.map((e) => ({ email: e })),
//       ...bccList.map((e) => ({ email: e })),
//       ...existingAttendees,
//     ];
//   }

//   /**
//    * Handle Google Calendar operations (create/update)
//    */
//   private async handleGoogleCalendar(
//     creds: any,
//     payload: MeetingPayload,
//     levelType: string
//   ): Promise<{ success: boolean; data: any }> {
//     this.logger.log(`Using Google Calendar (${levelType}-level)`);

//     let result;
//     if (payload.eventId) {
//       result = await this.googleService.updateEvent(creds, payload.eventId, payload);
//     } else {
//       result = await this.googleService.createEvent(creds, payload);
//     }

//     this.logger.log(`Google Calendar operation SUCCESS (${levelType}-level)`);
//     return { success: true, data: result };
//   }
// }
