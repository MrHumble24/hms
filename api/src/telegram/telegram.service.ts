import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { PublicHotelsService } from '../branch/public-hotels.service.js';
import { PublicBookingService } from './public-booking.service.js';

interface UserSession {
  step:
    | 'idle'
    | 'selecting_hotel'
    | 'selecting_dates'
    | 'selecting_room'
    | 'entering_guest_info'
    | 'confirming';
  selectedHotelId?: string;
  selectedHotelName?: string;
  checkIn?: string;
  checkOut?: string;
  selectedRoomTypeId?: string;
  selectedRoomTypeName?: string;
  guestInfo?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    citizenship?: string;
    passportSeries?: string;
    passportNumber?: string;
    dateOfBirth?: string;
    gender?: 'MALE' | 'FEMALE';
  };
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
    // In PM2 cluster mode, only start the bot on instance 0 to avoid 409 conflicts
    const instanceId =
      process.env.NODE_APP_INSTANCE || process.env.pm_id || '0';

    if (instanceId !== '0') {
      this.logger.log(
        `Skipping Telegram bot on PM2 instance ${instanceId} (only runs on instance 0)`,
      );
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

  private initializeBot() {
    const token = process.env.BOT_TOKEN;

    if (!token) {
      this.logger.warn('BOT_TOKEN is not defined. Telegram Bot is disabled.');
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: true });
      this.logger.log('✅ Telegram Bot initialized and polling...');

      // /start command
      this.bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        this.sessions.set(chatId, { step: 'idle' });

        const welcomeText =
          `🏨 *Welcome to HMS Booking Bot!*\n\n` +
          `I can help you find and book hotels near your location.\n\n` +
          `� *Share your location* to discover nearby hotels\n` +
          `🔍 Or use */search [city]* to search by city name\n\n` +
          `Let's find your perfect stay! 👇`;

        await this.bot.sendMessage(chatId, welcomeText, {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [
              [{ text: '📍 Share My Location', request_location: true }],
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
          },
        });
      });

      // /cancel command
      this.bot.onText(/\/cancel/, async (msg) => {
        const chatId = msg.chat.id;
        this.sessions.set(chatId, { step: 'idle' });
        await this.bot.sendMessage(
          chatId,
          '❌ Booking cancelled. Send /start to begin again.',
        );
      });

      // Location handler
      this.bot.on('location', async (msg) => {
        const chatId = msg.chat.id;
        if (!msg.location) return;

        const { latitude, longitude } = msg.location;
        this.logger.log(
          `📍 User ${chatId} shared location: ${latitude}, ${longitude}`,
        );

        await this.bot.sendMessage(
          chatId,
          '🔍 *Searching for the best hotels near you...*',
          { parse_mode: 'Markdown' },
        );

        try {
          const hotels = await this.publicHotelsService.findNearby(
            latitude,
            longitude,
          );

          if (hotels.length === 0) {
            await this.bot.sendMessage(
              chatId,
              '😔 No hotels found within 50km of your location.',
            );
            return;
          }

          await this.bot.sendMessage(
            chatId,
            `✅ *Found ${hotels.length} hotels!* Tap one to check availability:`,
            { parse_mode: 'Markdown' },
          );

          // Show hotels as inline buttons
          const inlineKeyboard = hotels.slice(0, 10).map((hotel) => [
            {
              text: `${hotel.isFeatured ? '⭐ ' : ''}${hotel.name} (${hotel.distance.toFixed(1)}km)`,
              callback_data: `hotel_${hotel.id}`,
            },
          ]);

          await this.bot.sendMessage(chatId, 'Select a hotel:', {
            reply_markup: { inline_keyboard: inlineKeyboard },
          });

          // Update session
          const session = this.getSession(chatId);
          session.step = 'selecting_hotel';
        } catch (err) {
          this.logger.error('Error searching hotels:', err);
          await this.bot.sendMessage(
            chatId,
            '❌ Error searching for hotels. Please try again.',
          );
        }
      });

      // Callback query handler (for inline buttons)
      this.bot.on('callback_query', async (query) => {
        if (!query.message || !query.data) return;
        const chatId = query.message.chat.id;
        const data = query.data;
        const session = this.getSession(chatId);

        await this.bot.answerCallbackQuery(query.id);

        // Hotel selection
        if (data.startsWith('hotel_')) {
          const hotelId = data.replace('hotel_', '');
          session.selectedHotelId = hotelId;
          session.step = 'selecting_dates';

          await this.bot.sendMessage(
            chatId,
            `🏨 Great choice!\n\nNow, please enter your *check-in date* in format:\n\`YYYY-MM-DD\`\n\nExample: \`2026-02-15\``,
            { parse_mode: 'Markdown' },
          );
        }

        // Room type selection
        if (data.startsWith('room_')) {
          const roomTypeId = data.replace('room_', '');
          session.selectedRoomTypeId = roomTypeId;
          session.step = 'entering_guest_info';

          await this.bot.sendMessage(
            chatId,
            `✅ Room selected!\n\nNow I need your guest information.\n\nPlease enter your *First Name*:`,
            { parse_mode: 'Markdown' },
          );
          session.guestInfo = {};
        }

        // Booking confirmation
        if (data === 'confirm_booking') {
          await this.processBooking(chatId, session);
        }

        if (data === 'cancel_booking') {
          this.sessions.set(chatId, { step: 'idle' });
          await this.bot.sendMessage(
            chatId,
            '❌ Booking cancelled. Send /start to try again.',
          );
        }
      });

      // Text message handler (for date and guest info input)
      this.bot.on('message', async (msg) => {
        if (!msg.text || msg.text.startsWith('/') || msg.location) return;
        const chatId = msg.chat.id;
        const text = msg.text.trim();
        const session = this.getSession(chatId);

        // Date input handling
        if (session.step === 'selecting_dates') {
          if (!session.checkIn) {
            // Validate date format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
              await this.bot.sendMessage(
                chatId,
                '❌ Invalid format. Please use YYYY-MM-DD (e.g., 2026-02-15)',
              );
              return;
            }
            session.checkIn = text;
            await this.bot.sendMessage(
              chatId,
              `✅ Check-in: *${text}*\n\nNow enter your *check-out date*:`,
              { parse_mode: 'Markdown' },
            );
          } else {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
              await this.bot.sendMessage(
                chatId,
                '❌ Invalid format. Please use YYYY-MM-DD',
              );
              return;
            }
            session.checkOut = text;
            await this.showAvailableRooms(chatId, session);
          }
          return;
        }

        // Guest info collection
        if (session.step === 'entering_guest_info' && session.guestInfo) {
          const info = session.guestInfo;

          if (!info.firstName) {
            info.firstName = text;
            await this.bot.sendMessage(chatId, 'Enter your *Last Name*:', {
              parse_mode: 'Markdown',
            });
          } else if (!info.lastName) {
            info.lastName = text;
            await this.bot.sendMessage(chatId, 'Enter your *Phone Number*:', {
              parse_mode: 'Markdown',
            });
          } else if (!info.phone) {
            info.phone = text;
            await this.bot.sendMessage(
              chatId,
              'Enter your *Citizenship* (e.g., Uzbekistan):',
              { parse_mode: 'Markdown' },
            );
          } else if (!info.citizenship) {
            info.citizenship = text;
            await this.bot.sendMessage(
              chatId,
              'Enter your *Passport Series* (e.g., AA):',
              { parse_mode: 'Markdown' },
            );
          } else if (!info.passportSeries) {
            info.passportSeries = text;
            await this.bot.sendMessage(
              chatId,
              'Enter your *Passport Number*:',
              { parse_mode: 'Markdown' },
            );
          } else if (!info.passportNumber) {
            info.passportNumber = text;
            await this.bot.sendMessage(
              chatId,
              'Enter your *Date of Birth* (YYYY-MM-DD):',
              { parse_mode: 'Markdown' },
            );
          } else if (!info.dateOfBirth) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
              await this.bot.sendMessage(
                chatId,
                '❌ Invalid format. Use YYYY-MM-DD',
              );
              return;
            }
            info.dateOfBirth = text;
            await this.bot.sendMessage(chatId, 'Select your *Gender*:', {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '👨 Male', callback_data: 'gender_MALE' },
                    { text: '👩 Female', callback_data: 'gender_FEMALE' },
                  ],
                ],
              },
            });
          }
          return;
        }
      });

      // Gender selection callback
      this.bot.on('callback_query', async (query) => {
        if (!query.data?.startsWith('gender_')) return;
        const chatId = query.message!.chat.id;
        const session = this.getSession(chatId);

        await this.bot.answerCallbackQuery(query.id);

        if (session.guestInfo) {
          session.guestInfo.gender = query.data.replace('gender_', '') as
            | 'MALE'
            | 'FEMALE';
          session.step = 'confirming';
          await this.showBookingSummary(chatId, session);
        }
      });
    } catch (err) {
      this.logger.error('Failed to initialize Telegram Bot:', err);
    }
  }

  private async showAvailableRooms(chatId: number, session: UserSession) {
    try {
      const availability = await this.publicBookingService.checkAvailability({
        branchId: session.selectedHotelId!,
        checkIn: session.checkIn!,
        checkOut: session.checkOut!,
      });

      session.selectedHotelName = availability.branch.name;

      if (availability.roomTypes.length === 0) {
        await this.bot.sendMessage(
          chatId,
          '😔 No rooms available for these dates. Try different dates by sending /start',
        );
        return;
      }

      const roomButtons = availability.roomTypes.map((rt) => [
        {
          text: `${rt.name} - ${availability.branch.currency} ${rt.basePrice}/night (${rt.availableRooms} left)`,
          callback_data: `room_${rt.id}`,
        },
      ]);

      await this.bot.sendMessage(
        chatId,
        `🏨 *${availability.branch.name}*\n` +
          `📅 ${session.checkIn} → ${session.checkOut} (${availability.nights} nights)\n\n` +
          `Select a room type:`,
        {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: roomButtons },
        },
      );

      session.step = 'selecting_room';
    } catch (err: any) {
      await this.bot.sendMessage(
        chatId,
        `❌ ${err.message || 'Error checking availability'}`,
      );
    }
  }

  private async showBookingSummary(chatId: number, session: UserSession) {
    const info = session.guestInfo!;
    const summary =
      `📋 *Booking Summary*\n\n` +
      `🏨 *Hotel:* ${session.selectedHotelName}\n` +
      `📅 *Check-in:* ${session.checkIn}\n` +
      `📅 *Check-out:* ${session.checkOut}\n\n` +
      `👤 *Guest:* ${info.firstName} ${info.lastName}\n` +
      `📞 *Phone:* ${info.phone}\n` +
      `🛂 *Passport:* ${info.passportSeries}${info.passportNumber}\n\n` +
      `Is this information correct?`;

    await this.bot.sendMessage(chatId, summary, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Confirm Booking', callback_data: 'confirm_booking' }],
          [{ text: '❌ Cancel', callback_data: 'cancel_booking' }],
        ],
      },
    });
  }

  private async processBooking(chatId: number, session: UserSession) {
    const info = session.guestInfo!;

    await this.bot.sendMessage(chatId, '⏳ Processing your booking...');

    try {
      const result = await this.publicBookingService.createPublicBooking({
        branchId: session.selectedHotelId!,
        roomTypeId: session.selectedRoomTypeId!,
        checkIn: session.checkIn!,
        checkOut: session.checkOut!,
        firstName: info.firstName!,
        lastName: info.lastName!,
        phone: info.phone!,
        citizenship: info.citizenship!,
        passportSeries: info.passportSeries!,
        passportNumber: info.passportNumber!,
        dateOfBirth: info.dateOfBirth!,
        gender: info.gender!,
        telegramUserId: String(chatId),
      });

      const successMessage =
        `🎉 *Booking Confirmed!*\n\n` +
        `📌 *Confirmation #:* \`${result.confirmationNumber}\`\n` +
        `🏨 *Hotel:* ${result.hotel}\n` +
        `🛏️ *Room:* ${result.room}\n` +
        `📅 *Check-in:* ${session.checkIn}\n` +
        `📅 *Check-out:* ${session.checkOut}\n` +
        `🌙 *Nights:* ${result.nights}\n` +
        `💰 *Total:* ${result.currency} ${result.totalAmount.toLocaleString()}\n\n` +
        `Please present this confirmation at the hotel reception.\n\n` +
        `Thank you for booking with HMS! 🙏`;

      await this.bot.sendMessage(chatId, successMessage, {
        parse_mode: 'Markdown',
      });

      // Reset session
      this.sessions.set(chatId, { step: 'idle' });
    } catch (err: any) {
      await this.bot.sendMessage(
        chatId,
        `❌ Booking failed: ${err.message || 'Unknown error'}\n\nPlease try again with /start`,
      );
      this.sessions.set(chatId, { step: 'idle' });
    }
  }
}
