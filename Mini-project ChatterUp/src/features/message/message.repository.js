import { MessageModel } from "./message.schema.js";


export class MessageRepository {
  async saveMessage(username, content,avatarUrl) {
    const newMessage = new MessageModel({
      username,
      content,
      avatarUrl
    });
    return await newMessage.save();
  }
  async getRecentMessages(limit=20){
    return await MessageModel.find().sort({timestamp:1}).limit(limit);
  }
}
