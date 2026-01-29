import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { PublicHotelsService } from '../branch/public-hotels.service.js';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: TelegramBot;
  private readonly logger = new Logger(TelegramService.name);

  // Mini App URL - configure in .env for production
  private readonly miniAppUrl =
    process.env.MINI_APP_URL || 'https://hms.centrify.uz/tg';

  constructor(private publicHotelsService: PublicHotelsService) {}

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

        const welcomeText =
          `🏨 *Welcome to HMS Booking Bot!*\n\n` +
          `I can help you find and book the best hotels near your location.\n\n` +
          `📍 *Share your location* to discover nearby hotels\n\n` +
          `Tap the button below to get started! 👇`;

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

      // Location handler - Shows hotels with Mini App booking buttons
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
          {
            parse_mode: 'Markdown',
          },
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
            `✅ *Found ${hotels.length} hotels near you!*`,
            {
              parse_mode: 'Markdown',
            },
          );

          // Show each hotel with photos and a "Book Now" Mini App button
          for (const hotel of hotels.slice(0, 5)) {
            const isPromoted = hotel.isFeatured ? '🌟 *PROMOTED* 🌟\n' : '';
            const distance = `📏 ${hotel.distance.toFixed(1)} km away`;
            const price = hotel.startingPrice
              ? `\n💰 Rooms from ${hotel.currency} ${hotel.startingPrice}`
              : '';
            const rating = hotel.starRating ? ` ⭐ ${hotel.starRating}` : '';

            const caption =
              `${isPromoted}` +
              `🏩 *${hotel.name}*${rating}\n` +
              `📍 ${hotel.address || 'Address available at hotel'}\n` +
              `${distance}${price}`;

            // Mini App WebApp button
            const inlineKeyboard = {
              inline_keyboard: [
                [
                  {
                    text: '🔥 Book Now',
                    web_app: { url: `${this.miniAppUrl}?hotel=${hotel.id}` },
                  },
                ],
                [
                  {
                    text: '📞 Call Hotel',
                    callback_data: `call_${hotel.id}`,
                  },
                  {
                    text: '📍 Show on Map',
                    callback_data: `map_${hotel.id}`,
                  },
                ],
              ],
            };

            if (hotel.logoUrl) {
              await this.bot.sendPhoto(chatId, hotel.logoUrl, {
                caption,
                parse_mode: 'Markdown',
                reply_markup: inlineKeyboard,
              });
            } else {
              await this.bot.sendMessage(chatId, caption, {
                parse_mode: 'Markdown',
                reply_markup: inlineKeyboard,
              });
            }
          }

          // Show "View All" button if there are more hotels
          if (hotels.length > 5) {
            await this.bot.sendMessage(
              chatId,
              `📋 *${hotels.length - 5} more hotels available*\n\nOpen the full list to see all options:`,
              {
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '🔍 View All Hotels',
                        web_app: {
                          url: `${this.miniAppUrl}?lat=${latitude}&lng=${longitude}`,
                        },
                      },
                    ],
                  ],
                },
              },
            );
          }
        } catch (err) {
          this.logger.error('Error searching hotels:', err);
          await this.bot.sendMessage(
            chatId,
            '❌ Error searching for hotels. Please try again.',
          );
        }
      });

      // Callback handlers for Call and Map
      this.bot.on('callback_query', async (query) => {
        if (!query.message || !query.data) return;
        const chatId = query.message.chat.id;
        const data = query.data;

        await this.bot.answerCallbackQuery(query.id);

        if (data.startsWith('call_')) {
          const hotelId = data.replace('call_', '');
          try {
            const hotel =
              await this.publicHotelsService.getHotelDetails(hotelId);
            if (hotel.phone) {
              await this.bot.sendMessage(
                chatId,
                `📞 *${hotel.name}*\n\nPhone: ${hotel.phone}\n\nTap to call or copy the number.`,
                { parse_mode: 'Markdown' },
              );
            } else {
              await this.bot.sendMessage(
                chatId,
                '📞 Phone number not available for this hotel.',
              );
            }
          } catch (err) {
            await this.bot.sendMessage(
              chatId,
              '❌ Could not load hotel information.',
            );
          }
        }

        if (data.startsWith('map_')) {
          const hotelId = data.replace('map_', '');
          try {
            const hotel =
              await this.publicHotelsService.getHotelDetails(hotelId);
            if (hotel.latitude && hotel.longitude) {
              await this.bot.sendLocation(
                chatId,
                hotel.latitude,
                hotel.longitude,
              );
            } else {
              await this.bot.sendMessage(
                chatId,
                '📍 Location not available for this hotel.',
              );
            }
          } catch (err) {
            await this.bot.sendMessage(
              chatId,
              '❌ Could not load hotel location.',
            );
          }
        }
      });
    } catch (err) {
      this.logger.error('Failed to initialize Telegram Bot:', err);
    }
  }
}
