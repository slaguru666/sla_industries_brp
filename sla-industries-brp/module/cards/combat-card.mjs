import { BRPCheck } from "../apps/check.mjs"
import { OPCard } from "./opposed-card.mjs"

export class CBCard {


  //Resolve a combat card - roll dice, update and close
  static async CBResolve(config) {
    let targetMsg = await game.messages.get(config.targetChatId)
    if (!targetMsg) return
    let flags = BRPCheck.getChatFlags(targetMsg)
    let chatCards = Array.isArray(flags.chatCard) ? [...flags.chatCard] : []
    if (!chatCards.length) return

    //Sort chatCards by result level, by roll and then by rawValue
    chatCards.sort(function (a, b) {
      let x = a.rawScore;
      let y = b.rawScore;
      let r = a.rollVal;
      let s = b.rollVal;
      let p = a.resultLevel;
      let q = b.resultLevel;
      if (p > q) { return -1 };
      if (p < q) { return 1 };
      if (r > s) { return -1 };
      if (r < s) { return 1 };
      if (x > y) { return -1 };
      if (x < y) { return 1 };
      return 0;
    });

    let newchatCards = []
    //Get the success level of the second placed person
    let adjLevel = 0
    if (chatCards.length > 1) {
      adjLevel = chatCards[1].resultLevel
      adjLevel = Math.max(adjLevel - 1, 0)
    }
    for (let i of chatCards) {
      i.origResLevel = i.resultLevel
      if (i.origResLevel > 1) {
        i.resultLevel = Math.max(i.resultLevel - adjLevel, 2)
      }
      i.resultLabel = game.i18n.localize('BRP.resultLevel.' + i.resultLevel)
      i.origResLabel = game.i18n.localize('BRP.resultLevel.' + i.origResLevel)
      newchatCards.push(i)
      await OPCard.showDiceRoll(i)
    }

    flags = {
      ...flags,
      chatCard: newchatCards,
      state: 'closed'
    }
    await targetMsg.update(BRPCheck.getChatFlagUpdate(flags))
    const pushhtml = await BRPCheck.startChat(flags)
    await targetMsg.update({ content: pushhtml })
    await BRPCheck.tickXP(flags)
    return
  }


}
