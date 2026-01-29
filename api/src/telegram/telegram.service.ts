import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { PublicHotelsService } from '../branch/public-hotels.service.js';
import { PublicBookingService } from './public-booking.service.js';

interface UserSession {
  step:
    | 'idle'
    | 'entering_check_in'
    | 'entering_check_out'
    | 'selecting_room'
    | 'entering_name'
    | 'entering_phone'
    | 'confirming';
  hotelId?: string;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  roomTypeId?: string;
  roomTypeName?: string;
  roomPrice?: number;
  currency?: string;
  nights?: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: TelegramBot;
  private readonly logger = new Logger(TelegramService.name);
  private sessions: Map<number, UserSession> = new Map();

  constructor(
    private publicHotelsService: PublicHotelsService,
    private publicBookingService: PublicBookingService,
  ) {}

  onModuleInit() {
    const instanceId =
      process.env.NODE_APP_INSTANCE || process.env.pm_id || '0';
    if (instanceId !== '0') {
      this.logger.log(`Skipping Telegram bot on PM2 instance ${instanceId}`);
      return;
    }
    this.initializeBot();
  }

  private getSession(chatId: number): UserSession {
    if (!this.sessions.has(chatId)) {
      this.sessions.set(chatId, { step: 'idle' });
    }
    return this.sessions.get(chatId)!;
  }

  private resetSession(chatId: number) {
    this.sessions.set(chatId, { step: 'idle' });
  }

  private initializeBot() {
    const token = process.env.BOT_TOKEN;
    if (!token) {
      this.logger.warn('BOT_TOKEN not defined. Bot disabled.');
      return;
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.logger.log('✅ Telegram Bot started');

    // /start - Welcome
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      this.resetSession(chatId);

      await this.bot.sendMessage(
        chatId,
        `🏨 *Welcome to HMS Hotel Booking!*\n\n` +
          `I'll help you find and book hotels.\n\n` +
          `� *Share your location* to find nearby hotels.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [
              [{ text: '📍 Share Location', request_location: true }],
              [{ text: '🏠 Start Over' }],
            ],
            resize_keyboard: true,
          },
        },
      );
    });

    // Start Over button
    this.bot.onText(/🏠 Start Over/, async (msg) => {
      const chatId = msg.chat.id;
      this.resetSession(chatId);
      await this.bot.sendMessage(
        chatId,
        `🏨 *Ready to book!*\n\n📍 Share your location to find hotels.`,
        { parse_mode: 'Markdown' },
      );
    });

    // /cancel
    this.bot.onText(/\/cancel/, async (msg) => {
      this.resetSession(msg.chat.id);
      await this.bot.sendMessage(
        msg.chat.id,
        '❌ Cancelled. Send /start to begin again.',
      );
    });

    // Location - Find hotels
    this.bot.on('location', async (msg) => {
      const chatId = msg.chat.id;
      if (!msg.location) return;

      const { latitude, longitude } = msg.location;
      this.logger.log(`📍 Location: ${latitude}, ${longitude}`);

      await this.bot.sendMessage(chatId, '🔍 Finding hotels...');

      try {
        const hotels = await this.publicHotelsService.findNearby(
          latitude,
          longitude,
        );

        if (hotels.length === 0) {
          await this.bot.sendMessage(chatId, '😔 No hotels found nearby.');
          return;
        }

        const buttons = hotels.slice(0, 8).map((h) => [
          {
            text: `${h.isFeatured ? '⭐ ' : ''}${h.name} (${h.distance.toFixed(1)}km)`,
            callback_data: `hotel_${h.id}`,
          },
        ]);

        await this.bot.sendMessage(
          chatId,
          `✅ Found *${hotels.length}* hotels!\n\nSelect one:`,
          {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons },
          },
        );
      } catch (err: any) {
        this.logger.error('Hotel search error:', err.message);
        await this.bot.sendMessage(
          chatId,
          '❌ Error finding hotels. Try again.',
        );
      }
    });

    // Callback queries
    this.bot.on('callback_query', async (query) => {
      if (!query.message || !query.data) return;
      const chatId = query.message.chat.id;
      const data = query.data;
      const session = this.getSession(chatId);

      await this.bot.answerCallbackQuery(query.id);

      // Hotel selected
      if (data.startsWith('hotel_')) {
        const hotelId = data.replace('hotel_', '');
        try {
          const hotel = await this.publicHotelsService.getHotelDetails(hotelId);
          session.hotelId = hotelId;
          session.hotelName = hotel.name;
          session.step = 'entering_check_in';

          await this.bot.sendMessage(
            chatId,
            `🏨 *${hotel.name}*\n\n` +
              `📅 Enter *check-in date*:\n\n` +
              `Format: \`DD MM YYYY\` or \`DD.MM.YYYY\`\n` +
              `Example: \`30 01 2026\` or \`30.01.2026\``,
            { parse_mode: 'Markdown' },
          );
        } catch (err) {
          await this.bot.sendMessage(chatId, '❌ Error loading hotel.');
        }
      }

