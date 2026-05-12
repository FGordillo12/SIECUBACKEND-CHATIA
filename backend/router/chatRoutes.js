import express from 'express';
import {
  postChatMessage,
  getChatHistory,
  deleteChatHistory,
} from '../controllers/chat/chatController.js';

export const routerChat = express.Router();

routerChat.post('/chat/message', postChatMessage);
routerChat.get('/chat/history/:sessionId', getChatHistory);
routerChat.delete('/chat/history/:sessionId', deleteChatHistory);
