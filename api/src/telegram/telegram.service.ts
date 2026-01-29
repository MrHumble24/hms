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

    // /start - Welcome message
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      this.resetSession(chatId);

      await this.bot.sendMessage(
        chatId,
        `🏨 *Welcome to HMS Hotel Booking!*\n\n` +
          `I'll help you find and book hotels in seconds.\n\n` +
          `👇 *Tap "Share Location"* to discover nearby hotels.`,
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

    // Handle "Start Over" button
    this.bot.onText(/🏠 Start Over/, async (msg) => {
      const chatId = msg.chat.id;
      this.resetSession(chatId);

      await this.bot.sendMessage(
        chatId,
        `🏨 *Ready to book!*\n\n📍 Share your location to find nearby hotels.`,
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

    // /cancel - Cancel booking
    this.bot.onText(/\/cancel/, async (msg) => {
      this.resetSession(msg.chat.id);
      await this.bot.sendMessage(
        msg.chat.id,
        '❌ Cancelled. Send /start to try again.',
      );
    });

    // Location - Find hotels
    this.bot.on('location', async (msg) => {
      const chatId = msg.chat.id;
      if (!msg.location) return;

      const { latitude, longitude } = msg.location;
      this.logger.log(`📍 Location: ${latitude}, ${longitude}`);

      await this.bot.sendMessage(chatId, '🔍 Finding hotels near you...');

      try {
        const hotels = await this.publicHotelsService.findNearby(
          latitude,
          longitude,
        );

        if (hotels.length === 0) {
          await this.bot.sendMessage(
            chatId,
            '😔 No hotels found nearby. Try a different location.',
          );
          return;
        }

        // Show hotels as buttons
        const buttons = hotels.slice(0, 8).map((h) => [
          {
            text: `${h.isFeatured ? '⭐ ' : ''}${h.name} (${h.distance.toFixed(1)}km)${h.startingPrice ? ` - ${h.currency}${h.startingPrice}` : ''}`,
            callback_data: `hotel_${h.id}`,
          },
        ]);

        await this.bot.sendMessage(
          chatId,
          `✅ Found *${hotels.length}* hotels!\n\nSelect one to book:`,
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

    // Callback queries (button clicks)
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

          await this.sendCheckInPrompt(
            chatId,
            hotel.name,
            hotel.address || undefined,
          );
        } catch (err) {
          await this.bot.sendMessage(
            chatId,
            '❌ Error loading hotel. Try again.',
          );
        }
      }

      // Quick date selection for check-in
      if (data.startsWith('checkin_')) {
        const days = parseInt(data.replace('checkin_', ''));
        const date = this.getDateFromNow(days);
        session.checkIn = date;
        session.step = 'entering_check_out';
        await this.sendCheckOutPrompt(chatId, date);
      }

      // Quick date selection for check-out
      if (data.startsWith('checkout_')) {
        const days = parseInt(data.replace('checkout_', ''));
        const checkInDate = new Date(session.checkIn!);
        const date = this.formatDate(
          new Date(checkInDate.getTime() + days * 24 * 60 * 60 * 1000),
        );
        session.checkOut = date;
        session.nights = days;
        await this.showRooms(chatId, session);
      }

      // Room selected
      if (data.startsWith('room_')) {
        const [, roomId, price, currency] = data.split('_');
        session.roomTypeId = roomId;
        session.roomPrice = parseFloat(price);
        session.currency = currency;
        session.step = 'entering_name';

        await this.bot.sendMessage(
          chatId,
          `✅ Room selected!\n\n👤 Enter your *full name*:`,
          { parse_mode: 'Markdown' },
        );
      }

      // Confirm booking
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
      if (!msg.text || msg.text.startsWith('/') || msg.location) return;

      const chatId = msg.chat.id;
      const text = msg.text.trim();
      const session = this.getSession(chatId);

      // Check-in date (text input)
      if (session.step === 'entering_check_in') {
        const parsed = this.parseDate(text);
        if (!parsed) {
          await this.bot.sendMessage(
            chatId,
            '❌ Invalid date. Use DD.MM.YYYY (e.g., 15.02.2026) or use the buttons above.',
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
        await this.sendCheckOutPrompt(chatId, session.checkIn);
        return;
      }

      // Check-out date (text input)
      if (session.step === 'entering_check_out') {
        const parsed = this.parseDate(text);
        if (!parsed) {
          await this.bot.sendMessage(
            chatId,
            '❌ Invalid date. Use DD.MM.YYYY (e.g., 17.02.2026) or use the buttons above.',
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
        const parts = text.split(' ');
        if (parts.length < 2) {
          await this.bot.sendMessage(
            chatId,
            '❌ Please enter first and last name (e.g., John Doe)',
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

      // Phone number
      if (session.step === 'entering_phone') {
        if (text.length < 7) {
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

  // Parse date from various formats: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  private parseDate(text: string): Date | null {
    // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = text.match(/^(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }
    // YYYY-MM-DD
    const ymdMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      const date = new Date(text);
      if (!isNaN(date.getTime())) return date;
    }
    return null;
  }

  // Format date to YYYY-MM-DD
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Get date N days from now formatted
  private getDateFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return this.formatDate(date);
  }

  // Format date for display (DD.MM.YYYY)
  private formatDateDisplay(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
  }

  // Send check-in prompt with quick date buttons
  private async sendCheckInPrompt(
    chatId: number,
    hotelName: string,
    address?: string,
  ) {
    const today = this.formatDateDisplay(this.getDateFromNow(0));
    const tomorrow = this.formatDateDisplay(this.getDateFromNow(1));
    const day2 = this.formatDateDisplay(this.getDateFromNow(2));
    const day3 = this.formatDateDisplay(this.getDateFromNow(3));

    await this.bot.sendMessage(
      chatId,
      `🏨 *${hotelName}*\n${address ? `📍 ${address}\n` : ''}\n` +
        `📅 *When do you want to check in?*\n\nChoose a date or type DD.MM.YYYY:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: `📅 Today (${today})`, callback_data: 'checkin_0' },
              { text: `📅 Tomorrow (${tomorrow})`, callback_data: 'checkin_1' },
            ],
            [
              { text: `📅 ${day2}`, callback_data: 'checkin_2' },
              { text: `📅 ${day3}`, callback_data: 'checkin_3' },
            ],
          ],
        },
      },
    );
  }

  // Send check-out prompt with quick date buttons
  private async sendCheckOutPrompt(chatId: number, checkIn: string) {
    const checkInDate = new Date(checkIn);
    const nights = [1, 2, 3, 5, 7];

    const buttons = nights.map((n) => {
      const d = new Date(checkInDate.getTime() + n * 24 * 60 * 60 * 1000);
      return {
        text: `${n} night${n > 1 ? 's' : ''} (${this.formatDateDisplay(this.formatDate(d))})`,
        callback_data: `checkout_${n}`,
      };
    });

    await this.bot.sendMessage(
      chatId,
      `✅ Check-in: *${this.formatDateDisplay(checkIn)}*\n\n📅 *How many nights?*\n\nChoose or type check-out date (DD.MM.YYYY):`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [buttons.slice(0, 3), buttons.slice(3, 5)],
        },
      },
    );
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
          '😔 No rooms available for these dates. Send /start to try different dates.',
        );
        this.resetSession(chatId);
        return;
      }

      const buttons = availability.roomTypes.map((r) => [
        {
          text: `${r.name} - ${availability.branch.currency}${r.basePrice}/night (${r.availableRooms} left)`,
          callback_data: `room_${r.id}_${r.basePrice}_${availability.branch.currency}`,
        },
      ]);

      session.step = 'selecting_room';
      session.currency = availability.branch.currency;

      await this.bot.sendMessage(
        chatId,
        `🏨 *${session.hotelName}*\n` +
          `📅 ${session.checkIn} → ${session.checkOut} (${session.nights} nights)\n\n` +
          `Select a room:`,
        {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons },
        },
      );
    } catch (err: any) {
      this.logger.error('Room availability error:', err.message);
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
        `📅 ${session.checkIn} → ${session.checkOut}\n` +
        `🌙 ${session.nights} nights\n` +
        `👤 ${session.firstName} ${session.lastName}\n` +
        `📞 ${session.phone}\n\n` +
        `� *Total: ${session.currency}${total.toLocaleString()}*\n\n` +
        `Confirm your booking?`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Confirm', callback_data: 'confirm' }],
            [{ text: '❌ Cancel', callback_data: 'cancel' }],
          ],
        },
      },
    );
  }

  private async createBooking(chatId: number, session: UserSession) {
    await this.bot.sendMessage(chatId, '⏳ Creating your booking...');

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
          `📅 ${session.checkIn} → ${session.checkOut}\n` +
          `🌙 ${result.nights} nights\n` +
          `💰 ${result.currency} ${result.totalAmount.toLocaleString()}\n\n` +
          `Show this at the hotel. Thank you! 🙏`,
        { parse_mode: 'Markdown' },
      );

      this.resetSession(chatId);
    } catch (err: any) {
      this.logger.error('Booking error:', err.message);
      await this.bot.sendMessage(
        chatId,
        `❌ ${err.message || 'Booking failed.'}\n\nSend /start to try again.`,
      );
      this.resetSession(chatId);
    }
  }
}
