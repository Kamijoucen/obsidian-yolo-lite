export class EmptyChatTitleException extends Error {
  constructor() {
    super('Chat title cannot be empty')
    this.name = 'EmptyChatTitleException'
  }
}
