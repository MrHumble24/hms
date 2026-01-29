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
        `🏨 *Welcome to HMS!*\n\nI'll help you book a hotel in seconds.\n\n📍 Share your location to find nearby hotels.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '📍 Share Location', request_location: true }]],
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

          await this.bot.sendMessage(
            chatId,
            `🏨 *${hotel.name}*\n\n📍 ${hotel.address || ''}\n\n` +
              `📅 Enter *check-in date*:\n\`YYYY-MM-DD\` (e.g. \`2026-02-10\`)`,
            { parse_mode: 'Markdown' },
          );
        } catch (err) {
          await this.bot.sendMessage(
            chatId,
            '❌ Error loading hotel. Try again.',
          );
        }
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

      // Check-in date
      if (session.step === 'entering_check_in') {
        if (!this.isValidDate(text)) {
          await this.bot.sendMessage(
            chatId,
            '❌ Invalid date. Use format `YYYY-MM-DD`',
            { parse_mode: 'Markdown' },
          );
          return;
        }
        if (new Date(text) < new Date()) {
          await this.bot.sendMessage(chatId, '❌ Date must be in the future.');
          return;
        }

        session.checkIn = text;
        session.step = 'entering_check_out';

        await this.bot.sendMessage(
          chatId,
          `✅ Check-in: *${text}*\n\n📅 Enter *check-out date*:`,
          { parse_mode: 'Markdown' },
        );
        return;
      }

      // Check-out date
      if (session.step === 'entering_check_out') {
        if (!this.isValidDate(text)) {
          await this.bot.sendMessage(
            chatId,
            '❌ Invalid date. Use format `YYYY-MM-DD`',
            { parse_mode: 'Markdown' },
          );
          return;
        }
        if (new Date(text) <= new Date(session.checkIn!)) {
          await this.bot.sendMessage(
            chatId,
            '❌ Check-out must be after check-in.',
          );
          return;
        }

        session.checkOut = text;
        session.nights = Math.ceil(
          (new Date(text).getTime() - new Date(session.checkIn!).getTime()) /
            (1000 * 60 * 60 * 24),
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

  private isValidDate(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime());
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
