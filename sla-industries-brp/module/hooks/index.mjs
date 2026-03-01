import * as DrawNote from "./draw-note.mjs";
import * as RenderItemSheet from './render-item-sheet.mjs'
import * as RenderActorSheet from './render-actor-sheet.mjs'
import * as RenderDialog from './render-dialog.mjs'
import * as RenderActorDirectory from './render-actor-directory.mjs'
import * as RenderItemDirectory from './render-item-directory.mjs'
import * as RenderJournalDirectory from './render-journal-directory.mjs'
import * as RenderChatMessage from './render-chat-message.mjs'
import * as RenderNoteConfig from './render-note-config.js'
import * as CreateToken from './create-token.mjs'


export const BRPHooks = {
  listen() {
    DrawNote.listen()
    CreateToken.listen()
    RenderActorSheet.listen()
    RenderItemSheet.listen()
    RenderDialog.listen()
    RenderActorDirectory.listen()
    RenderItemDirectory.listen()
    RenderJournalDirectory.listen()
    RenderChatMessage.listen()
    RenderNoteConfig.listen()
  }
}
