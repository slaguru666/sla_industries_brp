import { BRPCheck } from "../apps/check.mjs"
import { OPCard } from "./opposed-card.mjs"

export class COCard {


  //Resolve a cooperative card - roll dice, update and close
  static async COResolve(config) {
    let targetMsg = await game.messages.get(config.targetChatId)
    if (!targetMsg) return
    let card = ""
    let flags = BRPCheck.getChatFlags(targetMsg)
    let chatCards = Array.isArray(flags.chatCard) ? [...flags.chatCard] : []
    if (chatCards.length < 2) {
      ui.notifications.warn(game.i18n.localize('BRP.resolveMore'))
      return
    }

    let maxRes = -99
    let minRes = 99
    for (let i = 1; i < chatCards.length; i++) {
      card = chatCards[i]
      maxRes = Math.max(maxRes, card.resultLevel)
      minRes = Math.min(minRes, card.resultLevel)
    }
    let adjVal = 0
    if (minRes === 0) { adjVal = -50 }
    else if (maxRes === 1) { adjVal = -10 }
    else if (maxRes === 2) { adjVal = 20 }
    else if (maxRes === 3) { adjVal = 30 }
    else if (maxRes === 4) { adjVal = 50 }
    card = chatCards[0]
    card.flatMod = card.flatMod + adjVal
    card.targetScore = card.targetScore + adjVal
    let newConfig = {
      rollFormula: "1D100",
      targetScore: card.targetScore
    }
    await BRPCheck.makeRoll(newConfig)

    card.resultLevel = newConfig.resultLevel
    card.roll = newConfig.roll
    card.rollResult = newConfig.rollResult
    card.rollVal = newConfig.rollVal
    card.targetScore = newConfig.targetScore
    card.resultLabel = game.i18n.localize('BRP.resultLevel.' + newConfig.resultLevel)

    let newchatCards = []
    newchatCards.push(card)
    for (let i = 1; i < chatCards.length; i++) {
      card = chatCards[i]
      newchatCards.push(card)
      await OPCard.showDiceRoll(card)
    }
    await OPCard.showDiceRoll(chatCards[0])

    flags = {
      ...flags,
      chatCard: newchatCards,
      successLevel: newConfig.resultLevel,
      successLabel: game.i18n.localize('BRP.resultLevel.' + newConfig.resultLevel),
      successRoll: newConfig.rollVal,
      state: 'closed'
    }
    await targetMsg.update(BRPCheck.getChatFlagUpdate(flags))
    const pushhtml = await BRPCheck.startChat(flags)
    await targetMsg.update({ content: pushhtml })
    if (newConfig.resultLevel > 1) {
      await BRPCheck.tickXP(flags)
    }
    return
  }


}