      // Room selected
      if (data.startsWith('room_')) {
        const parts = data.split('_');
        session.roomTypeId = parts[1];
        session.roomPrice = parseFloat(parts[2]);
        session.currency = parts[3];
        session.step = 'entering_name';

        await this.bot.sendMessage(
          chatId,
          `✅ Room selected!\n\n👤 Enter your *full name*:\n\nExample: \`John Doe\``,
          { parse_mode: 'Markdown' },
        );
      }

      // Confirm
      if (data === 'confirm') {
        await this.createBooking(chatId, session);
      }

      // Cancel
      if (data === 'cancel') {
        this.resetSession(chatId);
        await this.bot.sendMessage(
          chatId,
          '❌ Cancelled. Send /start to try again.',
        );
      }
    });

    // Text messages
    this.bot.on('message', async (msg) => {
      if (
        !msg.text ||
        msg.text.startsWith('/') ||
        msg.location ||
        msg.text.includes('🏠')
      )
        return;

      const chatId = msg.chat.id;
      const text = msg.text.trim();
      const session = this.getSession(chatId);

      // Check-in date
      if (session.step === 'entering_check_in') {
        const parsed = this.parseDate(text);
        if (!parsed) {
          await this.bot.sendMessage(
            chatId,
            '❌ Invalid date.\n\nUse: `DD MM YYYY` or `DD.MM.YYYY`\nExample: `30 01 2026`',
            { parse_mode: 'Markdown' },
          );
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsed < today) {
          await this.bot.sendMessage(
            chatId,
            '❌ Date must be today or in the future.',
          );
          return;
        }

        session.checkIn = this.formatDate(parsed);
        session.step = 'entering_check_out';

        await this.bot.sendMessage(
          chatId,
          `✅ Check-in: *${this.formatDateDisplay(session.checkIn)}*\n\n` +
            `📅 Now enter *check-out date*:`,
          { parse_mode: 'Markdown' },
        );
        return;
      }

      // Check-out date
      if (session.step === 'entering_check_out') {
        const parsed = this.parseDate(text);
        if (!parsed) {
          await this.bot.sendMessage(
            chatId,
            '❌ Invalid date.\n\nUse: `DD MM YYYY` or `DD.MM.YYYY`\nExample: `02 02 2026`',
            { parse_mode: 'Markdown' },
          );
          return;
        }

        const checkInDate = new Date(session.checkIn!);
        if (parsed <= checkInDate) {
          await this.bot.sendMessage(
            chatId,
            '❌ Check-out must be after check-in.',
          );
          return;
        }

        session.checkOut = this.formatDate(parsed);
        session.nights = Math.ceil(
          (parsed.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        await this.showRooms(chatId, session);
        return;
      }

      // Guest name
      if (session.step === 'entering_name') {
        const parts = text.split(/\s+/);
        if (parts.length < 2) {
          await this.bot.sendMessage(
            chatId,
            '❌ Please enter first and last name.\n\nExample: `John Doe`',
            { parse_mode: 'Markdown' },
          );
          return;
        }

        session.firstName = parts[0];
        session.lastName = parts.slice(1).join(' ');
        session.step = 'entering_phone';

        await this.bot.sendMessage(
          chatId,
          `✅ Name: *${session.firstName} ${session.lastName}*\n\n📞 Enter your *phone number*:`,
          { parse_mode: 'Markdown' },
        );
        return;
      }

      // Phone
      if (session.step === 'entering_phone') {
        if (text.replace(/\D/g, '').length < 7) {
          await this.bot.sendMessage(
            chatId,
            '❌ Please enter a valid phone number.',
          );
          return;
        }

        session.phone = text;
        session.step = 'confirming';
        await this.showConfirmation(chatId, session);
        return;
      }
    });
  }

  // Parse date: DD MM YYYY, DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
  private parseDate(text: string): Date | null {
    // Normalize separators to spaces
    const normalized = text
      .replace(/[\.\/-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const parts = normalized.split(' ');

    if (parts.length !== 3) return null;

    const [p1, p2, p3] = parts.map((p) => parseInt(p));

    // DD MM YYYY
    if (p1 <= 31 && p2 <= 12 && p3 >= 2020) {
      const date = new Date(p3, p2 - 1, p1);
      if (!isNaN(date.getTime()) && date.getDate() === p1) return date;
    }

    // YYYY MM DD
    if (p1 >= 2020 && p2 <= 12 && p3 <= 31) {
      const date = new Date(p1, p2 - 1, p3);
      if (!isNaN(date.getTime()) && date.getDate() === p3) return date;
    }

    return null;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatDateDisplay(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
  }

  private async showRooms(chatId: number, session: UserSession) {
    try {
      const availability = await this.publicBookingService.checkAvailability({
        branchId: session.hotelId!,
        checkIn: session.checkIn!,
        checkOut: session.checkOut!,
      });

      if (availability.roomTypes.length === 0) {
        await this.bot.sendMessage(
          chatId,
          '😔 No rooms available. Send /start to try different dates.',
        );
        this.resetSession(chatId);
        return;
      }

      session.currency = availability.branch.currency;
      session.step = 'selecting_room';

      const buttons = availability.roomTypes.map((r) => [
        {
          text: `${r.name} - ${availability.branch.currency}${r.basePrice}/night`,
          callback_data: `room_${r.id}_${r.basePrice}_${availability.branch.currency}`,
        },
      ]);

      await this.bot.sendMessage(
        chatId,
        `🏨 *${session.hotelName}*\n` +
          `📅 ${this.formatDateDisplay(session.checkIn!)} → ${this.formatDateDisplay(session.checkOut!)} (${session.nights} nights)\n\n` +
          `Select a room:`,
        {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons },
        },
      );
    } catch (err: any) {
      await this.bot.sendMessage(
        chatId,
        `❌ ${err.message || 'Error checking availability.'}`,
      );
    }
  }

  private async showConfirmation(chatId: number, session: UserSession) {
    const total = (session.roomPrice || 0) * (session.nights || 1);

    await this.bot.sendMessage(
      chatId,
      `📋 *Booking Summary*\n\n` +
        `🏨 ${session.hotelName}\n` +
        `📅 ${this.formatDateDisplay(session.checkIn!)} → ${this.formatDateDisplay(session.checkOut!)}\n` +
        `🌙 ${session.nights} nights\n` +
        `👤 ${session.firstName} ${session.lastName}\n` +
        `📞 ${session.phone}\n\n` +
        `💰 *Total: ${session.currency}${total.toLocaleString()}*`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Confirm Booking', callback_data: 'confirm' }],
            [{ text: '❌ Cancel', callback_data: 'cancel' }],
          ],
        },
      },
    );
  }

  private async createBooking(chatId: number, session: UserSession) {
    await this.bot.sendMessage(chatId, '⏳ Creating booking...');

    try {
      const result = await this.publicBookingService.createPublicBooking({
        branchId: session.hotelId!,
        roomTypeId: session.roomTypeId!,
        checkIn: session.checkIn!,
        checkOut: session.checkOut!,
        firstName: session.firstName!,
        lastName: session.lastName!,
        phone: session.phone!,
        citizenship: 'N/A',
        passportSeries: 'XX',
        passportNumber: '0000000',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        telegramUserId: String(chatId),
      });

      await this.bot.sendMessage(
        chatId,
        `🎉 *Booking Confirmed!*\n\n` +
          `📌 Confirmation: \`${result.confirmationNumber}\`\n\n` +
          `🏨 ${result.hotel}\n` +
          `🛏️ ${result.room}\n` +
          `📅 ${this.formatDateDisplay(session.checkIn!)} → ${this.formatDateDisplay(session.checkOut!)}\n` +
          `🌙 ${result.nights} nights\n` +
          `💰 ${result.currency} ${result.totalAmount.toLocaleString()}\n\n` +
          `Show this at the hotel. Thank you! 🙏`,
        { parse_mode: 'Markdown' },
      );

      this.resetSession(chatId);
    } catch (err: any) {
      await this.bot.sendMessage(
        chatId,
        `❌ ${err.message || 'Booking failed.'}\n\nSend /start to try again.`,
      );
      this.resetSession(chatId);
    }
  }
}
